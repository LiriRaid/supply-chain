<!-- waymark:begin -->
<!-- Managed by the Waymark installer (INSTALL.md). Edit outside this block; this block is replaced on update. -->
# Rule 0 — Waymark on every request

**Every request restarts this routine**, any size, any session length, after a context summary. Only L0 skips it (a color, a text, a typo or one value the user named exactly). "Looks small" or "quick fix" is L1, not L0.

**First text of the turn**, before any tool call or narration: `Waymark → L<n>|Q · <dept> (+support) · skills: <…>`. **First tool call:** the owner `dept-*` skill (index below); only its Rules, Tools and the one procedure section you need. **All text** you write, progress notes included, is in the user's language.

1. **Recall** — `~/.waymark/profile.md` → *Environment* (how this machine works) and `~/.waymark/projects/<slug>.md`: *Work in progress* (pending, maybe from another agent → "La última vez (<agent>) estábamos en X; falta Y"), *Solved problems* by symptom, *Project map* (+ `mem_search` if engram is available). **Missing → create it now in one step** (`waymark/references/project-detection.md` → *Minimal bootstrap*); the full scan is for L2+.
2. **Route** — department first. **Reuse before create:** *Project map → Reusables* (components, features, services, utils, models, animations, styles/tokens); the brief states `Memoria: leída | creada <file>` and `Reutiliza: <piece + path>` or `Ninguno → patrón de <file>`, before the first edit.
3. **Skills** — the ones the department's Tools table names, through their triggers. **Every skill in the routing line is invoked with the skill tool**; do not announce a skill you will not call. Missing → create it (`waymark/references/skills.md`, ask global or project).
4. **Verify** — **evidence before change** for bugs and visual fixes: observe the real state (computed style and its source, actual value, log, response). No browser or behind a login → give the user a one-line DevTools/console check and mark the fix *no verificado*. Gates with the project's commands: **L1 minimum = lint or typecheck of the changed files** (UI: also the quickest compile check); L2+ adds tests, build, review. **Gates run after the last edit.** No spec for the changed code → write one if the project has test setup for that kind of file; if not, say "sin infraestructura de test" and give the one-line check instead of skipping silently. **Two-strike rule:** 2nd failed attempt → stop varying; *When stuck* in `waymark/references/protocol.md`.
5. **Learn** — always: rewrite *Work in progress*; anything new → its place (`waymark/references/learning.md`, `mem_save`); a fixed bug → *Solved problems* (symptom, cause, fix, dead ends). A missing memory file is never a reason to skip this.

Close changes with `## Cierre` (gates run, skills used or created, learned). **Questions (Q)** run the same routine read-only (`waymark/references/consult.md`): grounded in `file:line` or official docs, no gates. **Confirmations** (plans, installs, updates, global vs project skill, destructive steps): your choice window if the agent has one (Claude Code: `AskUserQuestion`), else text; an update notice from the hook is asked the same way, before the task.

## Index — what loads what

| Request about | Department | Default skills / MCP |
|---|---|---|
| UI code: component, screen, modal, form, styles | `dept-frontend` | ui-build · browser-verify · library-docs |
| look & feel, accessibility, motion, tokens | `dept-ux-ui` | ui-refine · ui-system · ui-audit |
| API, service, job, webhook, realtime | `dept-backend` | library-docs · code-review |
| schema, migration, query, cache, state | `dept-data` | library-docs · code-review |
| auth, permissions, secrets, vulnerabilities | `dept-security` | security-review · code-review |
| bug, "no funciona", tests, review | `dept-qa` (*Quick bug triage*) | browser-verify · code-review |
| build, CI, git, deploy | `dept-devops` | run · code-review |
| structure, refactor, patterns, new module | `dept-architecture` | Plan · Explore · ADR |
| idea → scope, criteria, plan | `dept-product` | Plan · memory |
| skills, agent config, docs, Waymark | `dept-devex` | skill-creator · references/skills.md |
| unsure / new project | `waymark` | references/project-detection.md |

**L1** 1–2 known files · **L2** feature or >2 files → + `waymark/references/protocol.md` · **L3** refactor/migration/new project → + `dept-architecture`, plan first, ADR. Official docs via `library-docs` (installed version) for any API not verified this session, every L2+ framework task, and **always before retrying** a failed attempt or a repeated request. Use only the skills and MCP servers this user has; never invent names. `waymark/…` paths live in `<skills-dir>` (`~/.waymark/agent.md`).

## Memory `~/.waymark/` (self-filling; never ask the user to fill it)

`projects/<slug>.md` per project · `projects.md` index · `profile.md` stacks · `preferences.md` how to answer (read first; add a line when corrected) · `subagents.md` delegation · `learnings/` staging. A project `CLAUDE.md` / `AGENTS.md` wins for that project.

## General rules

Code and commits in the project's language. Package manager from the lockfile. Preserve current behavior (visuals, focus/hover, animations, responsive, public APIs). Smallest change; **do not add behavior the user did not ask for: propose it**; no new abstractions or library swaps unless asked; check consumers of shared code. Locate the exact target (file, element, selector, applied style) before editing; confirm it when ambiguous. Search before reading. Ask before destructive or outward-facing actions.
<!-- waymark:end -->
