# ui-audit · mode: fix

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** the user approved findings by number, rule id or severity.
- **Steps:**
  1. Restate the approved list. Nothing else changes; issues noticed on the way become new findings.
  2. Group by file. Apply the rule's **Fix** with existing tokens and components; keep hover, focus, keyboard behavior, animations, inputs and outputs intact.
  3. Structural changes (element swap, focus management, live-region service) follow `sc-frontend` conventions; library components are fixed through their own accessibility API (check props with the library's docs or MCP).
  4. Re-run each fixed rule's Check on the touched files. Run the `sc-qa` gates (typecheck, lint on changed files, related tests); add a test when behavior changed, such as a new keyboard handler.
  5. Update the audit log.
- **Output:** table `# · rule · file:line · fixed | partial | deferred (reason)`, gate output.
