#!/usr/bin/env node
// Waymark · Rule 0 reminder + context notices + daily update check. Registered by INSTALL.md as a per-prompt hook
// (Claude Code: UserPromptSubmit). Runs locally (0 tokens); only the text below reaches the model:
// - the reminder: full (~130 tokens) when the last reply did not open with "Waymark →", one line (~40) when it did;
// - at most once a day while a newer VERSION exists, one update line.
// Context notices (never change the prompt):
// - Resume guard: the session holds ≥ 150k tokens and was idle longer than the prompt-cache lifetime (60 min), so
//   resuming re-writes the whole context as new input (measured: 502k tokens for one line). The hook stops that one
//   prompt (0 tokens; the user sees why) and saves it to ~/.waymark/.pending-prompt.json: a new session in the same
//   folder within 30 min receives it (session-hook.mjs); resending it here continues. WAYMARK_RESUME_TOKENS /
//   WAYMARK_RESUME_MINUTES tune it (0 = off).
// - Size notice: while the session is active, at 300k tokens of context and every 200k more, a message shown only to
//   the user (systemMessage: not added to the model's context) says each response re-reads all of it and a new
//   session is cheaper for a new task. Nothing is blocked. WAYMARK_CONTEXT_NOTICE / WAYMARK_CONTEXT_STEP (0 = off).
// - Task ID (2.0, docs/adr/0001, 0002): with the reminder, the ID of a new task and of a follow-up of the
//   last recorded one (~25 tokens), computed from the project's provenance log; the Cierre heading carries it.
// Remove it from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { readTail, sessionState } from './transcript.mjs';
import { taskIds, saveSnapshot, markOpen } from './provenance.mjs';

const REPO = process.env.WAYMARK_REPO || 'LiriRaid/waymark';
const DAY = 24 * 60 * 60 * 1000;
const here = path.dirname(fileURLToPath(import.meta.url));
const HOME = process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark');
const stateFile = path.join(HOME, '.update-check.json');
const guardFile = path.join(HOME, '.resume-guard.json');
const noticeFile = path.join(HOME, '.context-notice.json');
export const PENDING = path.join(HOME, '.pending-prompt.json');
const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const RESUME_TOKENS = num(process.env.WAYMARK_RESUME_TOKENS, 150000);
const RESUME_MINUTES = num(process.env.WAYMARK_RESUME_MINUTES, 60);
const NOTICE_TOKENS = num(process.env.WAYMARK_CONTEXT_NOTICE, 300000);
const NOTICE_STEP = num(process.env.WAYMARK_CONTEXT_STEP, 200000);
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } };
const writeJson = (p, v) => { fs.mkdirSync(HOME, { recursive: true }); fs.writeFileSync(p, JSON.stringify(v)); };
const prune = (o) => { for (const [k, v] of Object.entries(o)) if (Date.now() - (v.at ?? v) > 7 * DAY) delete o[k]; return o; };

// Coexistence mode (~/.waymark/coexistence.md, waymark/references/coexistence.md) decides the reminder.
let mode = '';
try { mode = fs.readFileSync(path.join(HOME, 'coexistence.md'), 'utf8').match(/^Mode:\s*(waymark-leads|guest|other-leads|skills-only)\b/m)?.[1] || ''; } catch {}

// guest / skills-only (and 1.5.0's other-leads): the orchestrator owns the turn, so no reminder at all.
const full =
  'Waymark Rule 0 — first text: "Waymark → L<n>|Q · <dept> · skills: …"; first tool call: the owner dept-* skill. ' +
  'Before the first edit: "Pedido · Captura" (the ask; what each image marks; "like X" → Copia: only what was named; a layer the user named → Capa, ask before leaving it) then "Memoria · Reutiliza · Evidencia · Procedimiento" (memory digest injected at session start: pointers, verify in code; obey Environment; code read ≠ observed). ' +
  'Every real decision, any level, also mid-task: the optimal options (files, risk, cost; recommended marked) plus the foreseeable sub-decisions, in one choice-window call before acting; the user decides, never you; changes stay blocked until asked. A question that becomes a change: re-route by invoking the owner dept-* skill with args "L<n>". Before the first change: its procedures.md section, L2+ mem_search, git status --short. Commits of the task carry "Waymark-Task: <task ID>". ' +
  'Gates: scoped while working, full typecheck/build once at the end, after the last change. ' +
  'Close changes with "## Cierre · <task ID>" (Resultado · Decisión · Sub-decisiones · Evidencia · Aprendido = your rewritten Work in progress line); write the Aprendido into the project memory; the hook computes and records the rest with an automatic evaluation, and blocks once per waymark/routine.json (decision, gate after the last change, Cierre + Aprendido; L2+: mem_search, code-review and build with code; docs behind an inference from docs). Independent tool calls in one response. User\'s language. Only L0 skips.';
const short = 'Waymark Rule 0 as in your last reply: routing line + owner dept-* skill first; opener before the first edit; the user decides every real decision (options first); "## Cierre · <task ID>" after changes. Independent tool calls in one response.';
export function taskLine(cwd, now = new Date()) {
  const ids = taskIds(cwd, now);
  return ` Task ID for the Cierre heading: new task → ${ids.next}${ids.followUp ? ` · follow-up of ${ids.last} → ${ids.followUp}` : ''}.`;
}
const coexist = ' Coexistence: follow the injected Adopted/Fallback/Resolved rules; never edit the other framework\'s files.';
const silent = ['guest', 'other-leads', 'skills-only'].includes(mode);
const kTok = (n) => `${Math.round(n / 1000)}k`;

function resumeGuard(hook, st) {
  if (!RESUME_TOKENS || !RESUME_MINUTES || !st.lastAt || st.context < RESUME_TOKENS) return '';
  const idle = Date.now() - st.lastAt;
  if (idle < RESUME_MINUTES * 60000) return '';
  const seen = prune(readJson(guardFile)), key = hook.session_id || 'unknown';
  if (seen[key] === st.lastAt) { // already stopped once for this pause: the resent prompt goes through here
    try { if (readJson(PENDING).session === key) fs.rmSync(PENDING); } catch {}
    return '';
  }
  seen[key] = st.lastAt;
  try {
    writeJson(guardFile, seen);
    if (hook.prompt) writeJson(PENDING, { at: Date.now(), session: key, cwd: hook.cwd || process.cwd(), prompt: String(hook.prompt).slice(0, 4000) });
  } catch { return ''; }
  const k = kTok(st.context), min = Math.round(idle / 60000);
  return `Waymark: esta sesión ya tiene ~${k} tokens de contexto y estuvo ${min} min inactiva; la caché del modelo venció, así que seguir aquí vuelve a escribir todo ese contexto (~${k} tokens de tu cuota) antes de responder. ` +
    'Recomendado: abre una sesión nueva en esta carpeta en los próximos 30 min; tu mensaje pasa solo (la memoria del proyecto también). Para seguir aquí igualmente, vuelve a enviarlo (este aviso sale una sola vez). ' +
    `· This session holds ~${k} tokens and was idle ${min} min; the cache expired. Open a new session here within 30 min and your message carries over, or resend it to continue here.`;
}

function sizeNotice(hook, st) {
  if (!NOTICE_TOKENS || st.context < NOTICE_TOKENS) return '';
  const level = NOTICE_STEP ? Math.floor((st.context - NOTICE_TOKENS) / NOTICE_STEP) : 0;
  const seen = prune(readJson(noticeFile)), key = hook.session_id || 'unknown';
  if (seen[key] && seen[key].level >= level) return '';
  try { writeJson(noticeFile, { ...seen, [key]: { at: Date.now(), level } }); } catch { return ''; }
  const k = kTok(st.context);
  return `Waymark: esta sesión ya tiene ~${k} tokens de contexto y cada respuesta los vuelve a leer. Si lo que sigue es una tarea nueva, abre otra sesión para ahorrar (la memoria del proyecto se pasa sola); si es la misma tarea, sigue aquí. · ~${k} tokens of context, re-read on every response: a new task is cheaper in a new session.`;
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
  let block = '', notice = '';
  try { block = resumeGuard(hook, st); } catch {}
  if (block) return { decision: 'block', reason: block };
  try { notice = sizeNotice(hook, st); } catch {}
  let ids = '';
  try { if (!silent) ids = taskLine(hook.cwd || process.cwd()); } catch {}
  try { if (!silent) saveSnapshot(hook.session_id, hook.cwd || process.cwd()); } catch {} // the end-of-turn hook diffs against it
  try { if (!silent) markOpen(hook.cwd || process.cwd(), hook.session_id, hook.prompt); } catch {} // a turn that never ends still shows in tasks.md
  const reminder = silent ? '' : (st.openedWithWaymark ? short : full) + ids + (mode === 'waymark-leads' ? coexist : '');
  const extra = await updateLine();
  const out = {};
  if ((reminder + extra).trim()) out.hookSpecificOutput = { hookEventName: 'UserPromptSubmit', additionalContext: (reminder + extra).trim() };
  if (notice) out.systemMessage = notice;
  return Object.keys(out).length ? out : null;
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
