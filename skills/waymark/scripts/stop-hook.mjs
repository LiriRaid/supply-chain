#!/usr/bin/env node
// Waymark · end-of-turn record and evaluation. Registered by INSTALL.md as an end-of-turn hook (Claude Code: Stop).
// Runs locally (0 model tokens unless it blocks). Supply chain of the agent's work (docs/adr/0001–0005):
// - What can be observed is COMPUTED from the transcript and git, never declared by the agent (memory, procedure,
//   gates after the last change with time and failure, tests, browser, code-review, docs, branches, time, tokens).
// - The agent writes only `## Cierre · <task ID>`: Resultado · Decisión · Sub-decisiones · Evidencia · Aprendido.
// - Three things block, once (decision "block"), because without them the chain is broken:
//   1. the decision: Decisión backed by the choice window or the user's words, no sub-decision taken alone;
//   2. a gate after the last change: typecheck/lint/build after the last code change, tests after the last spec change;
//   3. the Cierre complete, with its Aprendido written to the project memory.
//   Everything else (browser, code-review, spec next to the code, docs, pre-existing failures, procedure, department,
//   commit trailer) is a FINDING: recorded and scored, never blocked (user's decision 2026-10-03).
// - Then the record is appended to ~/.waymark/provenance/<slug>.jsonl with an automatic evaluation (routine ✔/✘, score,
//   tokens, estimated quota) and the user sees a one-line summary (systemMessage, 0 model tokens).
// It never blocks twice in a row (stop_hook_active). Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readTail, currentTurn, routedLevel, routedDept, isPrompt, promptText, sessionTools, readSomething, turnUsage } from './transcript.mjs';
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
const MEMORY_FILE = /[\\/]\.waymark[\\/](projects[\\/][^\\/]+\.md|memory\.md|tasks\.md)$/i; // ~/.waymark/projects/<slug>.md or <project>/.waymark/
const TOKENS_PER_PCT = Number(process.env.WAYMARK_TOKENS_PER_PCT) || 1350000; // calibrated on real tasks: 2.19M→2%, 7.66M→5%, 1.8M→2%
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

// The block reason, or null. ctx: { ids, decisions, gitChanged, commits, branches } (all optional).
export function checkCierre(turn, last, allTools = turn.tools, prompts = [turn.prompt], ctx = {}) {
  const gaps = cierreGaps(turn, last, allTools, prompts, ctx);
  if (!gaps?.missing.length) return null;
  return `Waymark: this L${gaps.level} turn changed files and is missing: ${gaps.missing.map((m, i) => `${i + 1}) ${m}`).join(' ')}. Do what is missing (or correct the field), then reply with the completed Cierre only.`;
}

// → null (no project files changed, L0) or { level, changed, reply, missing[] (blocks), findings[] (recorded), dept, observed }.
export function cierreGaps(turn, last, allTools = turn.tools, prompts = [turn.prompt], ctx = {}) {
  const byKey = new Map();
  for (const f of [...turn.tools.filter((t) => EDITS.test(t.name)).map(fileOf), ...(ctx.gitChanged || [])]) if (f && !exempt(f) && !byKey.has(norm(f))) byKey.set(norm(f), f);
  const changed = [...byKey.values()];
  if (!changed.length) return null;
  const full = String(last || turn.texts[turn.texts.length - 1] || '').replace(/\*\*|__/g, ''); // **Campo:** reads as Campo:
  // Fields and claims are read from the Cierre block only: the prose above it ("la decisión: tuya…", "fallos previos")
  // is not a field (found when the hook read a bullet of the reply as Decisión).
  const reply = full.match(/##\s*Cierre[\s\S]*/)?.[0] || full;
  const routed = routedLevel([...turn.texts, full], turn.tools);
  const level = routed === 'Q' ? 2 : routed || (/##\s*Cierre/.test(reply) ? 1 : 0);
  if (!level) return null;
  const missing = [], findings = [];

  // ---- Observed (computed, never declared) ----
  const where = (t) => `${t.input.file_path || ''} ${t.input.path || ''} ${t.input.pattern || ''} ${t.input.command || ''}`;
  const base = allTools.length - turn.tools.filter((t) => !t.input.slash).length;
  const gitCode = (ctx.gitChanged || []).some((f) => !exempt(f) && !NOT_CODE.test(f)); // a shell command changed code only if git saw it
  const shellChange = (t) => shell(t) && changesProject(t.input.command) && gitCode;
  const isChange = (t) => (EDITS.test(t.name) && !exempt(fileOf(t))) || shellChange(t);
  const firstChange = allTools.findIndex((t, i) => i >= base && isChange(t));
  const before = (pred) => allTools.some((t, i) => pred(t) && (firstChange < 0 || i < firstChange));
  const dept = { declared: routedDept([...turn.texts, full], turn.tools), invoked: [...new Set(allTools.filter((t) => t.name === 'Skill' && /^dept-/.test(String(t.input.skill || ''))).map((t) => String(t.input.skill)))] };
  const procRe = dept.declared ? new RegExp(`${dept.declared}[\\\\/]procedures\\.md`) : /procedures\.md/;
  const procReads = allTools.filter((t) => /procedures\.md/.test(where(t)) && readSomething(t));
  const lastIdx = (pred) => { for (let i = turn.tools.length - 1; i >= 0; i--) if (pred(turn.tools[i])) return i; return -1; };
  const lastCode = lastIdx((t) => (EDITS.test(t.name) && !exempt(fileOf(t)) && !NOT_CODE.test(fileOf(t))) || shellChange(t));
  const lastSpec = lastIdx((t) => EDITS.test(t.name) && SPEC.test(path.basename(fileOf(t))));
  const lastChange = lastIdx(isChange);
  const result = (t) => turn.results?.[t.id];
  const secs = (t) => (result(t)?.at && t.at ? Math.max(0, (result(t).at - t.at) / 1000) : null);
  const gatesAfter = turn.tools.slice(Math.max(lastChange, lastCode) + 1).filter((t) => shell(t) && (GATE.test(cmdOf(t)) || TEST.test(cmdOf(t))));
  const ui = changed.some((f) => UI.test(f));
  const code = changed.filter((f) => !NOT_CODE.test(f));
  const timed = turn.tools.filter((t) => secs(t) !== null);
  const slowest = [...timed].sort((a, b) => secs(b) - secs(a))[0];
  const observed = {
    memory: {
      searched: before((t) => /mcp__engram__mem_(search|context)/.test(t.name)),
      opened: before((t) => t.name === 'Read' && /[\\/]\.waymark[\\/]/.test(String(t.input.file_path || ''))),
      written: turn.tools.some((t) => EDITS.test(t.name) && MEMORY_FILE.test(fileOf(t))),
      saved: turn.tools.some((t) => /mem_(save|update|session_summary)/.test(t.name)),
    },
    procedure: { owner: dept.declared, read: [...new Set(procReads.map((t) => (where(t).match(/[\w.-]+[\\/]procedures\.md/) || ['procedures.md'])[0].replace(/\\/g, '/')))], readBeforeChange: before((t) => procRe.test(where(t)) && readSomething(t)) },
    gates: gatesAfter.map((t) => ({ cmd: cmdOf(t).replace(/\s+/g, ' ').slice(0, 140), s: secs(t) === null ? null : Math.round(secs(t)), error: !!result(t)?.error })),
    tests: { specsChanged: changed.filter((f) => SPEC.test(path.basename(f))).map((f) => path.basename(f)), ranAfterLastSpec: lastSpec < 0 ? null : turn.tools.slice(lastSpec + 1).some((t) => shell(t) && TEST.test(cmdOf(t))) },
    browser: { ui, tried: turn.tools.filter((t) => (t.name === 'Skill' && /^(browser-verify|run)$/.test(String(t.input.skill || ''))) || /browser|playwright|chrome/i.test(t.name)).map((t) => t.name === 'Skill' ? t.input.skill : t.name).slice(0, 5) },
    review: skillCalled(turn.tools, /(^|:)code-review$/),
    docs: turn.tools.filter(DOCS).length,
    worktree: turn.tools.some((t) => shell(t) && /git\s+worktree\s+add/.test(cmdOf(t))),
    branches: ctx.branches || {},
    time: { minutes: turn.startedAt ? Math.round((Date.now() - turn.startedAt) / 6000) / 10 : null, toolMinutes: Math.round(timed.reduce((a, t) => a + secs(t), 0) / 6) / 10, slowest: slowest ? { tool: slowest.name, what: (cmdOf(slowest) || fileOf(slowest) || String(slowest.input.skill || '')).replace(/\s+/g, ' ').slice(0, 100), s: Math.round(secs(slowest)) } : null },
  };

  // ---- Block 1: the decision (the user decides, never the agent) ----
  const d = field(reply, 'Decisi[oó]n');
  const chosenLabels = (ctx.decisions || []).flatMap((x) => String(x.chosen).split(',')).map(plain).filter(Boolean);
  const quoted = d.match(/^del usuario \(\s*[“"«]([^”"»]{3,200})[”"»]/i)?.[1];
  const usersWords = (q) => q && (prompts.some((p) => plain(p).includes(plain(q))) || chosenLabels.some((l) => l.includes(plain(q)))); // the quote is (part of) the picked label
  if (/##\s*Cierre/.test(reply)) {
    if (!d) missing.push('Decisión: elegida <option> · descartadas <options> (the user\'s pick in the choice window) | del usuario ("<their words>") | única (<why>)');
    else if (/^elegida/i.test(d) && ctx.decisions && !ctx.decisions.length) missing.push('Decisión says "elegida" but no choice-window answer exists in this task: ask with the optimal options (AskUserQuestion), or write del usuario ("<their words>") / única (<why>)');
    else if (/^del usuario/i.test(d) && !usersWords(quoted)) missing.push('Decisión: del usuario needs the user\'s own words (or the option they picked) in quotes');
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
  }

  // ---- Block 2: a gate after the last change ----
  if (lastCode >= 0 && !turn.tools.slice(lastCode + 1).some((t) => shell(t) && GATE.test(cmdOf(t)))) missing.push('no typecheck, lint or build ran after the last code change: run the project\'s gate once now (the full one at the end, per repo)');
  if (lastSpec >= 0 && !observed.tests.ranAfterLastSpec) missing.push('a spec changed after the last test run: run that spec again');

  // ---- Block 3: the Cierre complete, its Aprendido written to the project memory ----
  if (!/##\s*Cierre/.test(reply)) missing.push('the "## Cierre · <task ID>" block (Resultado · Decisión · Sub-decisiones · Evidencia · Aprendido)');
  else {
    if (!field(reply, 'Resultado')) missing.push('Resultado: hecho | parcial (<what is missing>) | bloqueado (<why>)');
    if (!field(reply, 'Evidencia')) missing.push('Evidencia: observada <what you saw> | inferida de <source> (check: <one line for the user>)');
    if (!field(reply, 'Aprendido') || /^ninguno/i.test(field(reply, 'Aprendido'))) missing.push('Aprendido: <your rewritten Work in progress line> (never "ninguno")');
    else if (!observed.memory.written) missing.push('Aprendido is not in the project memory: write it as the task\'s Work in progress line (~/.waymark/projects/<slug>.md) — the next session, or another agent, resumes from there');
    if (ctx.ids) {
      const id = reply.match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
      const offer = `${ctx.ids.next} for a new task${ctx.ids.followUp ? `, ${ctx.ids.followUp} for a follow-up of ${ctx.ids.last}` : ''}`;
      if (!id) missing.push(`the task ID in the heading: "## Cierre · <id>" (${offer})`);
      else if (!validId(id, ctx.ids)) missing.push(`the heading's task ID ${id} is already recorded or was never offered: use ${offer}`);
    }
  }

  // ---- Findings: recorded and scored, never blocked ----
  const skip = {};
  for (const f of ['Tests', 'Navegador', 'Review']) {
    const s = userSkip(reply, f, prompts);
    if (s === 'ok') skip[f] = true;
    else if (s) findings.push(`${f}: skip quoted as the user's ("${s}") but those words are not in the user's messages`);
  }
  if (routed === 'Q') findings.push('routed as a question (Q) but changed project files');
  if (!dept.declared) findings.push('the routing line names no owner department');
  else if (!dept.invoked.includes(dept.declared)) findings.push(`${dept.declared} named in the routing line but never invoked`);
  else if (!observed.procedure.read.some((p) => procRe.test(p))) findings.push(`${dept.declared}/procedures.md never read (a search with no match does not count)`);
  if (level >= 2 && !observed.memory.searched) findings.push('L2+ with no mem_search before the first change');
  if (level >= 2 && !skip.Navegador && ui && !observed.browser.tried.length) findings.push('UI changed with no browser attempt (browser-verify or run; curl does not count)');
  if (level >= 2 && !skip.Review && code.length && !observed.review) findings.push('code changed and code-review did not run');
  const near = code.length ? specsNear(code) : null;
  if (near && !skip.Tests && !observed.tests.specsChanged.length && !/Tests:\s*no \(/i.test(reply)) findings.push(`${near} sits next to the changed code and no spec was added or changed`);
  const ev = field(reply, 'Evidencia');
  if (/inferida/i.test(ev) && /(doc|documentaci|documentation|oficial|official)/i.test(ev) && !observed.docs) findings.push('Evidencia inferred from docs with no docs consulted');
  if (PRE.test(reply) && !observed.worktree && !/no comprobado/i.test(reply)) findings.push('a failure called pre-existing without a clean-copy check');
  if (observed.gates.some((g) => g.error)) findings.push(`a gate after the last change failed: ${observed.gates.filter((g) => g.error).map((g) => g.cmd.slice(0, 60)).join(' | ')}`);
  if (ctx.commits && !ctx.commits.length && turn.tools.some((t) => shell(t) && /\bgit\b[^|;&\n]*\scommit\b/.test(cmdOf(t)))) findings.push('a commit made this turn without the trailer "Waymark-Task: <task ID>"');
  return { level, changed, reply, missing, findings, dept, observed };
}

// Automatic evaluation of the task from what was observed: one ✔/✘ per routine step, a score, tokens and estimated quota.
export function evaluate(gaps, usage) {
  const o = gaps.observed, has = (re) => gaps.findings.some((f) => re.test(f)) || gaps.missing.some((m) => re.test(m));
  const steps = {
    Decision: !has(/Decisi|Sub-decisiones/),
    Recordar: gaps.level < 2 || o.memory.searched,
    Enrutar: !has(/routing line|never invoked|procedures\.md|routed as a question/),
    Verificar: !has(/gate|spec changed|pre-existing/),
    Skills: !has(/browser|code-review|docs consulted|sits next to/),
    Aprender: o.memory.written,
    Cierre: !gaps.missing.length,
  };
  const ok = Object.values(steps).filter(Boolean).length;
  return { steps, score: `${ok}/${Object.keys(steps).length}`, tokens: usage?.total || 0, quotaPct: usage?.total ? Math.round((usage.total / TOKENS_PER_PCT) * 10) / 10 : null };
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

// The provenance record of a closed turn: what was observed, what the agent said, the evaluation and what stayed open.
export function provenanceRecord(turn, gaps, ctx, meta = {}) {
  const claimed = gaps.reply.match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
  const ok = claimed && validId(claimed, ctx.ids);
  return {
    id: ok ? claimed : ctx.ids.next, ...(ok ? {} : { idBy: 'hook' }), at: new Date().toISOString(), session: meta.session, cwd: meta.cwd,
    level: gaps.level, department: gaps.dept, prompt: String(turn.prompt || '').slice(0, 600), decisions: ctx.decisions,
    files: [...new Set(gaps.changed)],
    observed: gaps.observed,
    evaluation: meta.evaluation,
    commands: turn.tools.filter(shell).map((t) => cmdOf(t).slice(0, 200)).slice(0, 30),
    skills: [...new Set(turn.tools.filter((t) => t.name === 'Skill').map((t) => String(t.input.skill || '')))],
    inputs: ctx.inputs, commits: ctx.commits || [],
    cierre: (gaps.reply.match(/##\s*Cierre[\s\S]*/)?.[0] || '').slice(0, 2000),
    unresolved: gaps.missing,
    findings: gaps.findings,
  };
}

// One line for the user (systemMessage: shown in the UI, not added to the model's context).
export function summaryLine(id, ev) {
  const s = Object.entries(ev.steps).map(([k, v]) => `${k} ${v ? '✔' : '✘'}`).join(' · ');
  return `Waymark ${id} · ${s} · ${ev.score} · ${(ev.tokens / 1e6).toFixed(2)}M tokens${ev.quotaPct !== null ? ` ≈ ${ev.quotaPct}% de la cuota de 5 h (estimado)` : ''}`;
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
      const evaluation = evaluate(gaps, turnUsage(lines));
      const rec = provenanceRecord(turn, gaps, ctx, { session: h.session_id, cwd, evaluation });
      try { appendRecord(cwd, rec); } catch {}
      process.stdout.write(JSON.stringify({ systemMessage: summaryLine(rec.id, evaluation) }));
    } catch {}
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
