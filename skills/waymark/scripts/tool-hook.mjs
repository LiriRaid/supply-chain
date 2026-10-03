#!/usr/bin/env node
// Waymark · pre-tool checks. Registered by INSTALL.md as a pre-tool hook (Claude Code: PreToolUse, matcher
// "Bash|PowerShell|Edit|Write|NotebookEdit"). Runs locally (0 tokens unless it fires); each check denies one call
// with the reason and the fix, and lets everything else through silently. Measured in real tests:
// - Inline scripts: `node -e "…"` with backticks, `${` or regex escapes is mangled by shell quoting and "succeeds"
//   with a broken script (twice). `# waymark:allow` in the command skips it.
// - Recursive search through dependencies: `grep -r` / `find` over a folder holding node_modules without excluding
//   it hung 120 s (four times). The Grep/Glob tools skip ignored folders.
// - First L2+ edit with no mem_search yet (engram available): a one-line note, never a denial. Based on tool calls,
//   which the transcript keeps reliably. (1.8.0 also noted a missing opener; removed in 1.9.0: reply text written after
//   a thinking block is not persisted, so it fired on openers that were there — three false notes in one real task.)
//   Memory and scratch files are exempt; L0 and Q turns are skipped.
// - Decision gate (2.0, docs/adr/0001, 0002): the first L1–L3 project edit of a prompt is denied once when
//   the task has no choice-window question (AskUserQuestion) yet; the retry passes, for a single real option or a
//   choice the user already wrote, which the Cierre then states (`Decisión: única (…)` / `del usuario ("…")`).
// Remove the hook from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { readTail, currentTurn, routedLevel } from './transcript.mjs';
import { taskLines, askedChoice } from './provenance.mjs';

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
  if (level >= 2 && engram && !searched && firstEdit) notes.push('L2+ and no mem_search yet in this session: run mem_search with the task\'s key terms before this edit (past decisions, rejected paths)');
  return notes.length ? `Waymark: ${notes.join('; ')}.` : null;
}

// Decision gate: deny once per prompt (state keyed by session + prompt uuid), never for L0 or exempt files. A turn routed
// Q that edits a project file is denied once too: a question that became a change must re-route (test 2.0-1: routed Q,
// 8 edits, so every check and the record were skipped).
export function checkDecision(file, lines, session = 'unknown', stateFile = path.join(process.env.WAYMARK_HOME || path.join(os.homedir(), '.waymark'), '.decision-gate.json')) {
  if (!file || exempt(file)) return null;
  const turn = currentTurn(lines);
  const level = routedLevel(turn.texts), q = level === 'Q';
  if (!turn.found || !level || (!q && askedChoice(taskLines(lines)))) return null;
  let seen = {};
  try { seen = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}
  const key = `${session}:${turn.uuid || turn.prompt.slice(0, 80)}${q ? ':q' : ''}`;
  if (seen[key]) return null;
  for (const [k, at] of Object.entries(seen)) if (Date.now() - at > 7 * 86400000) delete seen[k];
  seen[key] = Date.now();
  try { fs.mkdirSync(path.dirname(stateFile), { recursive: true }); fs.writeFileSync(stateFile, JSON.stringify(seen)); } catch { return null; } // no state → never deny (it could repeat)
  if (q) return 'Waymark: this turn was routed as a question (Q) but is about to change a project file. A question that becomes a change is a task: write a new routing line `Waymark → L<n> · <owner dept-*> · skills: …` (invoke that department if it is not loaded), then the opener, and put the decision to the user with the optimal options before editing. The end-of-turn hook will check this task as L2 at least and record it.';
  return `Waymark: L${level} decision gate — the user decides every real decision, you never decide alone. Before the first edit, list the optimal options in your choice window (AskUserQuestion): for each one the files it touches, the risk and the cost; mark the recommended one (it may not be what the user needs). Then do what the user picks. ` +
    'If the user already chose in their message, or there is only one real option, retry this edit (this gate fires once per prompt) and write in the Cierre `Decisión: del usuario ("<their words>")` or `Decisión: única (<why>)`.';
}

// → { deny: reason } for commands and the decision gate, { note: text } for edits, or null.
async function main(input) {
  const h = JSON.parse(input);
  const tool = h.tool_name || '';
  if (/^(Bash|PowerShell)$/.test(tool)) { const deny = checkCommand(h.tool_input?.command, h.cwd || process.cwd()); return deny ? { deny } : null; }
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const file = h.tool_input?.file_path || h.tool_input?.notebook_path, lines = readTail(h.transcript_path, 2 * 1024 * 1024);
    const deny = checkDecision(file, lines, h.session_id);
    if (deny) return { deny };
    const note = checkEdit(file, lines);
    return note ? { note } : null;
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
