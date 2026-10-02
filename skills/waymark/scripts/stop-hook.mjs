#!/usr/bin/env node
// Waymark · Cierre check. Registered by INSTALL.md as an end-of-turn hook (Claude Code: Stop). Runs locally (0 tokens
// unless it fires). When the turn edited project files and was routed "Waymark → L1-L3", the final reply must carry the
// Cierre, and each claim must be backed by a tool call in the transcript (tool calls are persisted reliably; reply text
// is not, so text is only read from the final reply, which the hook receives directly):
// - Procedimiento naming a procedures.md section → that procedures.md was read or searched in this session;
// - Tests "sin infra" → no spec/test file next to the changed files;
// - L2+ with UI files changed → a real browser attempt this turn (browser-verify, run, or a browser tool);
// - L2+ with code changed → code-review ran this turn (docs/config-only changes are exempt);
// - engram "guardado" → a mem_save/mem_update call this turn.
// Missing → the agent is asked once to do it or correct the field (decision "block": it continues with the reason).
// Measured: tests 6–8 closed L2 tasks declaring steps that never ran (a skipped browser check caused a 2nd attempt).
// It never fires twice in a row (stop_hook_active), for L0/Q turns, or for turns that only wrote memory/scratch files.
// Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTail, currentTurn, routedLevel } from './transcript.mjs';

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

export function checkCierre(turn, last, allTools = turn.tools) {
  const changed = turn.tools.filter((t) => EDITS.test(t.name) && !exempt(fileOf(t))).map(fileOf);
  if (!changed.length) return null;
  const reply = String(last || turn.texts[turn.texts.length - 1] || '');
  // The transcript can miss reply texts (not every text block is persisted): fall back to the closing reply itself.
  const level = routedLevel(turn.texts) || (/^L2\+:/m.test(reply) ? 2 : /##\s*Cierre/.test(reply) ? 1 : 0);
  if (!level || level === 'Q') return null;
  const missing = [];
  if (!/##\s*Cierre/.test(reply)) missing.push('the "## Cierre" block (Gates · Aprendido · engram)');
  else {
    if (!/Gates:/.test(reply)) missing.push('Gates: <commands run after the last edit + result>');
    if (!/Aprendido:/.test(reply) || /Aprendido:\s*ninguno/i.test(reply)) missing.push('Aprendido: <your rewritten Work in progress line> (never "ninguno")');
    if (level >= 2) {
      if (!/Tests:/.test(reply)) missing.push('Tests: rojo→verde <spec> | sin infra (<proof>)');
      if (!/Navegador:\s*(browser-verify|no \()/.test(reply)) missing.push('Navegador: browser-verify <result> | no (<what failed when tried>)');
      if (!/Review:\s*(code-review|omitido \()/.test(reply)) missing.push('Review: code-review <task\'s files> <findings> | omitido (<why>)');
    }
  }
  // Claims checked against tool calls.
  const declared = [...turn.texts, reply].join('\n');
  if (/Procedimiento:[^\n]*procedures\.md/.test(declared)) {
    const read = allTools.some((t) => /procedures\.md/.test(`${t.input.file_path || ''} ${t.input.path || ''} ${t.input.pattern || ''} ${t.input.command || ''}`));
    if (!read) missing.push('Procedimiento names a procedures.md section that was never read in this session: read that section (search its heading) and follow it, or name the one you did follow');
  }
  if (/Tests:\s*sin infra/i.test(reply)) {
    const spec = specsNear(changed.filter((f) => !NOT_CODE.test(f)));
    if (spec) missing.push(`Tests says "sin infra" but ${spec} exists next to the changed files: add or extend a spec there (red → green), or say why it cannot cover this change`);
  }
  const code = changed.filter((f) => !NOT_CODE.test(f));
  if (level >= 2 && changed.some((f) => UI.test(f))) {
    const tried = skillCalled(turn.tools, /^(browser-verify|run)$/) || turn.tools.some((t) => /browser|playwright|chrome/i.test(t.name));
    if (!tried) missing.push('UI files changed but no browser attempt this turn: run browser-verify (or run) now; if it cannot reach the page, write Navegador: no (<what failed>; check: <one line for the user>)');
  }
  if (level >= 2 && code.length && !skillCalled(turn.tools, /(^|:)code-review$/)) {
    missing.push(`code changed but code-review did not run this turn: run it on the task's files (${code.slice(0, 4).map((f) => path.basename(f)).join(', ')}${code.length > 4 ? '…' : ''}) and report its findings`);
  }
  if (/engram:\s*guardado/i.test(reply) && !turn.tools.some((t) => /mem_(save|update|session_summary)/.test(t.name))) {
    missing.push('engram says "guardado" but no mem_save ran this turn: save this turn\'s decision, or write engram: no guardado (<why>)');
  }
  if (!missing.length) return null;
  return `Waymark: this L${level} turn changed files but its Cierre is not backed by the tool calls: ${missing.map((m, i) => `${i + 1}) ${m}`).join(' ')}. Do what is missing (or correct the field), then reply with the completed Cierre only.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input = '', done = false;
  const run = () => {
    if (done) return;
    done = true;
    try {
      const h = JSON.parse(input);
      if (h.stop_hook_active) return;
      const lines = readTail(h.transcript_path, 4 * 1024 * 1024);
      const reason = checkCierre(currentTurn(lines), h.last_assistant_message, sessionTools(lines));
      if (reason) process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    } catch {}
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
