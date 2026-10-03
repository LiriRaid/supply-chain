// Waymark · shared reader for the agent's session transcript (Claude Code .jsonl), used by the hooks and measure.mjs.
// Offline and read-only. A "prompt" is a message the user typed: tool results, command echoes, system reminders,
// interruptions and background-task notifications (<task-notification>) are not prompts.
import fs from 'node:fs';

const TAIL = 2 * 1024 * 1024; // bytes read from the end of a transcript by the hooks

export const parseLines = (text) => text.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

export function readTail(file, bytes = TAIL) {
  if (!file || !fs.existsSync(file)) return [];
  const size = fs.statSync(file).size, start = Math.max(0, size - bytes), buf = Buffer.alloc(size - start);
  const fd = fs.openSync(file, 'r');
  try { fs.readSync(fd, buf, 0, buf.length, start); } finally { fs.closeSync(fd); }
  const rows = buf.toString('utf8').split('\n');
  if (start > 0) rows.shift(); // first line is partial
  return parseLines(rows.join('\n'));
}

export const promptText = (d) => {
  const c = d.message?.content;
  return typeof c === 'string' ? c : (c || []).filter((x) => x.type === 'text').map((x) => x.text).join(' ');
};

export const isPrompt = (d) => {
  if (d.type !== 'user' || d.isMeta || d.isSidechain) return false;
  const c = d.message?.content;
  if (Array.isArray(c) && c.some((x) => x.type === 'tool_result')) return false;
  const text = promptText(d);
  // A Stop-hook block reason fed back to the agent is not the user's prompt (the blocked turn's edits stay in its turn).
  return !!text.trim() && !/^\s*<(local-command|command-|system-reminder|task-notification)/.test(text) && !/^\[Request interrupted/.test(text) && !/^\s*(Stop hook feedback|Waymark: this L)/.test(text);
};

// The current turn: everything after the last prompt. Returns its assistant texts and tool calls (main agent only).
export function currentTurn(lines) {
  let i = lines.length - 1;
  while (i >= 0 && !isPrompt(lines[i])) i--;
  const texts = [], tools = [], results = {};
  for (const d of lines.slice(i + 1)) {
    const cmd = d.type === 'user' && promptText(d).match(/<command-name>\/?([^<\s]+)<\/command-name>/)?.[1];
    if (cmd) tools.push({ name: 'Skill', input: { skill: cmd, slash: true } }); // a slash command typed in the turn
    const at = Date.parse(d.timestamp || '') || 0;
    if (d.type === 'user' && !d.isSidechain && Array.isArray(d.message?.content)) {
      for (const c of d.message.content) if (c.type === 'tool_result') results[c.tool_use_id] = { at, error: !!c.is_error, text: (typeof c.content === 'string' ? c.content : JSON.stringify(c.content || '')).slice(0, 400) };
    }
    if (d.type !== 'assistant' || d.isSidechain) continue;
    for (const c of d.message?.content || []) {
      if (c.type === 'text' && c.text.trim()) texts.push(c.text);
      if (c.type === 'tool_use') tools.push({ name: c.name, input: c.input || {}, id: c.id, at });
    }
  }
  return { found: i >= 0, prompt: i >= 0 ? promptText(lines[i]) : '', uuid: i >= 0 ? lines[i].uuid || '' : '', startedAt: i >= 0 ? Date.parse(lines[i].timestamp || '') || 0 : 0, texts, tools, results };
}

// Every tool call of the main agent in the readable part of the session (for reads done in an earlier turn), with the
// start of its result (`out`) so a search that found nothing is not taken for a read.
export function sessionTools(lines) {
  const out = [], byId = {};
  for (const d of lines) {
    if (d.type === 'assistant' && !d.isSidechain) for (const c of d.message?.content || []) if (c.type === 'tool_use') { const t = { name: c.name, input: c.input || {}, out: '' }; out.push(t); byId[c.id] = t; }
    if (d.type === 'user' && !d.isSidechain && Array.isArray(d.message?.content)) for (const c of d.message.content) if (c.type === 'tool_result' && byId[c.tool_use_id]) byId[c.tool_use_id].out = (typeof c.content === 'string' ? c.content : JSON.stringify(c.content || '')).slice(0, 200);
  }
  return out;
}

// A read that returned something: a Read, or a search/command whose result is not empty or "no matches".
export const readSomething = (t) => t.name === 'Read' || !/^\s*(\[\])?\s*$|^No (matches|files) found|^Found 0 /i.test(String(t.out || ''));

// Tokens of the turn's main-agent responses, each message counted once (a streamed response is written as several
// lines that share message.id and usage; measure.mjs counts the same way).
export function turnUsage(lines) {
  let i = lines.length - 1;
  while (i >= 0 && !isPrompt(lines[i])) i--;
  const seen = new Set();
  let total = 0, fresh = 0;
  for (const d of lines.slice(i + 1)) {
    const u = d.type === 'assistant' && !d.isSidechain ? d.message?.usage : null;
    if (!u || seen.has(d.message.id)) continue;
    seen.add(d.message.id);
    fresh += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0);
    total += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
  }
  return { total, fresh, responses: seen.size };
}

// Context size and time of the last main-agent response, and whether the last answered turn opened with "Waymark →".
export function sessionState(lines) {
  let context = 0, lastAt = 0, opener = null, turn = null;
  for (const d of lines) {
    if (isPrompt(d)) { turn = { first: null }; continue; }
    if (d.type !== 'assistant' || d.isSidechain) continue;
    const u = d.message?.usage;
    if (u) {
      context = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
      lastAt = Date.parse(d.timestamp || '') || lastAt;
    }
    const text = (d.message?.content || []).find((x) => x.type === 'text' && x.text.trim())?.text;
    if (turn && text && turn.first === null) { turn.first = text.trim(); opener = turn.first; }
  }
  return { context, lastAt, openedWithWaymark: !!opener && opener.startsWith('Waymark →') };
}

// Level declared in the turn's routing line ("Waymark → L2 · …"): 0 when there is none, 'Q' for questions. The LAST
// routing line wins: a question that turns into a change re-routes mid-turn (test 2.0-1: a turn routed Q edited 8 files).
// Only a line that starts with "Waymark →" routes; one quoted mid-sentence (evidence, an example) does not.
// Text written after a thinking block is not persisted (checked again 2026-10-02: a mid-turn re-route line was lost), so
// a re-route is also a tool call: the owner dept-* skill invoked with args "L<n>", which always comes after the
// turn's first text and therefore wins.
const ROUTE = /^[ \t]*Waymark →\s*(L([0-3])|Q)\b(?:\s*·\s*(dept-[a-z-]+))?/gm;
const routes = (texts) => [...texts.join('\n').matchAll(ROUTE)];
const reroute = (tools = []) => {
  const r = tools.filter((t) => t.name === 'Skill' && /^dept-/.test(String(t.input.skill || '')) && /^\s*(L[0-3])\b/i.test(String(t.input.args || '')));
  return r.length ? { level: Number(String(r[r.length - 1].input.args).trim()[1]), dept: String(r[r.length - 1].input.skill) } : null;
};
export function routedLevel(texts, tools) {
  const t = reroute(tools);
  if (t) return t.level;
  const all = routes(texts), m = all[all.length - 1];
  return !m ? 0 : m[1] === 'Q' ? 'Q' : Number(m[2]);
}

// Department named in the last routing line ("Waymark → L2 · dept-frontend (+dept-ux-ui) · …") or re-route call, or null.
export function routedDept(texts, tools) {
  const t = reroute(tools);
  if (t) return t.dept;
  const all = routes(texts);
  return all.length ? all[all.length - 1][3] || null : null;
}
