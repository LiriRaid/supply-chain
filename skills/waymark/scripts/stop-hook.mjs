#!/usr/bin/env node
// Waymark · Cierre check. Registered by INSTALL.md as an end-of-turn hook (Claude Code: Stop). Runs locally (0 tokens
// unless it fires). When the turn edited project files and was routed "Waymark → L1-L3", the final reply must carry the
// Cierre, and each claim must be backed by a tool call in the transcript (tool calls are persisted reliably; reply text
// is not, so text is only read from the final reply, which the hook receives directly):
// - Procedimiento naming a procedures.md section → that procedures.md was read or searched in this session;
// - Tests "sin infra" → no spec/test file next to the changed files; a spec next to the changed code → a Tests field at
//   any level (bug fixes get a regression spec); "rojo→verde" → a spec edited and a test command run this turn;
// - a failure called pre-existing → "copia limpia" (git worktree of HEAD) or "no comprobado" in the Cierre;
// - L2+ with UI files changed → a real browser attempt this turn (browser-verify, run, or a browser tool);
// - L2+ with code changed → code-review ran this turn (docs/config-only changes are exempt);
// - engram "guardado" → a mem_save/mem_update call this turn;
// - a check the user asked to skip for this task ("no hagas tests") → `omitido (usuario: "<their words>")`, accepted
//   only when those words are in the user's messages (prompts are persisted reliably).
// - 2.0 supply chain (docs/adr/0001, 0002): the heading carries the task ID the per-prompt hook offered
//   (`## Cierre · <id>`); at every level `Resultado:` and `Decisión:` backed by a choice-window answer (elegida), the
//   user's quoted words (del usuario) or a reason (única); a commit made in the turn carries `Waymark-Task: <id>`;
//   `Sub-decisiones:` lists the decisions taken during the task (one taken alone is sent back to the user); the owner
//   department of the routing line was invoked; a turn routed Q that changed project files is checked as L2.
// Missing → the agent is asked once to do it or correct the field (decision "block": it continues with the reason).
// Measured: tests 6–8 closed L2 tasks declaring steps that never ran (a skipped browser check caused a 2nd attempt).
// It never fires twice in a row (stop_hook_active), for L0/Q turns, or for turns that only wrote memory/scratch files.
// Every closed L1–L3 turn that changed project files appends its record to ~/.waymark/provenance/<slug>.jsonl (on
// the second pass too, listing what stayed unbacked). Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTail, currentTurn, routedLevel, routedDept, isPrompt, promptText } from './transcript.mjs';
import { ID, taskIds, validId, taskLines, decisionsIn, appendRecord, turnInputs, commitsFor } from './provenance.mjs';

const norm = (p) => String(p || '').replace(/\\/g, '/').toLowerCase();
const exempt = (file) => {
  const f = norm(file), home = norm(os.homedir());
  return f.startsWith(`${home}/.waymark/`) || f.includes('/.claude/projects/') || f.includes('/appdata/local/temp/') || f.startsWith('/tmp/') || f.includes('/scratchpad/');
};
const EDITS = /^(Edit|Write|MultiEdit|NotebookEdit)$/;
const UI = /\.(html|css|scss|sass|less|tsx|jsx|vue|svelte|astro)$|\.component\.ts$/i;
const NOT_CODE = /\.(md|mdx|txt|json|ya?ml|toml|ini|env|lock|csv|svg|png|jpe?g|gif)$/i;
const SPEC = /\.(spec|test)\.[cm]?[jt]sx?$|_spec\.rb$|_test\.(go|py)$|^test_.*\.py$/i;
const fileOf = (t) => t.input.file_path || t.input.notebook_path || '';
const skillCalled = (tools, re) => tools.some((t) => t.name === 'Skill' && re.test(String(t.input.skill || '')));

// Every tool call of the main agent in the readable part of the session (for reads done in an earlier turn).
export function sessionTools(lines) {
  const out = [];
  for (const d of lines) if (d.type === 'assistant' && !d.isSidechain) for (const c of d.message?.content || []) if (c.type === 'tool_use') out.push({ name: c.name, input: c.input || {} });
  return out;
}

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

// ctx (optional): { ids } from taskIds() to check the heading's task ID, { decisions } from decisionsIn() for Decisión.
export function checkCierre(turn, last, allTools = turn.tools, prompts = [turn.prompt], ctx = {}) {
  const gaps = cierreGaps(turn, last, allTools, prompts, ctx);
  if (!gaps?.missing.length) return null;
  return `Waymark: this L${gaps.level} turn changed files but its Cierre is not backed by the tool calls: ${gaps.missing.map((m, i) => `${i + 1}) ${m}`).join(' ')}. Do what is missing (or correct the field), then reply with the completed Cierre only.`;
}

// → null (nothing to check: no project files changed, L0 or Q) or { level, changed, reply, missing[] }.
export function cierreGaps(turn, last, allTools = turn.tools, prompts = [turn.prompt], ctx = {}) {
  const changed = turn.tools.filter((t) => EDITS.test(t.name) && !exempt(fileOf(t))).map(fileOf);
  if (!changed.length) return null;
  const reply = String(last || turn.texts[turn.texts.length - 1] || '');
  // The transcript can miss reply texts (not every text block is persisted): the closing reply itself counts too.
  const routed = routedLevel([...turn.texts, reply]);
  const missing = [];
  // A turn routed Q that changed project files is a task that skipped routing: checked as L2 at least, never skipped.
  if (routed === 'Q') missing.push('this turn was routed as a question (Q) but changed project files: it is a task. Write the routing line again with its level and owner department (`Waymark → L<n> · dept-… · skills: …`) and close it as that level');
  const level = routed === 'Q' ? 2 : routed || (/^L2\+:/m.test(reply) ? 2 : /##\s*Cierre/.test(reply) ? 1 : 0);
  if (!level) return null;
  // The owner department named in the routing line must have been invoked in this session (test 7: declared, never loaded).
  const dept = { declared: routedDept([...turn.texts, reply]), invoked: [...new Set(allTools.filter((t) => t.name === 'Skill' && /^dept-/.test(String(t.input.skill || ''))).map((t) => String(t.input.skill)))] };
  if (!dept.declared) missing.push('the routing line names no owner department: `Waymark → L<n> · dept-<owner> · skills: …`');
  else if (!dept.invoked.includes(dept.declared)) missing.push(`the routing line names ${dept.declared} but it was never invoked in this session: invoke it and follow its Quick ref, or name the department you did follow`);
  // User decisions for this task: a quoted skip is accepted only when the user wrote those words.
  const skip = {};
  for (const field of ['Tests', 'Navegador', 'Review']) {
    const s = userSkip(reply, field, prompts);
    if (s === 'ok') skip[field] = true;
    else if (s) missing.push(`${field} says the user asked to skip it ("${s}") but those words are not in the user's messages: run the check, or quote what the user actually wrote`);
  }
  if (!/##\s*Cierre/.test(reply)) missing.push('the "## Cierre · <task ID>" block (Resultado · Gates · Aprendido · engram)');
  else {
    if (!/Gates:/.test(reply)) missing.push('Gates: <commands run after the last edit + result>');
    if (!/Aprendido:/.test(reply) || /Aprendido:\s*ninguno/i.test(reply)) missing.push('Aprendido: <your rewritten Work in progress line> (never "ninguno")');
    if (!/Resultado:/.test(reply)) missing.push('Resultado: hecho | parcial (<what is missing>) | bloqueado (<why>)');
    if (ctx.ids) {
      const id = reply.match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
      const offer = `${ctx.ids.next} for a new task${ctx.ids.followUp ? `, ${ctx.ids.followUp} for a follow-up of ${ctx.ids.last}` : ''}`;
      if (!id) missing.push(`the task ID in the heading: "## Cierre · <id>" (${offer})`);
      else if (!validId(id, ctx.ids)) missing.push(`the heading's task ID ${id} is already recorded or was never offered: use ${offer}`);
    }
    // Every level: the user decides every real decision; the agent never decides alone.
    const d = reply.match(/Decisi[oó]n:\s*([^\n]*)/i)?.[1] || '';
    const quoted = d.match(/^del usuario \(\s*[“"«]([^”"»]{3,200})[”"»]/i)?.[1];
    if (!d) missing.push('Decisión: elegida <option> · descartadas <options> (the user\'s pick in the choice window) | del usuario ("<their words>") | única (<why>)');
    else if (/^elegida/i.test(d) && ctx.decisions && !ctx.decisions.length) missing.push('Decisión says "elegida" but no choice-window answer exists in this task: ask with the optimal options (AskUserQuestion), or write del usuario ("<their words>") / única (<why>)');
    else if (/^del usuario/i.test(d) && !(quoted && prompts.some((p) => plain(p).includes(plain(quoted))))) missing.push('Decisión: del usuario needs the user\'s own words in quotes, as they wrote them');
    else if (/^[uú]nica/i.test(d) && !/^[uú]nica \(.{3,}\)/i.test(d)) missing.push('Decisión: única (<why there is only one real option>)');
    else if (!/^(elegida|del usuario|[uú]nica)/i.test(d)) missing.push('Decisión: elegida … · descartadas … | del usuario ("<their words>") | única (<why>)');
    // Decisions taken during the task (test 2.0-1: four taken alone, one against the user's words).
    const sub = reply.match(/Sub-?decisiones:\s*([^\n]*)/i)?.[1]?.trim() || '';
    if (!sub) missing.push('Sub-decisiones: <each decision taken during the task> → preguntada | del usuario ("<their words>") | no preguntada; … — or "ninguna"');
    else if (!/^ninguna\b/i.test(sub)) {
      const items = sub.split(';').map((s) => s.trim()).filter(Boolean);
      const alone = items.filter((s) => /→\s*no preguntada/i.test(s));
      const bad = items.filter((s) => !/→\s*(preguntada|del usuario \(|no preguntada)/i.test(s));
      const asked = items.length - alone.length - bad.length - items.filter((s) => /→\s*del usuario \(/i.test(s)).length + (/^elegida/i.test(d) ? 1 : 0);
      if (bad.length) missing.push(`Sub-decisiones: each item needs "→ preguntada | del usuario (\\"…\\") | no preguntada" (${bad.slice(0, 2).join('; ')})`);
      if (alone.length) missing.push(`Sub-decisiones taken without asking (${alone.slice(0, 3).join('; ')}): the user decides every real decision. Put them to the user now with the options (AskUserQuestion), apply the pick, then mark them preguntada`);
      if (ctx.decisions && asked > ctx.decisions.length) missing.push(`Sub-decisiones and Decisión claim ${asked} decisions asked but the choice window answered ${ctx.decisions.length} in this task: ask the missing ones or mark them honestly`);
    }
    if (ctx.commits && !ctx.commits.length && turn.tools.some((t) => /^(Bash|PowerShell)$/.test(t.name) && /\bgit\b[^|;&\n]*\scommit\b/.test(String(t.input.command || '')))) {
      missing.push('a commit was made this turn but none of the last commits carries the trailer "Waymark-Task: <the heading\'s task ID>": put it in the next commit of this task; amend a commit only if it is not pushed and the user says yes');
    }
    if (level >= 2) {
      if (!/Tests:/.test(reply)) missing.push('Tests: rojo→verde <spec> | sin infra (<proof>)');
      if (!/Navegador:\s*(browser-verify|no \(|omitido \(usuario)/.test(reply)) missing.push('Navegador: browser-verify <result> | no (<what failed when tried>)');
      if (!/Review:\s*(code-review|omitido \()/.test(reply)) missing.push('Review: code-review <task\'s files> <findings> | omitido (<why>)');
    }
  }
  // Claims checked against tool calls.
  const declared = [...turn.texts, reply].join('\n');
  if (/Procedimiento:[^\n]*procedures\.md/.test(declared)) {
    const read = allTools.some((t) => /procedures\.md/.test(`${t.input.file_path || ''} ${t.input.path || ''} ${t.input.pattern || ''} ${t.input.command || ''}`));
    if (!read) missing.push('Procedimiento names a procedures.md section that was never read in this session: read that section (search its heading) and follow it, or name the one you did follow');
  }
  if (!skip.Tests && /Tests:\s*sin infra/i.test(reply)) {
    const spec = specsNear(changed.filter((f) => !NOT_CODE.test(f)));
    if (spec) missing.push(`Tests says "sin infra" but ${spec} exists next to the changed files: add or extend a spec there (red → green), or say why it cannot cover this change`);
  }
  const code = changed.filter((f) => !NOT_CODE.test(f));
  // A spec next to the changed code means the change can be tested, at any level (a bug fix gets a regression spec).
  const near = code.length ? specsNear(code) : null;
  if (near && !skip.Tests && !/Tests:/.test(reply)) missing.push(`${near} sits next to the changed code: add a regression spec (red → green) and a Tests: field, or Tests: no (<why it cannot cover this>)`);
  if (/Tests:\s*rojo→verde/i.test(reply)) {
    const specEdited = turn.tools.some((t) => EDITS.test(t.name) && SPEC.test(path.basename(fileOf(t))));
    const testRun = turn.tools.some((t) => /^(Bash|PowerShell)$/.test(t.name) && /\b(test|tests|vitest|jest|karma|mocha|pytest|rspec|go test|dotnet test|mvn test|gradle test)\b/i.test(String(t.input.command || '')));
    if (!specEdited || !testRun) missing.push(`Tests says rojo→verde but this turn ${!specEdited ? 'edited no spec/test file' : ''}${!specEdited && !testRun ? ' and ' : ''}${!testRun ? 'ran no test command' : ''}: write the spec, run it red then green, and quote the result`);
  }
  // "Pre-existing" failures need the clean-copy proof or an explicit "no comprobado".
  const gates = reply.split('\n').filter((l) => /Gates:/.test(l)).join(' ');
  if (/(error|falla|fallo|rojo|fail|warning)/i.test(gates) && /(pre-?existente|preexist|pre-existing|ya (fallaba|exist[ií]a)|en c[oó]digo que no cambi)/i.test(gates) && !/(copia limpia|worktree|no comprobado)/i.test(reply)) {
    missing.push('the Cierre calls a failure pre-existing without proof: rerun it in a clean copy of HEAD (git worktree add <tmp> HEAD) and write "comprobado en copia limpia de HEAD", or write "previo: no comprobado (<why>)"');
  }
  if (level >= 2 && !skip.Navegador && changed.some((f) => UI.test(f))) {
    const tried = skillCalled(turn.tools, /^(browser-verify|run)$/) || turn.tools.some((t) => /browser|playwright|chrome/i.test(t.name));
    if (!tried) missing.push('UI files changed but no browser attempt this turn: run browser-verify (or run) now; if it cannot reach the page, write Navegador: no (<what failed>; check: <one line for the user>)');
  }
  if (level >= 2 && !skip.Review && code.length && !skillCalled(turn.tools, /(^|:)code-review$/)) {
    missing.push(`code changed but code-review did not run this turn: run it on the task's files (${code.slice(0, 4).map((f) => path.basename(f)).join(', ')}${code.length > 4 ? '…' : ''}) and report its findings`);
  }
  if (/engram:\s*guardado/i.test(reply) && !turn.tools.some((t) => /mem_(save|update|session_summary)/.test(t.name))) {
    missing.push('engram says "guardado" but no mem_save ran this turn: save this turn\'s decision, or write engram: no guardado (<why>)');
  }
  return { level, changed, reply, missing, dept };
}

// The provenance record of a closed turn: what the transcript proves, plus the Cierre text and the unbacked claims.
export function provenanceRecord(turn, gaps, ctx, meta = {}) {
  const claimed = gaps.reply.match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
  const ok = claimed && validId(claimed, ctx.ids);
  return {
    id: ok ? claimed : ctx.ids.next, ...(ok ? {} : { idBy: 'hook' }), at: new Date().toISOString(), session: meta.session, cwd: meta.cwd,
    level: gaps.level, department: gaps.dept, prompt: String(turn.prompt || '').slice(0, 600), decisions: ctx.decisions,
    files: [...new Set(gaps.changed)],
    commands: turn.tools.filter((t) => /^(Bash|PowerShell)$/.test(t.name)).map((t) => String(t.input.command || '').slice(0, 200)).slice(0, 30),
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
      const claimed = String(h.last_assistant_message || '').match(/##\s*Cierre\s*·\s*(.+)/)?.[1]?.match(ID)?.[0];
      ctx.commits = commitsFor(cwd, claimed);
      ctx.inputs = turnInputs(taskLines(lines, 1), cwd);
      const gaps = cierreGaps(turn, h.last_assistant_message, sessionTools(lines), prompts, ctx);
      if (!gaps) return;
      if (gaps.missing.length && !h.stop_hook_active) {
        process.stdout.write(JSON.stringify({ decision: 'block', reason: checkCierre(turn, h.last_assistant_message, sessionTools(lines), prompts, ctx) }));
        return;
      }
      try { appendRecord(cwd, provenanceRecord(turn, gaps, ctx, { session: h.session_id, cwd })); } catch {}
    } catch {}
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
