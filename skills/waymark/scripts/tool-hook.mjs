#!/usr/bin/env node
// Waymark · inline-script guard. Registered by INSTALL.md as a pre-tool hook (Claude Code: PreToolUse, matcher
// "Bash|PowerShell"). Runs locally (0 tokens unless it fires). An inline `node -e "…"` whose code holds backticks,
// `${`, or regex escapes (\d, \s, \/ …) gets mangled by shell quoting: the call "succeeds" with a broken script and
// costs another round trip (measured in real tests, twice). The hook denies that one call and tells the agent to write
// the script to a file and run it. Anything else passes silently. `# waymark:allow` in the command skips the check.
// Remove it from the agent's settings to disable it.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INLINE = /\bnode(?:\.exe)?["']?\s+(?:--[\w-]+(?:=\S+)?\s+)*(?:-e|--eval|-p|--print)\b/;
const FRAGILE = /`|\$\{|\\[dDsSwWbB.\/()[\]{}|+*?^$nrt]/;

export function check(command) {
  const c = String(command || '');
  if (!INLINE.test(c) || c.includes('# waymark:allow')) return null;
  const code = c.slice(c.search(INLINE));
  if (!FRAGILE.test(code)) return null;
  return 'Waymark: inline node -e code with backticks, ${ or regex escapes gets mangled by shell quoting (Environment note). ' +
    'Write the script to a file with the Write tool (scratchpad) and run `node <file>`. If this command is really safe, add `# waymark:allow` to it.';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input = '', done = false;
  const run = () => {
    if (done) return;
    done = true;
    let reason = null;
    try { const h = JSON.parse(input); reason = check(h.tool_input?.command); } catch {}
    if (reason) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
  };
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', run);
  process.stdin.resume();
  setTimeout(run, 1000).unref();
}
