#!/usr/bin/env node
// Waymark · session memory. Registered by INSTALL.md as a session-start hook (Claude Code: SessionStart,
// fires on startup, resume, clear and after a context summary). Runs locally; it injects once per session a
// compact digest of what the agent must recall: this machine's Environment and the current project's memory
// (Work in progress, Solved problems symptoms, Quality gates). Missing project memory → a one-line instruction.
// When another agent framework is installed it also injects ~/.waymark/coexistence.md, asks the agent to offer
// the choice (keep leading / become guest) for a framework marker that file does not list, and offers the full
// install back when the listed framework's markers are gone. In guest mode this hook is normally not registered.
// It also notices when skill folders changed (this agent's, other agents', the project's) and refreshes
// skill-registry.md in the background with sync.mjs, so third-party skills are usable without a manual sync.
// Skill fit: offers (monthly) to list only the names of skills the user never invokes (skill-fit.mjs).
// It never blocks. Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fitFor } from './mcp-fit.mjs';

const HOME = process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const MAX = 2700; // characters of injected project memory, hard cap
const STALE_DAYS = 14; // Work in progress entries older than this are flagged for confirmation
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
  const wip = section('\n' + best.text, 'Work in progress').filter((l) => l.startsWith('-')).map((l) => {
    const date = Date.parse(l.match(/\b(20\d\d-\d\d-\d\d)\b/)?.[1] || '');
    const stale = date && Date.now() - date > STALE_DAYS * 86400000 ? ` [>${STALE_DAYS} d old: confirm it still applies before acting on it]` : '';
    return (l.length > 300 ? l.slice(0, 297) + '…' : l) + stale;
  });
  if (wip.length) out.push('Work in progress:\n' + wip.join('\n'));
  return out.join('\n');
}

// Skill folders that sync.mjs indexes: this agent's, other agents', the current project's.
function skillsChanged(cwd) {
  const roots = [path.resolve(SCRIPTS, '..', '..'), ...['.claude', '.agents', '.codex', '.cursor', '.gemini', '.config/opencode'].map((d) => path.join(os.homedir(), ...d.split('/'), 'skills')),
    ...['.claude', '.agents', '.codex', '.cursor', '.gemini', '.opencode'].map((d) => path.join(cwd, d, 'skills'))];
  const names = [...new Set(roots)].flatMap((r) => { try { return fs.readdirSync(r).filter((n) => fs.existsSync(path.join(r, n, 'SKILL.md'))).map((n) => `${norm(r)}/${n}`); } catch { return []; } }).sort();
  const sigFile = path.join(HOME, '.skills-signature.json');
  let before = null;
  try { before = JSON.parse(fs.readFileSync(sigFile, 'utf8')); } catch {}
  const prev = new Set(before?.[norm(cwd)] || []);
  const added = names.filter((n) => !prev.has(n)), removed = [...prev].filter((n) => !names.includes(n));
  if (before?.[norm(cwd)] && !added.length && !removed.length) return '';
  try {
    fs.mkdirSync(HOME, { recursive: true });
    fs.writeFileSync(sigFile, JSON.stringify({ ...before, [norm(cwd)]: names }));
    if (!process.env.WAYMARK_NO_SYNC) spawn(process.execPath, [path.join(SCRIPTS, 'sync.mjs'), '--quiet'], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } catch { return ''; }
  if (!before?.[norm(cwd)]) return ''; // first run here: just index silently
  const short = (l) => l.map((n) => n.split('/').pop()).join(', ');
  return `Skills changed since the last session (${added.length ? '+' + short(added) : ''}${added.length && removed.length ? ' · ' : ''}${removed.length ? '-' + short(removed) : ''}): skill-registry.md is being refreshed in the background. Third-party skills are listed there with their path: read and follow that SKILL.md when its capability fits.`;
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

// Framework MCP servers (Claude Code) this project does not use and that are not blocked here yet, or blocked
// by Waymark but used now. Offered at most once a week per folder; mcp-fit.mjs applies it after the user's yes.
function mcpFit(cwd) {
  if (!fs.existsSync(process.env.WAYMARK_CLAUDE_JSON || path.join(os.homedir(), '.claude.json'))) return '';
  const stateFile = path.join(HOME, '.mcp-offer.json');
  let st = {};
  try { st = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}
  if (st[norm(cwd)] && Date.now() - st[norm(cwd)] < 7 * 86400000) return '';
  const f = fitFor(cwd);
  if (!f.add.length && !f.lift.length) return '';
  try { fs.mkdirSync(HOME, { recursive: true }); fs.writeFileSync(stateFile, JSON.stringify({ ...st, [norm(cwd)]: Date.now() })); } catch {}
  const script = path.join(SCRIPTS, 'mcp-fit.mjs').replace(/\\/g, '/');
  const parts = [];
  if (f.add.length) parts.push(`${f.add.map((a) => a.server).join(', ')} are visible here but this project does not use their framework`);
  if (f.lift.length) parts.push(`${f.lift.map((l) => l.server).join(', ')} were blocked here and the project uses their framework now`);
  return `MCP fit: ${parts.join('; ')}. Offer once, with your choice window: block/lift them for this project only (your servers stay registered; a deny rule in .claude/settings.local.json) — node "${script}" --project "${cwd.replace(/\\/g, '/')}" shows the plan, add --apply on yes; next session. Declined → do not ask again this week.`;
}

// Skills the user never invokes that are still listed in every session (Claude Code). The plan is computed in the
// background by skill-fit.mjs --cache (weekly) and offered at most once every 30 days; applied after the user's yes.
function skillFit() {
  if (!fs.existsSync(process.env.WAYMARK_CLAUDE_PROJECTS || path.join(os.homedir(), '.claude', 'projects'))) return '';
  const cache = (() => { try { return JSON.parse(fs.readFileSync(path.join(HOME, '.skill-fit-plan.json'), 'utf8')); } catch { return null; } })();
  if ((!cache || Date.now() - cache.at > 7 * 86400000) && !process.env.WAYMARK_NO_SYNC) {
    try { spawn(process.execPath, [path.join(SCRIPTS, 'skill-fit.mjs'), '--cache'], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch {}
  }
  const n = (cache?.skills?.length || 0) + (cache?.plugins?.length || 0);
  if (!cache || cache.skipped || !n) return '';
  const offerFile = path.join(HOME, '.skill-offer.json');
  let st = {};
  try { st = JSON.parse(fs.readFileSync(offerFile, 'utf8')); } catch {}
  if (st.at && Date.now() - st.at < 30 * 86400000) return '';
  try { fs.mkdirSync(HOME, { recursive: true }); fs.writeFileSync(offerFile, JSON.stringify({ at: Date.now() })); } catch {}
  const tokens = Math.round(([...(cache.skills || []), ...(cache.plugins || [])].reduce((a, x) => a + (x.chars || 0), 0)) / 4);
  const script = path.join(SCRIPTS, 'skill-fit.mjs').replace(/\\/g, '/');
  return `Skill fit: ${n} skills/plugins were not used in ${cache.days} days but are listed in every session (~${tokens} tokens per session in total). Offer once, with your choice window: list only their names (still invocable) / disable unused plugins — node "${script}" shows the plan, add --apply on yes (--restore undoes it); next session. Declined → do not ask again this month.`;
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
  try {
    text = 'Waymark session memory (already recalled, cite it in "Memoria:"). Pointers, not facts: verify against the code before relying on them; if the code disagrees, the code wins and you fix or remove the entry.\n' + digest(cwd);
  } catch { text = ''; }
  if (text.length > MAX) text = text.slice(0, MAX) + '…';
  try { const s = skillsChanged(cwd); if (s) text += '\n' + s; } catch {}
  try { const m = mcpFit(cwd); if (m) text += '\n' + m; } catch {}
  try { const s = skillFit(); if (s) text += '\n' + s; } catch {}
  let coexist = '';
  try { coexist = coexistence(); } catch {}
  if (coexist) text = (text ? text + '\n' : '') + coexist;
  if (text) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } }));
};
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', emit);
process.stdin.resume();
setTimeout(emit, 1500).unref();
