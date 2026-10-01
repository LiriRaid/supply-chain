<!-- supply-chain:begin -->
<!-- Managed by the supply chain installer (INSTALL.md). Edit outside this block; this block is replaced on update. -->
# Working instructions

## Supply chain — every task, any size

Only **L0** (a color, a text, a typo, one value) is done directly. Every other task, small, medium or large, goes through the department that owns it, its rules and its skills. Size decides the level, never whether the supply chain runs.

| Level | Example | Load |
|---|---|---|
| L1 | bug or small change in 1–2 known files | department `SKILL.md` + one procedure section |
| L2 | screen, endpoint, integration, bug across >2 files | + `supply-chain/references/protocol.md` + department skills |
| L3 | refactor, migration, new module, new project | L2 + `sc-architecture` + plan before coding + ADR |

**Route by what the task is about** and load that skill before any other skill or edit:
UI code → `sc-frontend` · look & feel, accessibility, motion → `sc-ux-ui` · API, service, job, webhook, realtime → `sc-backend` · schema, migration, query, cache, state → `sc-data` · auth, permissions, secrets, vulnerabilities → `sc-security` · tests, bugs, review → `sc-qa` · build, CI, git, deploy → `sc-devops` · structure, refactor, patterns → `sc-architecture` · idea → scope and criteria → `sc-product` · skills, agent config, docs → `sc-devex` · unsure → `supply-chain`.

**Token discipline (layered loading).** This block is always loaded; nothing else is, until needed. Load one department; inside it read only the procedure section you need from `procedures.md`; open core references, stack and architecture profiles only in the situations they list; search large files instead of reading them whole. Never preload "just in case". (`supply-chain/…` paths are inside `<skills-dir>`, see `~/.supply-chain/agent.md`.)

## Supply chain protocol

**Entry** (before the first edit):
1. Project memory `~/.supply-chain/projects/<slug>.md`. Missing, or without *Project map* → `supply-chain/references/project-detection.md` (detect + minimal scan) and create it.
2. Department `SKILL.md` → Rules, Tools, Procedures index. Stack profile only in the sections the department names.
3. Memory MCP available (e.g. engram) → `mem_search` the task's topic before re-reading code.
4. Print the brief: `Supply chain → L<n> · <dept> (+support) · stack · arch` then *Qué · Para qué · Dónde · Cómo (procedure, skills, docs)*.

**Skills.** Skills are used through their triggers: use the ones the department's **Tools** table names for this task. A needed skill does not exist → follow `supply-chain/references/skills.md`: install a known one (ask first) or **create it** with its trigger, asking whether it should be **global or for this project**, register it and use it. Never invent skill or tool names.

**Project instructions.** If the project has its own `CLAUDE.md` / `AGENTS.md`, it is loaded too and its rules win for that project. When a project needs a rule on every task that differs from these, propose creating or extending it (ask first; details in `project-detection.md`).

**Exit** (before saying done):
1. Gates with the commands in project memory: typecheck · lint (changed files) · tests · build (L2+). Real output; never claim done with red gates.
2. L2+: architecture conformance and review (protocol.md).
3. **Learn — always, every L1+ task:** anything new and non-obvious goes to exactly one place (`supply-chain/references/learning.md`); keep `~/.supply-chain/` current.
4. Memory MCP available → `mem_save` decisions, bug root causes, conventions discovered and skills created; at the end of a long session `mem_session_summary`.
5. Close with `## Cierre`: level, departments, skills used, gates, files learned, skills created.

## Private layer `~/.supply-chain/` (self-filling, never ask the user to fill it)

`profile.md` stacks seen · `preferences.md` how to answer and deliver (read before replying; add a line when the user corrects you) · `subagents.md` search and delegation rules · `projects.md` project index · `projects/<slug>.md` per-project memory · `agent.md` this agent's paths (`<skills-dir>`, `<project-skills-dir>`; agents without a skill tool read `<skills-dir>/<name>/SKILL.md`).

## General rules

- Reply in the user's language; code, identifiers and commits in the project's language.
- Package manager from the lockfile; never mix.
- Preserve current behavior (visuals, keyboard/hover/focus, animations, responsive, public APIs) unless asked.
- Smallest change; no new abstractions unless asked; do not replace the project's patterns or libraries; fix first, propose refactors separately; check all consumers of shared code.
- Search before reading; delegate broad exploration (`subagents.md`).
- Ask before destructive, outward-facing or irreversible actions (delete, push, publish, install).
<!-- supply-chain:end -->
