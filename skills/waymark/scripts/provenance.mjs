// Waymark · supply chain of the agent's work (docs/adr/0001, 0002), shared by the hooks. Offline, 0 model tokens.
// - Task IDs `YYYY-MM-DD · T<n>[a-z]`: n per project and local day, a letter per follow-up prompt of the same task.
// - The log: one JSON line per closed task in ~/.waymark/provenance/<slug>.jsonl, written by stop-hook.mjs from what
//   the transcript proves (prompt, options asked and the user's pick, files, commands, skills), the inputs it was
//   built with (Waymark and agent version, model, MCP servers, instruction file hashes), its commits (trailer
//   `Waymark-Task: <id>`) and the Cierre text. Each line holds the hash of the previous one: an edited or deleted
//   record breaks the chain (verifyChain).
// <slug> is the project memory file whose `Path:` holds the folder (as session-hook.mjs resolves it), else the folder name.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isPrompt } from './transcript.mjs';

const HOME = () => process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const norm = (p) => String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
export const ID = /\b(20\d\d-\d\d-\d\d) · T(\d+)([a-z]?)\b/;

export function projectSlug(cwd) {
  const dir = path.join(HOME(), 'projects');
  let best = null;
  try {
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      const p = norm(fs.readFileSync(path.join(dir, f), 'utf8').match(/^Path:\s*([^·\n]+)/m)?.[1]?.trim());
      if (p && (norm(cwd) === p || norm(cwd).startsWith(p + '/')) && (!best || p.length > best.p.length)) best = { f, p };
    }
  } catch {}
  return best ? best.f.slice(0, -3) : (path.basename(norm(cwd)) || 'project').replace(/[^a-z0-9._-]+/g, '-');
}

export const logFile = (cwd) => path.join(HOME(), 'provenance', `${projectSlug(cwd)}.jsonl`);

export function readLog(cwd) {
  try { return fs.readFileSync(logFile(cwd), 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; }
}

const localDay = (now) => now.toLocaleDateString('sv'); // YYYY-MM-DD in local time
const base = (id) => { const m = String(id).match(ID); return m ? `${m[1]} · T${m[2]}` : null; };

// The ID for a new task and for a follow-up of the last one; `known` holds every ID already recorded.
export function taskIds(cwd, now = new Date(), records = readLog(cwd)) {
  const day = localDay(now);
  const n = Math.max(0, ...records.map((r) => String(r.id || '').match(ID)).filter((m) => m && m[1] === day).map((m) => Number(m[2])));
  const known = new Set(records.map((r) => r.id).filter(Boolean));
  const follow = (id) => {
    const b = base(id);
    for (let c = 98; c <= 122; c++) if (!known.has(`${b}${String.fromCharCode(c)}`)) return `${b}${String.fromCharCode(c)}`; // b … z
    return null;
  };
  const last = records.length ? base(records[records.length - 1].id) : null;
  return { next: `${day} · T${n + 1}`, last, followUp: last ? follow(last) : null, known, follow };
}

// An ID is valid for this turn when it is the next new one, or an unused follow-up letter of a recorded task.
export function validId(id, ids) {
  const m = String(id || '').match(ID);
  if (!m || ids.known.has(m[0])) return false;
  if (m[0] === ids.next) return true;
  return !!m[3] && [...ids.known].some((k) => base(k) === base(m[0]));
}

// Lines of the current task: from the third-last prompt (the task's prompt and two follow-ups), as stop-hook reads them.
export function taskLines(lines, prompts = 3) {
  let seen = 0;
  for (let i = lines.length - 1; i >= 0; i--) if (isPrompt(lines[i]) && ++seen === prompts) return lines.slice(i);
  return lines;
}

// Choices the user made in the choice window (Claude Code: AskUserQuestion → toolUseResult.{questions, answers}).
export function decisionsIn(lines) {
  const out = [];
  for (const d of lines) {
    const r = d.toolUseResult;
    if (d.type !== 'user' || d.isSidechain || !r || !Array.isArray(r.questions) || !r.answers) continue;
    for (const q of r.questions) {
      const chosen = r.answers[q.question];
      if (chosen === undefined) continue;
      // A multi-select answer joins the labels with "," (observed on Claude Code 2.1.x): exact match per part; a label that
      // itself holds a comma falls back to a substring match.
      const parts = String(chosen).split(',').map((s) => s.trim());
      const picked = (l) => parts.includes(l) || (l.includes(',') && String(chosen).includes(l));
      out.push({ question: q.question, chosen, discarded: (q.options || []).map((o) => o.label).filter((l) => !picked(l)) });
    }
  }
  return out;
}

export const askedChoice = (lines) => lines.some((d) => d.type === 'assistant' && !d.isSidechain && (d.message?.content || []).some?.((c) => c.type === 'tool_use' && c.name === 'AskUserQuestion'));

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const fileSha = (p) => { try { return sha(fs.readFileSync(p)).slice(0, 16); } catch { return null; } };

// What the task was built with, from the turn's transcript lines (from its prompt on) and the instruction files.
export function turnInputs(lines, cwd) {
  let model = null, agent = null;
  const mcp = new Set();
  for (const d of lines) {
    if (d.version) agent = d.version;
    if (d.type !== 'assistant' || d.isSidechain) continue;
    if (d.message?.model) model = d.message.model;
    for (const c of d.message?.content || []) if (c.type === 'tool_use' && /^mcp__/.test(c.name)) mcp.add(c.name.split('__')[1]);
  }
  let waymark = null;
  try { waymark = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'VERSION'), 'utf8').trim(); } catch {}
  const project = ['CLAUDE.md', 'AGENTS.md'].map((f) => path.join(cwd, f)).find((p) => fs.existsSync(p));
  return { waymark, agent, model, mcp: [...mcp], instructions: { user: fileSha(path.join(os.homedir(), '.claude', 'CLAUDE.md')), project: project ? fileSha(project) : null } };
}

// Commits that carry `Waymark-Task: <id>` among the last 30 of the repo at cwd (git missing or no repo → []).
export function commitsFor(cwd, id) {
  if (!id) return [];
  const r = spawnSync('git', ['log', '-30', '--format=%H%x1f%(trailers:key=Waymark-Task,valueonly,separator=%x1e)'], { cwd, encoding: 'utf8', timeout: 1500 });
  if (r.status !== 0) return [];
  return r.stdout.split('\n').map((l) => l.split('\x1f')).filter(([h, t]) => h && String(t || '').split('\x1e').some((v) => v.trim() === id)).map(([h]) => h);
}

// Working-tree snapshot of the repo at cwd: { root, head, files: { <absolute path>: <content hash | "deleted"> } } for every
// path git reports as changed or untracked; null without git or a repo. Two snapshots (prompt → end of turn) give the
// files the turn really changed, whatever tool changed them (test 2.0-2: the modal files changed via `git checkout`,
// the record listed only the spec written with Write).
export function gitSnapshot(cwd) {
  const git = (...a) => spawnSync('git', a, { cwd, encoding: 'utf8', timeout: 1500, maxBuffer: 8 * 1024 * 1024 });
  const top = git('rev-parse', '--show-toplevel');
  if (top.status !== 0) return null;
  const root = top.stdout.trim(), head = git('rev-parse', 'HEAD').stdout.trim() || null;
  const st = git('status', '--porcelain=v1', '-z', '--untracked-files=all');
  if (st.status !== 0) return null;
  const files = {};
  const parts = st.stdout.split('\0');
  for (let i = 0; i < parts.length; i++) {
    const e = parts[i];
    if (e.length < 4) continue;
    if (/^[RC]/.test(e)) i++; // rename/copy: the next entry is the source path
    const abs = path.join(root, e.slice(3));
    files[abs] = fs.existsSync(abs) && fs.statSync(abs).isFile() ? fileSha(abs) : 'deleted';
  }
  return { root, head, files };
}

// Paths whose state differs between two snapshots: newly changed, changed again, or back to clean (e.g. `git checkout --`).
export function snapshotDiff(before, after) {
  if (!before || !after || before.root !== after.root) return [];
  const out = new Set();
  for (const [p, h] of Object.entries(after.files)) if (before.files[p] !== h) out.add(p);
  for (const p of Object.keys(before.files)) if (!(p in after.files)) out.add(p);
  return [...out];
}

// Snapshot taken by the per-prompt hook, per session (~/.waymark/.turn-snapshot.json), read by the end-of-turn hook.
const snapFile = () => path.join(HOME(), '.turn-snapshot.json');
export function saveSnapshot(session, cwd) {
  const snap = gitSnapshot(cwd);
  let all = {};
  try { all = JSON.parse(fs.readFileSync(snapFile(), 'utf8')); } catch {}
  for (const [k, v] of Object.entries(all)) if (Date.now() - (v.at || 0) > 7 * 86400000) delete all[k];
  all[session || 'unknown'] = { at: Date.now(), cwd, snap };
  fs.mkdirSync(HOME(), { recursive: true });
  fs.writeFileSync(snapFile(), JSON.stringify(all));
  return snap;
}
export function loadSnapshot(session) {
  try { return JSON.parse(fs.readFileSync(snapFile(), 'utf8'))[session || 'unknown']?.snap || null; } catch { return null; }
}

// Shell commands that change files in place (the decision gate treats them like edits). Redirects count unless they go
// to /dev/null, $null, NUL or a temp/scratch folder.
// Temp/scratch locations: a whole path segment, so project paths such as src/templates/ are not mistaken for temp.
const TEMP = /(^|[\s"'=\\/])(tmp|temp|scratchpad)[\\/]|AppData[\\/]Local[\\/]Temp|\$\{?TMP|\$\{?TEMP|%TEMP%|\$T\b|mktemp/i;
const MUTATING = /(?:^|[;&|(]\s*)(?:git\s+(?:checkout\s+(?:\S+\s+)*--(?:\s|$)|(?:restore|reset\s+--hard|apply|rm|mv|clean)\b)|sed\s+(?:-\w+\s+)*-i|rm\s|mv\s|cp\s|tee\s|(?:Set|Add)-Content|Out-File|(?:Remove|Move|Copy|New)-Item)/i;
export function mutatesFiles(command) {
  const c = String(command || '');
  if (MUTATING.test(c)) return true;
  for (const m of c.matchAll(/(?<![0-9&>])>{1,2}\s*("?)([^\s"&|;]+)\1/g)) {
    if (!/^(\/dev\/null|\$null|nul|&\d)$/i.test(m[2]) && !TEMP.test(m[2])) return true;
  }
  return false;
}
// A shell command that changes project files: mutating, and not only about temp/scratch or Waymark's own memory.
export const changesProject = (command) => mutatesFiles(command) && !TEMP.test(String(command || '')) && !/(\.waymark[\\/]|\.claude[\\/]projects)/i.test(String(command || ''));

// Appends the record with `prev` (hash of the last line) and `hash` (of this record without it).
export function appendRecord(cwd, record) {
  const file = logFile(cwd);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let prev = null;
  try { const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean); if (lines.length) prev = JSON.parse(lines[lines.length - 1]).hash || sha(lines[lines.length - 1]); } catch {}
  const body = { ...record, prev };
  fs.appendFileSync(file, JSON.stringify({ ...body, hash: sha(JSON.stringify(body)) }) + '\n');
  return file;
}

// → { ok: true } or { ok: false, at: <index of the first record whose hash or link does not match> }.
export function verifyChain(records) {
  let prev = null;
  for (let i = 0; i < records.length; i++) {
    const { hash, ...body } = records[i];
    if (body.prev !== prev || sha(JSON.stringify(body)) !== hash) return { ok: false, at: i };
    prev = hash;
  }
  return { ok: true };
}
