#!/usr/bin/env node
// Waymark · Cierre check. Registered by INSTALL.md as an end-of-turn hook (Claude Code: Stop). Runs locally (0 tokens
// unless it fires). When the turn edited project files and was routed "Waymark → L1-L3", the final reply must carry the
// Cierre; at L2+ its Navegador and Review fields must name what was run (browser-verify, code-review) or say why not.
// Missing → the hook asks the agent once to complete the Cierre before stopping (decision "block": the agent continues
// with the reason). Measured: tests 6 and 7 closed L2 tasks without browser-verify or code-review and without saying why.
// It never fires twice in a row (stop_hook_active), for L0/Q turns, or for turns that only wrote memory/scratch files.
// Remove it from the agent's settings to disable it.
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

export function checkCierre(turn, last) {
  const edited = turn.tools.some((t) => EDITS.test(t.name) && !exempt(t.input.file_path || t.input.notebook_path));
  if (!edited) return null;
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
      if (!/Navegador:\s*(browser-verify|no \()/.test(reply)) missing.push('Navegador: browser-verify <result> | no (<what failed when tried> | requiere <physical action>; check: …)');
      if (!/Review:\s*(code-review|omitido \()/.test(reply)) missing.push('Review: code-review <task\'s files> <findings> | omitido (<why>)');
    }
  }
  if (!missing.length) return null;
  return `Waymark: this L${level} turn changed files but the closing reply lacks ${missing.join('; ')}. Run what is missing or state why not, and reply with the completed Cierre (keep it short; do not repeat the rest of the answer).`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input = '', done = false;
  const run = () => {
    if (done) return;
    done = true;
    try {
      const h = JSON.parse(input);
      if (h.stop_hook_active) return;
      const reason = checkCierre(currentTurn(readTail(h.transcript_path, 1024 * 1024)), h.last_assistant_message);
      if (reason) process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    } catch {}
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
