#!/usr/bin/env node
// Waymark · registers the four hooks of the chain in the agent's settings (docs/adr/0008), instead of a manual merge.
// Usage: node install-hooks.mjs [--apply] [--agent claude]   (shows the plan by default; --apply after the user's yes)
// Claude Code: ~/.claude/settings.json (WAYMARK_CLAUDE_SETTINGS overrides it). Only Waymark's own entries (a command that
// runs waymark/scripts/<hook>.mjs) are added, updated (path, matcher) or de-duplicated; every other key and hook stays,
// and new entries go after the existing ones. A file that is not valid JSON is never written; a backup .waymark-bak is
// made first. Coexistence mode guest or skills-only (~/.waymark/coexistence.md) → no hooks at all. Other agents: 3b.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
export const HOOKS = [
  { event: 'SessionStart', file: 'session-hook.mjs' },
  { event: 'UserPromptSubmit', file: 'rule0-hook.mjs' },
  { event: 'PreToolUse', file: 'tool-hook.mjs', matcher: 'Bash|PowerShell|Edit|Write|NotebookEdit' },
  { event: 'Stop', file: 'stop-hook.mjs' },
];
const SETTINGS = { claude: () => process.env.WAYMARK_CLAUDE_SETTINGS || path.join(os.homedir(), '.claude', 'settings.json') };
const ours = (file) => (h) => new RegExp(`waymark[\\\\/]+scripts[\\\\/]+${file.replace('.', '\\.')}`).test(String(h?.command || ''));

// → { settings, steps } without touching the input: the settings with the four hooks in place and what changed.
export function planHooks(input, { scripts = SCRIPTS, agent = 'claude' } = {}) {
  const s = structuredClone(input || {}), steps = [];
  s.hooks = s.hooks || {};
  for (const h of HOOKS) {
    const command = `node "${scripts}/${h.file}"${agent === 'claude' ? '' : ` --agent ${agent}`}`;
    const list = (s.hooks[h.event] = Array.isArray(s.hooks[h.event]) ? s.hooks[h.event] : []);
    const hits = list.filter((e) => (e.hooks || []).some(ours(h.file)));
    if (!hits.length) {
      list.push({ ...(h.matcher ? { matcher: h.matcher } : {}), hooks: [{ type: 'command', command }] });
      steps.push(`add ${h.event} → ${h.file}`);
      continue;
    }
    const [keep, ...extra] = hits;
    const mine = keep.hooks.find(ours(h.file));
    if (mine.command !== command) { steps.push(`update ${h.event} command: ${mine.command} → ${command}`); mine.command = command; }
    if (h.matcher && keep.matcher !== h.matcher && keep.hooks.every(ours(h.file))) { steps.push(`update ${h.event} matcher: ${keep.matcher || '(none)'} → ${h.matcher}`); keep.matcher = h.matcher; }
    for (const e of extra) { // a second Waymark entry for the same hook runs it twice: drop it (or just our hook from a shared entry)
      e.hooks = e.hooks.filter((x) => !ours(h.file)(x));
      steps.push(`remove duplicate ${h.event} → ${h.file}`);
    }
    s.hooks[h.event] = list.filter((e) => (e.hooks || []).length);
  }
  return { settings: s, steps };
}

function coexistMode() {
  try { return fs.readFileSync(path.join(process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark'), 'coexistence.md'), 'utf8').match(/^Mode:\s*(\S+)/m)?.[1] || ''; } catch { return ''; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), write = args.includes('--apply');
  const agent = args.includes('--agent') ? args[args.indexOf('--agent') + 1] : 'claude';
  if (!SETTINGS[agent]) { console.log(`Agent "${agent}": not supported yet (Waymark 2.0 step 3b adds Codex). Supported: ${Object.keys(SETTINGS).join(', ')}.`); process.exit(1); }
  const mode = coexistMode();
  if (['guest', 'skills-only', 'other-leads'].includes(mode)) { console.log(`Coexistence mode ${mode}: the orchestrator's hooks own the turn; no Waymark hooks are registered.`); process.exit(0); }
  const file = SETTINGS[agent](), raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  let current = {};
  try { current = raw ? JSON.parse(raw) : {}; } catch { console.log(`${file} is not valid JSON: nothing changed. Fix it and re-run.`); process.exit(1); }
  const { settings, steps } = planHooks(current, { agent });
  if (!steps.length) { console.log(`${file}: the four Waymark hooks are registered.`); process.exit(0); }
  console.log(`${file}:\n${steps.map((s) => `  - ${s}`).join('\n')}`);
  if (!write) { console.log('\nPlan only: nothing was written. Ask the user, then re-run with --apply (backup .waymark-bak). Takes effect in the next session.'); process.exit(0); }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (raw) fs.copyFileSync(file, file + '.waymark-bak');
  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
  console.log(`updated (backup ${file}.waymark-bak). Start a new session.`);
}
