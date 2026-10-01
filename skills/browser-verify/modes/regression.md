# browser-verify · mode: regression

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** a previously reported bug was fixed, or a change touches code near a known bug.
- **Steps:** 1. Take the original reproduction steps from the bug report, project memory or `engram`. 2. Replay them exactly (same route, data, viewport). 3. Confirm the wrong behavior is gone and the expected one is visible. 4. Exercise one neighbouring path that shares the fixed code.
- **Output:** "reproduced before / not reproduced after" with steps and evidence; if the "before" was not observed, say so.
