#!/usr/bin/env node
// Waymark · session memory. Registered by INSTALL.md as a session-start hook (Claude Code: SessionStart,
// fires on startup, resume, clear and after a context summary). Runs locally; it injects once per session a
// compact digest of what the agent must recall: this machine's Environment and the current project's memory
// (Work in progress, Solved problems symptoms, Quality gates). Missing project memory → a one-line instruction.
// It never blocks. Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME = process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const MAX = 2500; // characters of injected context, hard cap
const norm = (p) => String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const section = (text, title) => {
  const m = text.match(new RegExp(`\\n## ${title}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`));
  return m ? m[1].split('\n').filter((l) => l.trim() && !l.trim().startsWith('<!--')) : [];
};

function digest(cwd) {
  const out = [];
  const env = section('\n' + read(path.join(HOME, 'profile.md')), 'Environment').filter((l) => l.startsWith('-'));
  if (env.length) out.push('Environment (this machine): ' + env.map((l) => l.replace(/^- \[[^\]]*\]\s*/, '')).join(' | '));

  const dir = path.join(HOME, 'projects');
  let best = null;
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.md')) : []) {
    const text = read(path.join(dir, f));
    const p = norm(text.match(/^Path:\s*([^·\n]+)/m)?.[1]?.trim());
    if (p && (norm(cwd) === p || norm(cwd).startsWith(p + '/')) && (!best || p.length > best.p.length)) best = { f, p, text };
  }
  if (!best) {
    out.push(`Project memory: none for ${cwd}. Create it now with the Minimal bootstrap (waymark/references/project-detection.md) before the first edit.`);
    return out.join('\n');
  }
  out.push(`Project memory: ~/.waymark/projects/${best.f} (read; full file there).`);
  const solved = section('\n' + best.text, 'Solved problems').filter((l) => l.startsWith('-'))
    .map((l) => '- ' + (l.match(/Symptom:\s*([^·]+)/)?.[1] || l.slice(2, 120)).trim());
  if (solved.length) out.push('Solved problems (symptoms; details in the file):\n' + solved.slice(-10).join('\n'));
  const gates = section('\n' + best.text, 'Quality gates').filter((l) => l.startsWith('|') && !/^\|\s*(Gate|---)/.test(l));
  if (gates.length) out.push('Gates: ' + gates.map((l) => l.split('|').slice(1, 3).map((s) => s.trim()).join(': ')).join(' · '));
  const wip = section('\n' + best.text, 'Work in progress').filter((l) => l.startsWith('-')).map((l) => (l.length > 260 ? l.slice(0, 257) + '…' : l));
  if (wip.length) out.push('Work in progress:\n' + wip.join('\n'));
  return out.join('\n');
}

let input = '';
let done = false;
const emit = () => {
  if (done) return;
  done = true;
  let cwd = process.cwd();
  try { cwd = JSON.parse(input).cwd || cwd; } catch {}
  let text = '';
  try { text = 'Waymark session memory (already recalled, cite it in "Memoria:"):\n' + digest(cwd); } catch { text = ''; }
  if (text.length > MAX) text = text.slice(0, MAX) + '…';
  if (text) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } }));
};
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', emit);
process.stdin.resume();
setTimeout(emit, 1500).unref();
