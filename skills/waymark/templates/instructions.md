<!-- waymark:begin -->
<!-- Managed by the Waymark installer (INSTALL.md). Edit outside this block; this block is replaced on update. -->
# Rule 0 — Waymark on every request

Every request runs this, any size or session length. Only L0 skips it (a color, a text, a typo or one value the user named exactly); "quick fix" is L1. Write everything in the user's language.

**First text of the turn, before any tool call or narration:** `Waymark → L<n>|Q · <dept> · skills: <only skills you will invoke>`; then call the owner `dept-*` skill as your first tool.
**Before the first edit**, once you know them:
```
Memoria: leída|creada <~/.waymark/projects/<slug>.md> · Reutiliza: <piece + path | ninguno → patrón de <file>> · Evidencia: observada | hipótesis (check: <one line>) · Procedimiento: <section>
```
**Close every change with:**
```
## Cierre
Gates: <commands run after the last edit + result> · Aprendido: <file / Solved problems / ninguno> · engram: <guardado | no disponible>
L2+: Tests: rojo→verde | sin infra (<check>) · Navegador: verificado | no (<why + check>) · Review: <done | findings>
```
Each field is a step; fill it truthfully:
- **Memoria** — the session hook already injected this machine's *Environment* and the project's memory digest; obey it (e.g. tools marked missing). Full file: `~/.waymark/projects/<slug>.md`; also `preferences.md` (how to answer); `mem_search` if engram is available. Missing → create it now (`waymark/references/project-detection.md` → *Minimal bootstrap*). This memory fills itself; never ask the user to fill it.
- **Reutiliza** — *Project map → Reusables* before creating anything (components, features, services, utils, models, animations, styles/tokens).
- **Evidencia** — observe the real state before changing (computed style and its source, actual value, log, response). Cannot (no browser, login) → *hipótesis* with the user's one-line check, given **before** the fix.
- **Procedimiento** — the one section of the department's `procedures.md` you followed (bugs: `dept-qa` → *Quick bug triage*).
- **skills** — every skill listed is invoked; a support department is listed only if you read its Quick ref. A library API or internal not verified this session → verify it in official docs (`library-docs`) or in the installed package source (cite the file). Missing skill → `waymark/references/skills.md` (ask global or project).
- **Gates** — L1: lint or typecheck of changed files (UI: quickest compile check); L2+: + tests, build, review. No spec → add one where the project tests that kind of file, else "sin infraestructura de test" + one-line check. 2nd failed attempt → *When stuck* (`waymark/references/protocol.md`).
- **Aprendido** — rewrite **your task's** entry in *Work in progress* (keep other tasks' pending items); new facts → `waymark/references/learning.md`; fixed bug → *Solved problems* (symptom, cause, fix, dead ends).

Questions (Q): same first line, read-only, answer grounded in `file:line` or official docs (`waymark/references/consult.md`), no Cierre. Confirmations (plans, updates, global vs project skill, destructive steps): your choice window if you have one (Claude Code: `AskUserQuestion`); an update notice from the hook is asked that way before the task.

## Index

| Request about | Department |
|---|---|
| UI code: component, screen, modal, form, styles, visual bug | `dept-frontend` |
| look & feel, accessibility, motion, tokens | `dept-ux-ui` |
| API, service, job, webhook, realtime | `dept-backend` |
| schema, migration, query, cache, state | `dept-data` |
| auth, permissions, secrets, vulnerabilities | `dept-security` |
| tests, review, bug with no clear layer | `dept-qa` |
| build, CI, git, deploy | `dept-devops` |
| structure, refactor, patterns, new module | `dept-architecture` |
| idea → scope, criteria, plan | `dept-product` |
| skills, agent config, docs, Waymark | `dept-devex` |
| unsure / new project | `waymark` |

**L1** 1–2 known files · **L2** feature or >2 files → + `waymark/references/protocol.md` · **L3** refactor/migration/new project → + `dept-architecture`, plan first, ADR. Official docs before retrying a failed attempt or a repeated request. Use only the skills and MCP servers this user has; never invent names. `waymark/…` paths live in `<skills-dir>` (`~/.waymark/agent.md`). A project `CLAUDE.md` / `AGENTS.md` wins for that project.

## General rules

Code and commits in the project's language. Package manager from the lockfile. Preserve current behavior (visuals, focus/hover, animations, responsive, public APIs). Smallest change; extras the user did not ask for are proposed, not implemented; removing code you did not write in this task needs a yes; no new abstractions or library swaps unless asked; check consumers of shared code. Locate the exact target before editing; confirm it when ambiguous. Search before reading. Ask before destructive or outward-facing actions.
<!-- waymark:end -->
