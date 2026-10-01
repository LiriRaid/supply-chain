#!/usr/bin/env node
// Waymark · Rule 0 reminder + daily update check. Registered by INSTALL.md as a per-prompt hook
// (Claude Code: UserPromptSubmit). Runs locally (0 tokens); only the text below reaches the model:
// the reminder (~70 tokens per prompt) and, at most once a day while a newer VERSION exists, one update line.
// It never blocks, reads or changes the prompt. Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = process.env.WAYMARK_REPO || 'LiriRaid/waymark';
const DAY = 24 * 60 * 60 * 1000;
const here = path.dirname(fileURLToPath(import.meta.url));
const HOME = process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const stateFile = path.join(HOME, '.update-check.json');

// Coexistence mode (~/.waymark/coexistence.md, waymark/references/coexistence.md) decides the reminder.
let mode = '';
try { mode = fs.readFileSync(path.join(HOME, 'coexistence.md'), 'utf8').match(/^Mode:\s*(waymark-leads|other-leads|skills-only)\b/m)?.[1] || ''; } catch {}

const reminders = {
  '':
    'Waymark Rule 0 — first text: "Waymark → L<n>|Q · <dept> · skills: …"; first tool call: the owner dept-* skill. ' +
    'Before the first edit: "Memoria · Reutiliza · Evidencia · Procedimiento" (memory digest was injected at session start; obey Environment). ' +
    'Close changes with "## Cierre" (Gates after the last edit · Aprendido · engram; L2+: Tests · Navegador · Review). User\'s language. Only L0 skips.',
  'other-leads':
    'Waymark (support mode: the other framework leads; no Waymark opener). When a task matches a department, load its dept-* skill as knowledge; ' +
    'recall the injected project memory before editing and update its Work in progress / Solved problems after. Never edit the other framework\'s files.',
  'skills-only': '',
};
reminders['waymark-leads'] = reminders[''] + ' Coexistence: follow the injected Adopted/Fallback/Resolved rules; never edit the other framework\'s files.';
const reminder = reminders[mode] ?? reminders[''];

const newer = (a, b) => {
  const pa = String(a).trim().split('.').map(Number), pb = String(b).trim().split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
};

async function updateLine() {
  try {
    const installed = fs.readFileSync(path.join(here, '..', 'VERSION'), 'utf8').trim();
    let st = {};
    try { st = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}
    const now = Date.now();
    if (!st.checkedAt || now - st.checkedAt > DAY) {
      const res = await fetch(`https://raw.githubusercontent.com/${REPO}/main/skills/waymark/VERSION`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) st.latest = (await res.text()).trim();
      st.checkedAt = now;
    }
    let line = '';
    if (st.latest && newer(st.latest, installed) && (!st.notifiedAt || now - st.notifiedAt > DAY)) {
      line = ` Waymark update available: ${installed} → ${st.latest}. Before the task, ask the user with your choice window if you have one (options: Actualizar ahora / Más tarde / Ver cambios); "Actualizar ahora" → follow INSTALL.md §9 from https://github.com/${REPO}; "Ver cambios" → show CHANGELOG.md entries since ${installed}, then ask again.`;
      st.notifiedAt = now;
    }
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(st));
    return line;
  } catch {
    return ''; // offline, no VERSION, unwritable state: stay silent
  }
}

let done = false;
const emit = (extra = '') => {
  if (done) return;
  done = true;
  if (!(reminder + extra).trim()) return;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: reminder + extra } }));
};
process.stdin.on('data', () => {});
process.stdin.resume();
setTimeout(() => emit(), 2500).unref();
updateLine().then((l) => emit(l));
