#!/usr/bin/env node
// Waymark · measure what a task really cost, from the agent's own session transcript (Claude Code .jsonl).
// Runs locally and offline; it reads the transcript, never calls a model. Shows per user prompt (turn):
// responses, tool calls, images sent, tokens (new input, cached input, output) and sub-agent tokens; the
// fixed context the session started with; and, for a range of turns (one task), the number of attempts.
// Usage:
//   node measure.mjs                          latest session of the current folder
//   node measure.mjs <session.jsonl>          a given transcript
//   node measure.mjs [...] --turns 3-5        add the total of turns 3..5 (one task: attempts = 3)
//   node measure.mjs [...] --json             machine-readable output
// Token counts are what the API reports; plan quotas (% of a 5-hour window) are not published as tokens,
// so note the % the app shows before and after a task and compare it with these numbers.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const asJson = args.includes('--json');
const projects = path.join(os.homedir(), '.claude', 'projects');

function latestFor(cwd) {
  const dir = path.join(projects, cwd.replace(/[:\\/]/g, '-'));
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(dir, f)) : [];
  return files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}
const file = args.find((a) => a.endsWith('.jsonl')) || latestFor(process.cwd());
if (!file || !fs.existsSync(file)) { console.error(`No transcript found${file ? `: ${file}` : ` for ${process.cwd()}`}. Pass the .jsonl path (~/.claude/projects/<folder>/<session>.jsonl).`); process.exit(1); }

const parse = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const zero = () => ({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
const add = (t, u) => { t.input += u.input_tokens || 0; t.cacheWrite += u.cache_creation_input_tokens || 0; t.cacheRead += u.cache_read_input_tokens || 0; t.output += u.output_tokens || 0; return t; };
const total = (t) => t.input + t.cacheWrite + t.cacheRead + t.output;

// One response is streamed as several lines sharing message.id and the same usage: count each id once.
function usageOf(lines) {
  const seen = new Set(), t = zero();
  for (const d of lines) {
    const u = d.type === 'assistant' && d.message?.usage, id = d.message?.id;
    if (!u || (id && seen.has(id))) continue;
    if (id) seen.add(id);
    add(t, u);
  }
  return { tokens: t, responses: seen.size };
}

const lines = parse(file);
const isPrompt = (d) => {
  if (d.type !== 'user' || d.isMeta || d.isSidechain) return false;
  const c = d.message?.content;
  if (Array.isArray(c) && c.some((x) => x.type === 'tool_result')) return false;
  const text = typeof c === 'string' ? c : (c || []).filter((x) => x.type === 'text').map((x) => x.text).join(' ');
  return !!text.trim() && !/^\s*<(local-command|command-|system-reminder)/.test(text) && !/^\[Request interrupted/.test(text);
};

const turns = [];
let cur = null;
for (const d of lines) {
  if (isPrompt(d)) {
    const c = d.message.content;
    const text = typeof c === 'string' ? c : c.filter((x) => x.type === 'text').map((x) => x.text).join(' ');
    cur = { n: turns.length + 1, prompt: text.replace(/\s+/g, ' ').trim().slice(0, 70), images: Array.isArray(c) ? c.filter((x) => x.type === 'image').length : 0, lines: [], tools: 0, agents: [] };
    turns.push(cur);
    continue;
  }
  if (!cur) continue;
  cur.lines.push(d);
  if (d.type === 'assistant') cur.tools += (d.message?.content || []).filter((x) => x.type === 'tool_use').length;
  if (d.toolUseResult?.agentId) cur.agents.push(d.toolUseResult.agentId);
}

const subDir = path.join(path.dirname(file), path.basename(file, '.jsonl'), 'subagents');
const subUsage = (id) => { const f = path.join(subDir, `agent-${id}.jsonl`); return fs.existsSync(f) ? usageOf(parse(f)).tokens : zero(); };

const first = lines.find((d) => d.type === 'assistant' && d.message?.usage)?.message.usage || {};
const startContext = (first.input_tokens || 0) + (first.cache_creation_input_tokens || 0) + (first.cache_read_input_tokens || 0);

const rows = turns.map((t) => {
  const { tokens, responses } = usageOf(t.lines);
  const sub = t.agents.reduce((acc, id) => { const u = subUsage(id); for (const k of Object.keys(acc)) acc[k] += u[k]; return acc; }, zero());
  return { turn: t.n, prompt: t.prompt, images: t.images, responses, tools: t.tools, subagents: t.agents.length, tokens, subTokens: sub };
});
const sum = (rs) => rs.reduce((acc, r) => { for (const k of Object.keys(acc.tokens)) { acc.tokens[k] += r.tokens[k]; acc.subTokens[k] += r.subTokens[k]; } acc.responses += r.responses; acc.tools += r.tools; acc.subagents += r.subagents; return acc; }, { tokens: zero(), subTokens: zero(), responses: 0, tools: 0, subagents: 0 });

const range = flag('--turns');
let task = null;
if (range) {
  const [a, b] = range.split('-').map(Number);
  const picked = rows.filter((r) => r.turn >= a && r.turn <= (b || a));
  task = { turns: range, attempts: picked.length, ...sum(picked) };
}
const session = sum(rows);

if (asJson) {
  console.log(JSON.stringify({ file, startContext, turns: rows, session, task }, null, 2));
  process.exit(0);
}
const k = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const fresh = (t) => t.input + t.cacheWrite;
console.log(`Transcript: ${file}`);
console.log(`Fixed context at session start (system + tools + instructions + hooks + first prompt): ${k(startContext)} tokens`);
console.log('');
console.log('| # | Prompt | Img | Resp | Tools | Sub | New in | Cached in | Out | Sub-agents | Total |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.turn} | ${r.prompt.replace(/\|/g, '/')} | ${r.images || ''} | ${r.responses} | ${r.tools} | ${r.subagents || ''} | ${k(fresh(r.tokens))} | ${k(r.tokens.cacheRead)} | ${k(r.tokens.output)} | ${r.subagents ? k(total(r.subTokens)) : ''} | ${k(total(r.tokens) + total(r.subTokens))} |`);
}
const line = (label, s) => `${label}: ${k(total(s.tokens) + total(s.subTokens))} tokens (new in ${k(fresh(s.tokens))} · cached in ${k(s.tokens.cacheRead)} · out ${k(s.tokens.output)}${s.subagents ? ` · sub-agents ${k(total(s.subTokens))} in ${s.subagents}` : ''}) · ${s.responses} responses · ${s.tools} tool calls`;
console.log('');
console.log(line(`Session (${rows.length} turns)`, session));
if (task) console.log(line(`Task (turns ${task.turns}, attempts ${task.attempts})`, task));
console.log('\nCached input is re-read context (cheaper and usually lighter on plan limits than new input). Attempts = user prompts spent on the task: 1 means right the first time.');
