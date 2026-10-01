# library-docs · mode: configure

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** setting up or changing a library's configuration, provider wiring, CLI flags or build integration.
- **Steps:** 1. Detect the version and the existing config files. 2. Query only the option being changed. 3. Change the minimum; keep unrelated options as they are. 4. Run the gate that would catch a bad config (build or typecheck).
- **Output:** the config diff, the doc reference and the gate result.
