# Changelog

The installed version is in `<skills-dir>/supply-chain/VERSION`. Update with: *"actualiza el supply chain desde https://github.com/LiriRaid/supply-chain siguiendo su INSTALL.md"* (INSTALL §9).

## 0.4.0
- **Update notices:** the Rule 0 hook checks the repository's `VERSION` once a day (0 tokens; one line of context at most once a day only when a newer version exists) and the agent offers *Actualizar ahora / Más tarde / Ver cambios*. Only a version change triggers it, never plain commits.
- **Choice windows:** confirmations (install plan, updates, global vs project skill, removals) use the agent's choice window when it has one (Claude Code: `AskUserQuestion`), text otherwise.

## 0.3.0
- **Handoff between sessions and agents:** project memory → *Work in progress* (task, done, next, open, last request), read first at Recall and rewritten after every task and milestone, so another agent or session resumes where the last one stopped.
- **Multi-agent install:** INSTALL detects every agent on the machine and configures the selected ones in one run, sharing `~/.supply-chain/`.
- **Versioned updates:** `VERSION` file and this changelog; INSTALL §9 compares versions and reports what changed.
- Fixes from the first real install: back up third-party skills before removing them and clean `~/.agents/.skill-lock.json`; `skill-map.json` no longer ships machine-specific entries.

## 0.2.0
- Layered loading (instructions block → department → one procedure → one mode), Rule 0 with routing receipt and skill index, per-prompt Rule 0 reminder hook, consult mode for questions.
- Reuse before create, project map with reusables by kind, minimal project scan, generated architecture profiles.
- Official-docs escalation, two-strike rule, evidence before change, *Solved problems* log.
- Missing skills are created (global or project, asked), MCP servers the user has are mapped and used.

## 0.1.0
- First public release: 10 department skills, core protocol, 6 tool skills, agent adapters, agent-executable INSTALL.md.
