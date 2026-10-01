#!/usr/bin/env node
// Supply chain · Rule 0 reminder. Registered by INSTALL.md as a per-prompt hook (Claude Code: UserPromptSubmit).
// Runs locally (0 tokens); only the short reminder below is added to the model's context (~50 tokens per prompt).
// It does not block, read or change the prompt. Remove it from the agent's settings to disable it.
const reminder =
  'Supply chain Rule 0: run the routine for this request (recall memory → load the owner sc-* department → its skills → verify → learn). ' +
  'Questions: consult mode (route to the topic department, read-only, cite sources). Only L0 skips. ' +
  'Start the reply with "Supply chain → L<n>|Q · <dept> · skills: …".';

let done = false;
const emit = () => {
  if (done) return;
  done = true;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: reminder } }));
};
process.stdin.on('data', () => {});
process.stdin.on('end', emit);
process.stdin.resume();
setTimeout(emit, 1000).unref();
