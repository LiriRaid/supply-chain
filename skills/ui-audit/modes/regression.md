# ui-audit · mode: regression

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** after a fix round, before a release, "verifica que sigan corregidos".
- **Steps:**
  1. Load the findings from `## UI audit log` (or the earlier report in this conversation).
  2. Locate each one by file and the recorded snippet, because lines move. Re-run only that rule's check there.
  3. Classify: fixed · still open · regressed (fixed before, back now) · gone (code removed).
  4. Do not hunt for new issues. If something new is obvious, count it and recommend an `audit`.
  5. Remove confirmed-fixed entries from the log; keep the rest.
- **Output:** table `# · rule · location · before · now`.
