// Waymark · provenance chain (docs/adr/0001-provenance-chain.md), shared by the hooks. Offline, 0 model tokens.
// - Task IDs `YYYY-MM-DD · T<n>[a-z]`: n per project and local day, a letter per follow-up prompt of the same task.
// - The log: one JSON line per closed task in ~/.waymark/provenance/<slug>.jsonl, written by stop-hook.mjs from what
//   the transcript proves (prompt, options asked and chosen, files, commands, skills) plus the Cierre text.
// <slug> is the project memory file whose `Path:` holds the folder (as session-hook.mjs resolves it), else the folder name.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
      out.push({ question: q.question, chosen, discarded: (q.options || []).map((o) => o.label).filter((l) => !String(chosen).split(', ').includes(l)) });
    }
  }
  return out;
}

export const askedChoice = (lines) => lines.some((d) => d.type === 'assistant' && !d.isSidechain && (d.message?.content || []).some?.((c) => c.type === 'tool_use' && c.name === 'AskUserQuestion'));

export function appendRecord(cwd, record) {
  const file = logFile(cwd);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(record) + '\n');
  return file;
}
