#!/usr/bin/env node
// Waymark · pre-tool checks. Registered by INSTALL.md as a pre-tool hook (Claude Code: PreToolUse, matcher
// "Bash|PowerShell|Edit|Write|NotebookEdit"). Runs locally (0 tokens unless it fires); each check denies one call
// with the reason and the fix, and lets everything else through silently. Measured in real tests:
// - Inline scripts: `node -e "…"` with backticks, `${` or regex escapes is mangled by shell quoting and "succeeds"
//   with a broken script (twice). `# waymark:allow` in the command skips it.
// - Recursive search through dependencies: `grep -r` / `find` over a folder holding node_modules without excluding
//   it hung 120 s (four times). The Grep/Glob tools skip ignored folders.
// - Edit without opener: a turn routed "Waymark → L1-L3" edits before writing "Pedido:" (the opener was skipped and
//   files were created on the wrong layer). This one never denies: the transcript does not keep every reply text
//   (text written after a thinking block in the same response is not persisted, checked on Claude Code 2.1.286), so
//   it only adds a one-line note next to the edit. Memory and scratch files are exempt; L0 and Q turns have no opener.
// Remove the hook from the agent's settings to disable it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { readTail, currentTurn, routedLevel } from './transcript.mjs';

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
  if (!turn.texts.some((t) => /Pedido:/.test(t))) notes.push(`no opener found for this L${level} turn: if you skipped it, write "Pedido · Captura" and "Memoria · Reutiliza · Evidencia · Procedimiento" in your next text before more edits (if you wrote it, ignore this)`);
  // L2+: recall from engram before the first edit, when engram is available in this session.
  const engram = lines.some((d) => JSON.stringify(d.attachment || '').includes('mcp__engram__') || (d.message?.content || []).some?.((c) => c.type === 'tool_use' && c.name.startsWith('mcp__engram__')));
  const searched = lines.some((d) => (d.message?.content || []).some?.((c) => c.type === 'tool_use' && /mcp__engram__mem_(search|context)/.test(c.name)));
  const firstEdit = !turn.tools.some((t) => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(t.name) && !exempt(t.input.file_path || t.input.notebook_path));
  if (level >= 2 && engram && !searched && firstEdit) notes.push('L2+ and no mem_search yet in this session: run mem_search with the task\'s key terms before this edit (past decisions, rejected paths)');
  return notes.length ? `Waymark: ${notes.join('; ')}.` : null;
}

// → { deny: reason } for commands, { note: text } for edits, or null.
async function main(input) {
  const h = JSON.parse(input);
  const tool = h.tool_name || '';
  if (/^(Bash|PowerShell)$/.test(tool)) { const deny = checkCommand(h.tool_input?.command, h.cwd || process.cwd()); return deny ? { deny } : null; }
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) {
    const note = checkEdit(h.tool_input?.file_path || h.tool_input?.notebook_path, readTail(h.transcript_path, 512 * 1024));
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
