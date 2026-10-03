#!/usr/bin/env node
// Waymark · connects the other coding agents on this machine to the project memory, without installing anything in them.
//   node connect-agents.mjs            dry run: prints, per agent found, what would be written (nothing is written)
//   node connect-agents.mjs --apply    writes it (backup first)
// Per agent folder that exists (Codex, Gemini CLI, OpenCode): one marked block in its global instructions file with the
// pointer line below, and a row in ~/.waymark/agent.md (*Connected agents*). Only the marked block is ever written; the
// rest of the file is never touched. Hooks and skills in those agents are a full install (INSTALL.md §1), not this.
// The session hook offers it once per agent found and not connected (user's choice, 2026-10-03 · T2c). Offline.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOME = () => process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const BACKUPS = () => process.env.WAYMARK_BACKUPS || path.join(path.dirname(HOME()), '.waymark-backups');
const USER = () => process.env.WAYMARK_AGENTS_HOME || os.homedir();
const stamp = (d = new Date()) => `${d.toLocaleDateString('sv')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

// Global instructions file per agent (official docs: Codex AGENTS.md under CODEX_HOME, Gemini CLI GEMINI.md, OpenCode AGENTS.md).
export const AGENTS = () => [
  { name: 'Codex', dir: process.env.CODEX_HOME || path.join(USER(), '.codex'), file: 'AGENTS.md' },
  { name: 'Gemini CLI', dir: path.join(USER(), '.gemini'), file: 'GEMINI.md' },
  { name: 'OpenCode', dir: path.join(USER(), '.config', 'opencode'), file: 'AGENTS.md' },
];
export const POINTER = '<!-- waymark:pointer -->\nSi el proyecto tiene .waymark/, lee .waymark/tasks.md primero.\n<!-- /waymark:pointer -->';
const REGISTRY = '## Connected agents (pointer only)';
const registry = () => path.join(HOME(), 'agent.md');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const slash = (p) => p.replace(/\\/g, '/');

// Another framework's marked blocks (`<!-- gentle-ai:persona -->`): an orchestrator already governs that agent.
export const foreignIn = (text) => [...new Set([...String(text).matchAll(/<!--\s*([\w.-]+):[\w.-]+/g)].map((m) => m[1]).filter((n) => n !== 'waymark'))];

// Agents whose folder exists, with their state: connected (block present) or not, and the orchestrator found, if any.
export function found() {
  return AGENTS().filter((a) => fs.existsSync(a.dir)).map((a) => {
    const file = path.join(a.dir, a.file), text = read(file);
    return { ...a, path: file, exists: fs.existsSync(file), connected: text.includes('<!-- waymark:pointer -->'), guestOf: foreignIn(text) };
  });
}

// With an orchestrator the pointer still goes in, as Waymark's own block (guest: not Rule 0, never inside its blocks).
export function planFor(a) {
  if (a.connected) return { ...a, steps: [], skip: `already connected (${slash(a.path)})` };
  const guest = a.guestOf?.length ? ` as a guest of ${a.guestOf.join(', ')} (its blocks are not touched)` : '';
  return { ...a, steps: [
    a.exists ? `back up ${slash(a.path)}, then append the marked pointer block${guest || ' (the rest of the file is not touched)'}` : `create ${slash(a.path)} with the marked pointer block`,
    `register ${a.name} in ${slash(registry())} (${REGISTRY.slice(3)})`] };
}

export function apply(plan, now = new Date()) {
  let bk = null;
  if (plan.exists) {
    bk = path.join(BACKUPS(), `${stamp(now)}-connect-agents`, plan.name.replace(/\W+/g, '-').toLowerCase());
    fs.mkdirSync(bk, { recursive: true });
    fs.copyFileSync(plan.path, path.join(bk, plan.file));
  }
  const text = read(plan.path);
  fs.mkdirSync(plan.dir, { recursive: true });
  fs.writeFileSync(plan.path, text + (text && !text.endsWith('\n') ? '\n' : '') + (text ? '\n' : '') + POINTER + '\n');
  register(plan, now);
  return bk;
}

function register(a, now) {
  let text = read(registry()) || '# Agent paths\n';
  if (!text.includes(REGISTRY)) text = text.replace(/\n*$/, '\n') + `\n${REGISTRY}\n\nOther agents on this machine that read the project memory through one line in their instructions file (connect-agents.mjs).\n\n| Agent | Instructions file | Connected |\n|---|---|---|\n`;
  const row = `| ${a.name} | ${slash(a.path)} | ${now.toLocaleDateString('sv')}${a.guestOf?.length ? ` · invitado de ${a.guestOf.join(', ')}` : ''} |`;
  const lines = text.split('\n').filter((l) => !l.startsWith(`| ${a.name} | ${slash(a.path)} |`));
  lines.splice(lines.lastIndexOf('|---|---|---|') + 1, 0, row);
  fs.mkdirSync(HOME(), { recursive: true });
  fs.writeFileSync(registry(), lines.join('\n').replace(/\n*$/, '\n'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--apply');
  const agents = found();
  if (!agents.length) { console.log('No other agent found (~/.codex, ~/.gemini, ~/.config/opencode).'); process.exit(0); }
  let failed = 0;
  for (const a of agents) {
    const plan = planFor(a);
    console.log(`\n${a.name} (${slash(a.dir)})`);
    if (plan.skip) { console.log(`  skip: ${plan.skip}`); continue; }
    for (const s of plan.steps) console.log(`  - ${s}`);
    if (!write) continue;
    try { const bk = apply(plan); console.log(`  done${bk ? ` · backup ${slash(bk)}` : ''}`); } catch (e) { failed++; console.log(`  FAILED: ${e.message}`); }
  }
  if (!write) console.log(`\nDry run: nothing was written. Add --apply to connect. The line: ${POINTER.split('\n')[1]}`);
  process.exit(failed ? 1 : 0);
}
