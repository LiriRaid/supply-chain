#!/usr/bin/env node
// Waymark · end-of-turn check and provenance record. Registered by INSTALL.md as an end-of-turn hook (Claude Code:
// Stop). Runs locally (0 tokens unless it fires). Supply chain of the agent's work (docs/adr/0001–0004):
// - What can be observed is COMPUTED here from the transcript and git, never declared by the agent (in SLSA terms the
//   platform generates the provenance): memory searched/opened/saved, the procedures.md read, the gates that ran after
//   the last change and how they ended, tests, browser attempts, code-review, docs consulted, branches, time spent.
// - The agent writes only what cannot be observed: `## Cierre · <task ID>` with Resultado · Decisión · Sub-decisiones
//   · Evidencia · Aprendido (bold markers are ignored).
// - A turn routed L1–L3 that changed project files (edit tools, or any file git saw change since the prompt) is blocked
//   once when an ACTION is missing: the decision not backed by the choice window or the user's words, a sub-decision
//   taken alone, no gate after the last code change, no test run after the last spec change, a spec next to changed
//   code left untouched (unless `Tests: no (<why>)`), a pre-existing failure claimed without a clean-copy check, an
//   inference from docs with no docs call, the owner's procedure never read, a commit without `Waymark-Task: <id>`;
//   L2+: UI changed with no browser attempt, code changed with no code-review. A check the user asked to skip for this
//   task (`<Tests|Navegador|Review>: omitido (usuario: "<their words>")`) passes only when those words are in the
//   user's messages. A turn routed Q that changed files is checked as L2.
// - Then the record (observed + Cierre + whatever stayed unresolved) is appended to ~/.waymark/provenance/<slug>.jsonl.
// It never blocks twice in a row (stop_hook_active). Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readTail, currentTurn, routedLevel, routedDept, isPrompt, promptText, sessionTools } from './transcript.mjs';
import { ID, taskIds, validId, taskLines, decisionsIn, appendRecord, turnInputs, commitsFor, changesProject, gitSnapshot, snapshotDiff, loadSnapshot } from './provenance.mjs';

const norm = (p) => String(p || '').replace(/\\/g, '/').toLowerCase();
const exempt = (file) => {
  const f = norm(file), home = norm(os.homedir());
  return f.startsWith(`${home}/.waymark/`) || f.includes('/.claude/projects/') || f.includes('/appdata/local/temp/') || f.startsWith('/tmp/') || f.includes('/scratchpad/');
};
const EDITS = /^(Edit|Write|MultiEdit|NotebookEdit)$/;
const UI = /\.(html|css|scss|sass|less|tsx|jsx|vue|svelte|astro)$|\.component\.ts$/i;
const NOT_CODE = /\.(md|mdx|txt|json|ya?ml|toml|ini|env|lock|csv|svg|png|jpe?g|gif)$/i;
const SPEC = /\.(spec|test)\.[cm]?[jt]sx?$|_spec\.rb$|_test\.(go|py)$|^test_.*\.py$/i;
const TEST = /\b(test|tests|vitest|jest|karma|mocha|pytest|rspec|go test|dotnet test|mvn test|gradle test)\b/i;
const GATE = /\b(tsc|typecheck|type-check|lint|eslint|ng build|build|go vet|mypy|ruff|rubocop|cargo (check|clippy)|node --check)\b/i;
const PRE = /(pre-?existente|preexist|pre-existing|ya (fallaba|exist[ií]a)|fallos? previos?|en c[oó]digo que no cambi)/i;
const DOCS = (t) => (t.name === 'Skill' && /library-docs/.test(String(t.input.skill || ''))) || /^(WebFetch|WebSearch)$/.test(t.name) || /context7|docs?/i.test(t.name) || (t.name === 'Read' && /node_modules|\.d\.ts$/.test(String(t.input.file_path || '')));
const fileOf = (t) => t.input.file_path || t.input.notebook_path || '';
const shell = (t) => /^(Bash|PowerShell)$/.test(t.name);
const cmdOf = (t) => String(t.input.command || '');
const skillCalled = (tools, re) => tools.some((t) => t.name === 'Skill' && re.test(String(t.input.skill || '')));

export { sessionTools }; // moved to transcript.mjs (shared with tool-hook.mjs); kept here for existing importers

function specsNear(files) {
  for (const f of files) {
    const dir = path.dirname(f);
    try {
      const names = fs.readdirSync(dir);
      const hit = names.find((n) => SPEC.test(n)) || (names.includes('__tests__') ? '__tests__' : null);
      if (hit) return path.join(dir, hit).replace(/\\/g, '/');
    } catch {}
  }
  return null;
}

// A check the user asked to skip for this task: `<Field>: omitido (usuario: "<their words>")`, accepted only when those
// words appear in one of the user's messages (accents, case and spacing ignored).
const plain = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
function userSkip(reply, field, prompts) {
  const m = reply.match(new RegExp(`${field}:\\s*omitido \\(usuario:\\s*[“"«]([^”"»]{3,200})[”"»]`, 'i'));
  if (!m) return null;
  return prompts.some((p) => plain(p).includes(plain(m[1]))) ? 'ok' : m[1];
}

// Splits on `sep` outside parentheses and quotes ("a (x; y) → preguntada; b → no preguntada" is two items).
export function splitTop(s, sep = ';') {
  const out = [];
  let depth = 0, quote = '', cur = '';
  for (const ch of String(s || '')) {
    if (quote) { if (ch === quote || (quote === '“' && ch === '”')) quote = ''; }
    else if (ch === '"' || ch === '“') quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === sep && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

const field = (reply, name) => reply.match(new RegExp(`${name}:[ \\t]*([^\\n]*)`, 'i'))?.[1]?.trim() || ''; // same line only

// ctx (optional): { ids } from taskIds() for the heading's task ID, { decisions } from decisionsIn(), { gitChanged },
// { commits }, { branches }. Returns the block reason, or null.
export function checkCierre(turn, last, allTools = turn.tools, prompts = [turn.prompt], ctx = {}) {
  const gaps = cierreGaps(turn, last, allTools, prompts, ctx);
  if (!gaps?.missing.length) return null;
  return `Waymark: this L${gaps.level} turn changed files and is missing: ${gaps.missing.map((m, i) => `${i + 1}) ${m}`).join(' ')}. Do what is missing (or correct the field), then reply with the completed Cierre only.`;
}

// → null (nothing to check: no project files changed, L0) or { level, changed, reply, missing[], dept, observed }.
export function cierreGaps(turn, last, allTools = turn.tools, prompts = [turn.prompt], ctx = {}) {
  // Files changed: by the edit tools, plus what git saw change between the prompt and now (ctx.gitChanged).
  const byKey = new Map();
  for (const f of [...turn.tools.filter((t) => EDITS.test(t.name)).map(fileOf), ...(ctx.gitChanged || [])]) if (f && !exempt(f) && !byKey.has(norm(f))) byKey.set(norm(f), f);
  const changed = [...byKey.values()];
  if (!changed.length) return null;
  const reply = String(last || turn.texts[turn.texts.length - 1] || '').replace(/\*\*|__/g, ''); // **Campo:** reads as Campo:
  const routed = routedLevel([...turn.texts, reply], turn.tools);
  const missing = [];
  if (routed === 'Q') missing.push('this turn was routed as a question (Q) but changed project files: it is a task. Re-route with a tool call (the owner dept-* skill with args "L<n>") and close it as that level');
  const level = routed === 'Q' ? 2 : routed || (/##\s*Cierre/.test(reply) ? 1 : 0);
  if (!level) return null;

  // ---- Observed (computed, never declared) ----
  const where = (t) => `${t.input.file_path || ''} ${t.input.path || ''} ${t.input.pattern || ''} ${t.input.command || ''}`;
  const base = allTools.length - turn.tools.filter((t) => !t.input.slash).length;
  const isChange = (t) => (EDITS.test(t.name) && !exempt(fileOf(t))) || (shell(t) && changesProject(t.input.command));
  const firstChange = allTools.findIndex((t, i) => i >= base && isChange(t));
  const before = (pred) => allTools.some((t, i) => pred(t) && (firstChange < 0 || i < firstChange));
  const dept = { declared: routedDept([...turn.texts, reply], turn.tools), invoked: [...new Set(allTools.filter((t) => t.name === 'Skill' && /^dept-/.test(String(t.input.skill || ''))).map((t) => String(t.input.skill)))] };
  const procRe = dept.declared ? new RegExp(`${dept.declared}[\\\\/]procedures\\.md`) : /procedures\.md/;
  const lastIdx = (pred) => { for (let i = turn.tools.length - 1; i >= 0; i--) if (pred(turn.tools[i])) return i; return -1; };
  const lastCode = lastIdx((t) => (EDITS.test(t.name) && !exempt(fileOf(t)) && !NOT_CODE.test(fileOf(t))) || (shell(t) && changesProject(t.input.command)));
  const lastSpec = lastIdx((t) => EDITS.test(t.name) && SPEC.test(path.basename(fileOf(t))));
  const lastChange = lastIdx(isChange);
  const result = (t) => turn.results?.[t.id];
  const secs = (t) => (result(t)?.at && t.at ? Math.max(0, (result(t).at - t.at) / 1000) : null);
  const gatesAfter = turn.tools.slice(Math.max(lastChange, lastCode) + 1).filter((t) => shell(t) && (GATE.test(cmdOf(t)) || TEST.test(cmdOf(t))));
  const ui = changed.some((f) => UI.test(f));
  const code = changed.filter((f) => !NOT_CODE.test(f));
  const timed = turn.tools.filter((t) => secs(t) !== null);
  const slowest = timed.sort((a, b) => secs(b) - secs(a))[0];
  const observed = {
    memory: {
      searched: before((t) => /mcp__engram__mem_(search|context)/.test(t.name)),
      opened: before((t) => t.name === 'Read' && /[\\/]\.waymark[\\/]projects[\\/]/.test(String(t.input.file_path || ''))),
      saved: turn.tools.some((t) => /mem_(save|update|session_summary)/.test(t.name)),
    },
    procedure: { owner: dept.declared, read: [...new Set(allTools.filter((t) => /procedures\.md/.test(where(t))).map((t) => (where(t).match(/[\w.-]+[\\/]procedures\.md/) || ['procedures.md'])[0].replace(/\\/g, '/')))], readBeforeChange: before((t) => procRe.test(where(t))) },
    gates: gatesAfter.map((t) => ({ cmd: cmdOf(t).replace(/\s+/g, ' ').slice(0, 140), s: secs(t) === null ? null : Math.round(secs(t)), error: !!result(t)?.error })),
    tests: { specsChanged: changed.filter((f) => SPEC.test(path.basename(f))).map((f) => path.basename(f)), ranAfterLastSpec: lastSpec < 0 ? null : turn.tools.slice(lastSpec + 1).some((t) => shell(t) && TEST.test(cmdOf(t))) },
    browser: { ui, tried: turn.tools.filter((t) => (t.name === 'Skill' && /^(browser-verify|run)$/.test(String(t.input.skill || ''))) || /browser|playwright|chrome/i.test(t.name)).map((t) => t.name === 'Skill' ? t.input.skill : t.name).slice(0, 5) },
    review: skillCalled(turn.tools, /(^|:)code-review$/),
    docs: turn.tools.filter(DOCS).length,
    worktree: turn.tools.some((t) => shell(t) && /git\s+worktree\s+add/.test(cmdOf(t))),
    branches: ctx.branches || {},
    time: { minutes: turn.startedAt ? Math.round((Date.now() - turn.startedAt) / 6000) / 10 : null, toolMinutes: Math.round(timed.reduce((a, t) => a + secs(t), 0) / 6) / 10, slowest: slowest ? { tool: slowest.name, what: (cmdOf(slowest) || fileOf(slowest) || String(slowest.input.skill || '')).replace(/\s+/g, ' ').slice(0, 100), s: Math.round(secs(slowest)) } : null },
  };

  // ---- Routing and department ----
  if (!dept.declared) missing.push('the routing line names no owner department: `Waymark → L<n> · dept-<owner> · skills: …`');
  else if (!dept.invoked.includes(dept.declared)) missing.push(`the routing line names ${dept.declared} but it was never invoked in this session: invoke it and follow its Quick ref, or name the department you did follow`);
  else if (!observed.procedure.read.some((p) => procRe.test(p))) missing.push(`${dept.declared}/procedures.md was never read in this session: read the section you followed (search its heading)`);

  // ---- What only the agent can say: the Cierre ----
  const skip = {};
  for (const f of ['Tests', 'Navegador', 'Review']) {
    const s = userSkip(reply, f, prompts);
    if (s === 'ok') skip[f] = true;
    else if (s) missing.push(`${f} says the user asked to skip it ("${s}") but those words are not in the user's messages: run the check, or quote what the user actually wrote`);
  }
  if (!/##\s*Cierre/.test(reply)) missing.push('the "## Cierre · <task ID>" block (Resultado · Decisión · Sub-decisiones · Evidencia · Aprendido)');
  else {
    if (!field(reply, 'Resultado')) missing.push('Resultado: hecho | parcial (<what is missing>) | bloqueado (<why>)');
    if (!field(reply, 'Aprendido') || /^ninguno/i.test(field(reply, 'Aprendido'))) missing.push('Aprendido: <your rewritten Work in progress line> (never "ninguno")');
    if (ctx.ids) {
      const id = reply.match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
      const offer = `${ctx.ids.next} for a new task${ctx.ids.followUp ? `, ${ctx.ids.followUp} for a follow-up of ${ctx.ids.last}` : ''}`;
      if (!id) missing.push(`the task ID in the heading: "## Cierre · <id>" (${offer})`);
      else if (!validId(id, ctx.ids)) missing.push(`the heading's task ID ${id} is already recorded or was never offered: use ${offer}`);
    }
    // The user decides every real decision; the agent never decides alone.
    const d = field(reply, 'Decisi[oó]n');
    const quoted = d.match(/^del usuario \(\s*[“"«]([^”"»]{3,200})[”"»]/i)?.[1];
    if (!d) missing.push('Decisión: elegida <option> · descartadas <options> (the user\'s pick in the choice window) | del usuario ("<their words>") | única (<why>)');
    else if (/^elegida/i.test(d) && ctx.decisions && !ctx.decisions.length) missing.push('Decisión says "elegida" but no choice-window answer exists in this task: ask with the optimal options (AskUserQuestion), or write del usuario ("<their words>") / única (<why>)');
    else if (/^del usuario/i.test(d) && !(quoted && prompts.some((p) => plain(p).includes(plain(quoted))))) missing.push('Decisión: del usuario needs the user\'s own words in quotes, as they wrote them');
    else if (/^[uú]nica/i.test(d) && !/^[uú]nica \(.{3,}\)/i.test(d)) missing.push('Decisión: única (<why there is only one real option>)');
    else if (!/^(elegida|del usuario|[uú]nica)/i.test(d)) missing.push('Decisión: elegida … · descartadas … | del usuario ("<their words>") | única (<why>)');
    const sub = field(reply, 'Sub-?decisiones');
    if (!sub) missing.push('Sub-decisiones: <each decision taken during the task> → preguntada | del usuario ("<their words>") | no preguntada; … — or "ninguna"');
    else if (!/^ninguna\b/i.test(sub)) {
      const items = splitTop(sub, ';');
      const alone = items.filter((s) => /→\s*no preguntada/i.test(s));
      const bad = items.filter((s) => !/→\s*(preguntada|del usuario \(|no preguntada)/i.test(s));
      const asked = items.length - alone.length - bad.length - items.filter((s) => /→\s*del usuario \(/i.test(s)).length + (/^elegida/i.test(d) ? 1 : 0);
      if (bad.length) missing.push(`Sub-decisiones: each item needs "→ preguntada | del usuario (\\"…\\") | no preguntada" (${bad.slice(0, 2).join(' | ')})`);
      if (alone.length) missing.push(`Sub-decisiones taken without asking (${alone.slice(0, 3).join(' | ')}): the user decides every real decision. Put them to the user now with the options (AskUserQuestion), apply the pick, then mark them preguntada`);
      if (ctx.decisions && asked > ctx.decisions.length) missing.push(`Sub-decisiones and Decisión claim ${asked} decisions asked but the choice window answered ${ctx.decisions.length} in this task: ask the missing ones or mark them honestly`);
    }
    const ev = field(reply, 'Evidencia');
    if (!ev) missing.push('Evidencia: observada <what you saw> | inferida de <source> (check: <one line for the user>)');
    else if (/inferida/i.test(ev) && /(doc|documentaci|documentation|oficial|official)/i.test(ev) && !observed.docs) missing.push('Evidencia is inferred from docs but no docs were consulted this turn (library-docs, WebFetch, or the installed package\'s types/source): consult them, or say it comes from memory and give the user a check');
  }

  // ---- Actions (checked from the tool calls) ----
  if (ctx.commits && !ctx.commits.length && turn.tools.some((t) => shell(t) && /\bgit\b[^|;&\n]*\scommit\b/.test(cmdOf(t)))) {
    missing.push('a commit was made this turn but none of the last commits carries the trailer "Waymark-Task: <the heading\'s task ID>": put it in the next commit of this task; amend a commit only if it is not pushed and the user says yes');
  }
  if (lastCode >= 0 && !turn.tools.slice(lastCode + 1).some((t) => shell(t) && GATE.test(cmdOf(t)))) {
    missing.push('no typecheck, lint or build ran after the last code change: run the project\'s gate once now (the full one only at the end, per repo)');
  }
  if (lastSpec >= 0 && !observed.tests.ranAfterLastSpec) missing.push('a spec changed after the last test run: run that spec again');
  const near = code.length ? specsNear(code) : null;
  if (near && !skip.Tests && !observed.tests.specsChanged.length && !/Tests:\s*no \(/i.test(reply)) missing.push(`${near} sits next to the changed code but no spec was added or changed: add a regression spec (red → green), or write Tests: no (<why it cannot cover this>)`);
  if (/Tests:\s*rojo→verde/i.test(reply) && (!observed.tests.specsChanged.length || !turn.tools.some((t) => shell(t) && TEST.test(cmdOf(t))))) missing.push('Tests says rojo→verde but this turn changed no spec or ran no test: write the spec, run it red then green');
  if (PRE.test(reply) && !observed.worktree && !/no comprobado/i.test(reply)) missing.push('a failure is called pre-existing without proof: rerun it in a clean copy of HEAD (git worktree add <tmp> HEAD), or write "previo: no comprobado (<why>)"');
  if (level >= 2 && !skip.Navegador && ui && !observed.browser.tried.length) missing.push('UI files changed but there was no browser attempt (browser-verify or run; curl does not count): run it now; if it cannot reach the page, write Navegador: no (<what failed>; check: <one line for the user>)');
  if (level >= 2 && !skip.Review && code.length && !observed.review) missing.push(`code changed but code-review did not run this turn: run it on the task's files (${code.slice(0, 4).map((f) => path.basename(f)).join(', ')}${code.length > 4 ? '…' : ''})`);
  return { level, changed, reply, missing, dept, observed };
}

// Branch of the repo that holds each changed file (null when not a repo), so the record shows where the work went.
export function branchesOf(files) {
  const out = {};
  for (const dir of [...new Set(files.map((f) => path.dirname(f)))]) {
    if (!fs.existsSync(dir)) continue;
    const top = spawnSync('git', ['rev-parse', '--show-toplevel', '--abbrev-ref', 'HEAD'], { cwd: dir, encoding: 'utf8', timeout: 1000 });
    const [root, branch] = top.status === 0 ? top.stdout.trim().split('\n') : [];
    if (root && !(root in out)) out[root] = branch;
  }
  return out;
}

// The provenance record of a closed turn: what was observed, what the agent said, and what stayed unresolved.
export function provenanceRecord(turn, gaps, ctx, meta = {}) {
  const claimed = gaps.reply.match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
  const ok = claimed && validId(claimed, ctx.ids);
  return {
    id: ok ? claimed : ctx.ids.next, ...(ok ? {} : { idBy: 'hook' }), at: new Date().toISOString(), session: meta.session, cwd: meta.cwd,
    level: gaps.level, department: gaps.dept, prompt: String(turn.prompt || '').slice(0, 600), decisions: ctx.decisions,
    files: [...new Set(gaps.changed)],
    observed: gaps.observed,
    commands: turn.tools.filter(shell).map((t) => cmdOf(t).slice(0, 200)).slice(0, 30),
    skills: [...new Set(turn.tools.filter((t) => t.name === 'Skill').map((t) => String(t.input.skill || '')))],
    inputs: ctx.inputs, commits: ctx.commits || [],
    cierre: (gaps.reply.match(/##\s*Cierre[\s\S]*/)?.[0] || '').slice(0, 2000),
    unresolved: gaps.missing,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input = '', done = false;
  const run = () => {
    if (done) return;
    done = true;
    try {
      const h = JSON.parse(input);
      const lines = readTail(h.transcript_path, 4 * 1024 * 1024), cwd = h.cwd || process.cwd();
      const prompts = lines.filter(isPrompt).map(promptText).slice(-3); // this task: the current prompt and the two before it
      const turn = currentTurn(lines), ctx = { ids: taskIds(cwd), decisions: decisionsIn(taskLines(lines)) };
      const claimed = String(h.last_assistant_message || '').replace(/\*\*|__/g, '').match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
      ctx.commits = commitsFor(cwd, claimed);
      ctx.inputs = turnInputs(taskLines(lines, 1), cwd);
      ctx.gitChanged = snapshotDiff(loadSnapshot(h.session_id), gitSnapshot(cwd)); // taken by the per-prompt hook
      const all = sessionTools(lines);
      const gaps = cierreGaps(turn, h.last_assistant_message, all, prompts, ctx);
      if (!gaps) return;
      if (gaps.missing.length && !h.stop_hook_active) {
        process.stdout.write(JSON.stringify({ decision: 'block', reason: checkCierre(turn, h.last_assistant_message, all, prompts, ctx) }));
        return;
      }
      gaps.observed.branches = branchesOf(gaps.changed);
      try { appendRecord(cwd, provenanceRecord(turn, gaps, ctx, { session: h.session_id, cwd })); } catch {}
    } catch {}
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
