#!/usr/bin/env node
// Waymark · session memory. Registered by INSTALL.md as a session-start hook (Claude Code: SessionStart,
// fires on startup, resume, clear and after a context summary). Runs locally; it injects once per session a
// compact digest of what the agent must recall: this machine's Environment and the current project's memory
// (Work in progress, Solved problems symptoms, Quality gates). Missing project memory → a one-line instruction.
// When another agent framework is installed it also injects ~/.waymark/coexistence.md, asks the agent to offer
// the choice (keep leading / become guest) for a framework marker that file does not list, and offers the full
// install back when the listed framework's markers are gone. In guest mode this hook is normally not registered.
// It never blocks. Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME = process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const MAX = 2500; // characters of injected project memory, hard cap
const MAX_COEXIST = 1800; // characters of injected coexistence rules, hard cap
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

// Framework namespaces marked in the agents' instructions files (`<!-- name:section -->`, `<!-- BEGIN name -->`).
function foreignMarkers() {
  const files = read(path.join(HOME, 'agent.md')).split('\n').filter((l) => l.startsWith('|') && !/^\|\s*(Agent|---|<agent>)/.test(l))
    .map((l) => l.split('|')[4]?.trim().replace(/`/g, '')).filter((f) => f && !f.startsWith('<'));
  const found = new Map();
  for (const f of files) {
    const text = read(f);
    for (const re of [/<!--\s*([a-z][\w.-]*):[\w.-]+/gi, /<!--\s*(?:begin|start)[:\s]+([a-z][\w.-]*)/gi, /<!--\s*([a-z][\w.-]*)\s+(?:begin|start)\b/gi]) {
      for (const m of text.matchAll(re)) {
        const ns = m[1].toLowerCase();
        if (ns !== 'waymark' && !['begin', 'start', 'end'].includes(ns)) found.set(ns, f);
      }
    }
  }
  return found;
}

// Modes: waymark-leads | guest | skills-only (`other-leads` from 1.5.0 is read as guest).
function coexistence() {
  const text = '\n' + read(path.join(HOME, 'coexistence.md'));
  let mode = text.match(/\nMode:\s*(waymark-leads|guest|other-leads|skills-only)\b/)?.[1];
  if (mode === 'other-leads') mode = 'guest';
  const frameworks = (text.match(/\nFrameworks:\s*([^\n]+)/)?.[1] || '').toLowerCase();
  const markers = foreignMarkers();
  const out = [];
  if (mode === 'guest' || mode === 'skills-only') {
    // Normally no hook runs in these modes; if one is still registered, stay out of the orchestrator's way.
    return `Coexistence mode ${mode} (${frameworks || 'other framework'} leads): no Waymark opener or Cierre; departments are knowledge (waymark/references/coexistence.md → Guest entry). Offer to remove the Waymark hooks from the agent settings.`;
  }
  const missing = [...markers].filter(([ns]) => !(mode && frameworks.includes(ns)));
  if (missing.length) {
    const byFile = new Map();
    for (const [ns, f] of missing) byFile.set(f, [...(byFile.get(f) || []), ns]);
    out.push(`Another agent framework appeared and coexistence is not configured for it: ${[...byFile].map(([f, ns]) => `${ns.join(', ')} in ${f}`).join('; ')}. ` +
      'Before the task, ask the user with your choice window: keep Waymark leading (classify its rules into ~/.waymark/coexistence.md, mode waymark-leads) or make Waymark its guest (no Waymark hooks or block; register the skills in its registry). waymark/references/coexistence.md. Until then never edit or override its rules.');
  }
  const listed = frameworks.split(';').map((s) => s.split('·')[0].trim()).filter(Boolean);
  const gone = listed.filter((n) => ![...markers.keys()].some((ns) => n.includes(ns) || ns.includes(n)));
  if (mode && gone.length && gone.length === listed.length) {
    out.push(`The framework(s) listed in ~/.waymark/coexistence.md (${gone.join(', ')}) no longer show markers in the instructions file. Ask the user whether they were uninstalled; if yes, offer to return to the full install (remove coexistence.md).`);
  }
  if (mode) {
    const rules = ['Adopted', 'Fallback', 'Resolved'].map((t) => [t, section(text, t).filter((l) => l.startsWith('-'))]).filter(([, l]) => l.length);
    let block = `Coexistence (mode ${mode}; ${frameworks || 'other framework'}). Waymark adapts; never edit the other framework's files:`;
    for (const [t, l] of rules) block += `\n${t}:\n${l.join('\n')}`;
    out.push(block.length > MAX_COEXIST ? block.slice(0, MAX_COEXIST) + '…' : block);
  }
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
  let coexist = '';
  try { coexist = coexistence(); } catch {}
  if (coexist) text = (text ? text + '\n' : '') + coexist;
  if (text) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } }));
};
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', emit);
process.stdin.resume();
setTimeout(emit, 1500).unref();
