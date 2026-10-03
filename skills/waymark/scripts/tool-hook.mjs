#!/usr/bin/env node
// Waymark · pre-tool checks. Registered by INSTALL.md as a pre-tool hook (Claude Code: PreToolUse, matcher
// "Bash|PowerShell|Edit|Write|NotebookEdit"). Runs locally (0 tokens unless it fires); each check denies one call
// with the reason and the fix, and lets everything else through silently. Measured in real tests:
// - Inline scripts: `node -e "…"` with backticks, `${` or regex escapes is mangled by shell quoting and "succeeds"
//   with a broken script (twice). `# waymark:allow` in the command skips it.
// - Recursive search through dependencies: `grep -r` / `find` over a folder holding node_modules without excluding
//   it hung 120 s (four times). The Grep/Glob tools skip ignored folders.
// - Decision gate (2.0, docs/adr/0001–0005): every L1–L3 change to project files (edits, and shell commands that change
//   files: git checkout --, sed -i, rm, redirects) is denied until the task has a choice-window question
//   (AskUserQuestion) — strict since test 2.0-2, where a retry let the agent apply two decisions before asking. A turn
//   routed Q is told once to re-route (by tool call: the owner dept-* with args "L<n>"). The message names the repo's
//   branch and asks for the foreseeable sub-decisions in the same call. Memory and scratch files are exempt; L0 skipped.
//   Procedure and mem_search are recorded and scored by the end-of-turn hook, not denied here (user, 2026-10-03).
// Remove the hook from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readTail, currentTurn, routedLevel } from './transcript.mjs';
import { taskLines, askedChoice, changesProject } from './provenance.mjs';

const INLINE = /\bnode(?:\.exe)?["']?\s+(?:--[\w-]+(?:=\S+)?\s+)*(?:-e|--eval|-p|--print)\b/;
const FRAGILE = /`|\$\{|\\[dDsSwWbB.\/()[\]{}|+*?^$nrt]/;
const GREP_R = /\bgrep\s+(?:-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b/;
const FIND = /(?:^|[;&|]\s*)find\s+(\.|\.\/|"?\.\/?"?)(?:\s|$)/;
const norm = (p) => String(p || '').replace(/\\/g, '/').toLowerCase();

export function checkCommand(command, cwd = process.cwd()) {
  const c = String(command || '');
  if (c.includes('# waymark:allow')) return null;
  if (INLINE.test(c) && FRAGILE.test(c.slice(c.search(INLINE)))) {
    return 'Waymark: inline node -e code with backticks, ${ or regex escapes gets mangled by shell quoting (Environment note). ' +
      'Write the script to a file with the Write tool (scratchpad) and run `node <file>`. If this command is really safe, add `# waymark:allow` to it.';
  }
  if (/(?:^|[;&|(]\s*)git\s+stash\b(?!\s+(list|show)\b)/.test(c)) { // as a command, not inside a search pattern
    return 'Waymark: do not stash the user\'s changes (staged state and new files can be lost). To prove a failure is pre-existing, use a clean copy of HEAD: `git worktree add <tmp> HEAD`, rerun the command there, `git worktree remove <tmp>`. If that is not allowed, report "no comprobado (sin permiso para <command>)". `# waymark:allow` skips this check when the user asked for a stash.';
  }
  const deps = fs.existsSync(path.join(cwd, 'node_modules'));
  if (deps && GREP_R.test(c) && !/--exclude-dir[= ]\S*node_modules/.test(c)) {
    return 'Waymark: recursive grep here walks node_modules (it hung 120 s in real tests). Use the Grep tool (it skips ignored folders) or add --exclude-dir=node_modules. `# waymark:allow` skips this check.';
  }
  if (deps && FIND.test(c) && !/node_modules/.test(c)) {
    return 'Waymark: find from the project root walks node_modules. Use the Glob tool, or add -not -path "*/node_modules/*" (or -prune). `# waymark:allow` skips this check.';
  }
  return null;
}

// Files the routine itself writes (memory, learnings, scratch) never need the opener.
const exempt = (file) => {
  const f = norm(file), home = norm(os.homedir());
  return f.startsWith(`${home}/.waymark/`) || f.includes('/.claude/projects/') || f.includes('/appdata/local/temp/') || f.startsWith('/tmp/') || f.includes('/scratchpad/');
};

export function checkEdit(file, lines) {
  if (!file || exempt(file)) return null;
  const turn = currentTurn(lines);
  if (!turn.found) return null;
  const level = routedLevel(turn.texts);
  if (!level || level === 'Q') return null; // L0 (no routing line) or a question
  const notes = [];
  // L2+: recall from engram before the first edit, when engram is available in this session.
  const engram = lines.some((d) => JSON.stringify(d.attachment || '').includes('mcp__engram__') || (d.message?.content || []).some?.((c) => c.type === 'tool_use' && c.name.startsWith('mcp__engram__')));
  const searched = lines.some((d) => (d.message?.content || []).some?.((c) => c.type === 'tool_use' && /mcp__engram__mem_(search|context)/.test(c.name)));
  const firstEdit = !turn.tools.some((t) => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(t.name) && !exempt(t.input.file_path || t.input.notebook_path));
  // Since 2.0 the decision gate denies this once (checkDecision); the note stays for a gate that could not keep state.
  if (level >= 2 && engram && !searched && firstEdit) notes.push('L2+ and no mem_search yet in this session: run mem_search with the task\'s key terms before this edit (past decisions, rejected paths)');
  return notes.length ? `Waymark: ${notes.join('; ')}.` : null;
}

// Decision gate: deny once per prompt (state keyed by session + prompt uuid), never for L0 or exempt files. A turn routed
// Q that edits a project file is denied once too: a question that became a change must re-route (test 2.0-1: routed Q,
// 8 edits, so every check and the record were skipped).
export function checkDecision(target, lines, session = 'unknown', stateFile = path.join(process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark'), '.decision-gate.json'), cwd = process.cwd()) {
  // target: a file path (Edit/Write) or { command } (a shell command that changes files: git checkout --, sed -i, rm, >).
  if (target && typeof target === 'object') { if (!changesProject(target.command)) return null; }
  else if (!target || exempt(target)) return null;
  const turn = currentTurn(lines);
  const level = routedLevel(turn.texts, turn.tools), q = level === 'Q';
  if (!turn.found || !level) return null;
  let seen = {};
  try { seen = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}
  const once = (suffix) => { // true the first time per prompt; false after, or when the state cannot be kept
    const key = `${session}:${turn.uuid || turn.prompt.slice(0, 80)}:${suffix}`;
    if (seen[key]) return false;
    for (const [k, at] of Object.entries(seen)) if (Date.now() - at > 7 * 86400000) delete seen[k];
    seen[key] = Date.now();
    try { fs.mkdirSync(path.dirname(stateFile), { recursive: true }); fs.writeFileSync(stateFile, JSON.stringify(seen)); return true; } catch { return false; }
  };
  if (q && once('q')) return 'Waymark: this turn was routed as a question (Q) but is about to change project files. A question that becomes a change is a task: re-route with a tool call — invoke the owner dept-* skill with args "L<n>" (e.g. Skill dept-frontend, args "L2"); a routing line written mid-turn is not persisted — then the opener, and put the decision to the user with the optimal options before changing anything.';
  // Strict gate (user's decision 2026-10-02): no change until the user was asked in the choice window in this task.
  if (!askedChoice(taskLines(lines))) {
    const branch = branchAt(typeof target === 'object' ? cwd : path.dirname(target));
    return `Waymark: L${level} decision gate — the user decides every real decision, you never decide alone. Before changing files, ask in your choice window (AskUserQuestion): the approach with its optimal options (files, risk, cost; recommended marked, it may not be what the user needs) AND, as more questions in the same call (up to 4), the sub-decisions you can foresee — data/schema design, visual style, behavior details, defaults. ` +
      `${branch ? `This repo is on branch "${branch}": if that branch is not for this task, include where the work goes as an option. ` : ''}` +
      'If there is only one real way, or the user already chose in their message, confirm it there (that option + "otra cosa"). This gate stays until the user has been asked in this task.';
  }
  // The owner's procedure and mem_search are no longer denied here (2026-10-03, docs/adr/0005): the end-of-turn hook
  // records them and scores them in the task's evaluation.
  return null;
}

// Current branch of the repo at dir, or null (no git, not a repo, detached).
function branchAt(dir) {
  try {
    const r = spawnSync('git', ['symbolic-ref', '--short', 'HEAD'], { cwd: dir, encoding: 'utf8', timeout: 1000 }); // also on a branch with no commits; fails when detached
    return r.status === 0 ? r.stdout.trim() || null : null;
  } catch { return null; }
}

// → { deny: reason } for commands and the decision gate, { note: text } for edits, or null.
async function main(input) {
  const h = JSON.parse(input);
  const tool = h.tool_name || '';
  if (/^(Bash|PowerShell)$/.test(tool)) {
    const deny = checkCommand(h.tool_input?.command, h.cwd || process.cwd())
      || (changesProject(h.tool_input?.command) ? checkDecision({ command: h.tool_input?.command }, readTail(h.transcript_path, 2 * 1024 * 1024), h.session_id, undefined, h.cwd || process.cwd()) : null);
    return deny ? { deny } : null;
  }
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const file = h.tool_input?.file_path || h.tool_input?.notebook_path, lines = readTail(h.transcript_path, 2 * 1024 * 1024);
    const deny = checkDecision(file, lines, h.session_id, undefined, h.cwd || process.cwd());
    return deny ? { deny } : null; // the mem_search note (checkEdit) became a once-per-prompt denial in checkDecision
  }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input = '', done = false;
  const run = () => {
    if (done) return;
    done = true;
    main(input).then((r) => {
      if (r?.deny) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: r.deny } }));
      else if (r?.note) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: r.note } }));
    }).catch(() => {});
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
