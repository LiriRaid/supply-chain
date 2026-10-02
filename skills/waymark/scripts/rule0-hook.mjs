#!/usr/bin/env node
// Waymark · Rule 0 reminder + resume guard + daily update check. Registered by INSTALL.md as a per-prompt hook
// (Claude Code: UserPromptSubmit). Runs locally (0 tokens); only the text below reaches the model:
// - the reminder: full (~90 tokens) when the last reply did not open with "Waymark →", one line (~25) when it did;
// - at most once a day while a newer VERSION exists, one update line.
// Resume guard: when the session already holds a large context (≥ 150k tokens) and was idle longer than the
// prompt-cache lifetime (60 min), resuming re-writes the whole context as new input (measured: 502k tokens for one
// line). The hook then stops that one prompt (0 tokens; Claude Code shows the reason to the user) and suggests a new
// session; resending the prompt continues here. WAYMARK_RESUME_TOKENS / WAYMARK_RESUME_MINUTES tune it (0 = off).
// It never reads or changes the prompt text. Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = process.env.WAYMARK_REPO || 'LiriRaid/waymark';
const DAY = 24 * 60 * 60 * 1000;
const here = path.dirname(fileURLToPath(import.meta.url));
const HOME = process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const stateFile = path.join(HOME, '.update-check.json');
const guardFile = path.join(HOME, '.resume-guard.json');
const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const RESUME_TOKENS = num(process.env.WAYMARK_RESUME_TOKENS, 150000);
const RESUME_MINUTES = num(process.env.WAYMARK_RESUME_MINUTES, 60);
const TAIL = 2 * 1024 * 1024; // bytes read from the end of the transcript

// Coexistence mode (~/.waymark/coexistence.md, waymark/references/coexistence.md) decides the reminder.
let mode = '';
try { mode = fs.readFileSync(path.join(HOME, 'coexistence.md'), 'utf8').match(/^Mode:\s*(waymark-leads|guest|other-leads|skills-only)\b/m)?.[1] || ''; } catch {}

// guest / skills-only (and 1.5.0's other-leads): the orchestrator owns the turn, so no reminder at all.
const full =
  'Waymark Rule 0 — first text: "Waymark → L<n>|Q · <dept> · skills: …"; first tool call: the owner dept-* skill. ' +
  'Before the first edit: "Pedido · Captura" (the ask; what each image marks) then "Memoria · Reutiliza · Evidencia · Procedimiento" (memory digest injected at session start: pointers, verify in code; obey Environment). ' +
  'Close changes with "## Cierre" (Gates after the last edit · Aprendido · engram; L2+: Tests · Navegador · Review). User\'s language. Only L0 skips.';
const short = 'Waymark Rule 0 as in your last reply: routing line + owner dept-* skill first; opener before the first edit; "## Cierre" after changes.';
const coexist = ' Coexistence: follow the injected Adopted/Fallback/Resolved rules; never edit the other framework\'s files.';
const silent = ['guest', 'other-leads', 'skills-only'].includes(mode);

// Last lines of the transcript (Claude Code .jsonl): context size, idle time and how the last reply opened.
function readTail(file) {
  if (!file || !fs.existsSync(file)) return [];
  const size = fs.statSync(file).size, start = Math.max(0, size - TAIL), buf = Buffer.alloc(size - start);
  const fd = fs.openSync(file, 'r');
  try { fs.readSync(fd, buf, 0, buf.length, start); } finally { fs.closeSync(fd); }
  const rows = buf.toString('utf8').split('\n');
  if (start > 0) rows.shift(); // first line is partial
  return rows.filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
const isPrompt = (d) => {
  if (d.type !== 'user' || d.isMeta || d.isSidechain) return false;
  const c = d.message?.content;
  if (Array.isArray(c) && c.some((x) => x.type === 'tool_result')) return false;
  const text = typeof c === 'string' ? c : (c || []).filter((x) => x.type === 'text').map((x) => x.text).join(' ');
  return !!text.trim() && !/^\s*<(local-command|command-|system-reminder)/.test(text) && !/^\[Request interrupted/.test(text);
};
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

function resumeGuard(sessionId, st) {
  if (!RESUME_TOKENS || !RESUME_MINUTES || !st.lastAt || st.context < RESUME_TOKENS) return '';
  const idle = Date.now() - st.lastAt;
  if (idle < RESUME_MINUTES * 60000) return '';
  let seen = {};
  try { seen = JSON.parse(fs.readFileSync(guardFile, 'utf8')); } catch {}
  const key = sessionId || 'unknown';
  if (seen[key] === st.lastAt) return ''; // already stopped once for this pause: the resent prompt goes through
  for (const [k, v] of Object.entries(seen)) if (Date.now() - v > 7 * DAY) delete seen[k];
  seen[key] = st.lastAt;
  try { fs.mkdirSync(HOME, { recursive: true }); fs.writeFileSync(guardFile, JSON.stringify(seen)); } catch { return ''; }
  const k = `${Math.round(st.context / 1000)}k`, min = Math.round(idle / 60000);
  return `Waymark: esta sesión ya tiene ~${k} tokens de contexto y estuvo ${min} min inactiva; la caché del modelo venció, así que seguir aquí vuelve a escribir todo ese contexto (~${k} tokens de tu cuota) antes de responder. ` +
    'Recomendado: abre una sesión nueva (la memoria del proyecto se inyecta sola) o usa /compact. Para seguir aquí igualmente, vuelve a enviar tu mensaje (este aviso sale una sola vez). ' +
    `· This session holds ~${k} tokens and was idle ${min} min; the cache expired, so continuing re-writes all of it. Open a new session, or resend your message to continue here.`;
}

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

async function main(input) {
  let hook = {};
  try { hook = JSON.parse(input); } catch {}
  let st = { context: 0, lastAt: 0, openedWithWaymark: false };
  try { st = sessionState(readTail(hook.transcript_path)); } catch {}
  let block = '';
  try { block = resumeGuard(hook.session_id, st); } catch {}
  if (block) return { decision: 'block', reason: block };
  const reminder = silent ? '' : (st.openedWithWaymark ? short : full) + (mode === 'waymark-leads' ? coexist : '');
  const extra = await updateLine();
  if (!(reminder + extra).trim()) return null;
  return { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: (reminder + extra).trim() } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input = '', done = false;
  const run = () => {
    if (done) return;
    done = true;
    main(input).then((out) => { if (out) process.stdout.write(JSON.stringify(out)); }).catch(() => {});
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
