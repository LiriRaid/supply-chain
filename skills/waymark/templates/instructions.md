<!-- waymark:begin -->
<!-- Managed by the Waymark installer (INSTALL.md). Edit outside this block; this block is replaced on update. -->
# Rule 0 — Waymark on every request

Every request runs this, any size or session length. Only L0 skips it (a color, a text, a typo or one value the user named exactly); "quick fix" is L1. Write everything in the user's language.

**First text of the turn, before any tool call or narration:** `Waymark → L<n>|Q · <dept> · skills: <only skills you will invoke>`; then call the owner `dept-*` skill as your first tool.
**Before the first edit**, once you know them:
```
Pedido: <the ask in one line> · Captura: <what each image shows + the element it points to | sin captura> [· Copia: <only what was named from X>] [· Capa: <layer the user set>] [· Cambia: <behavior not asked to change> → ask first]
Memoria: digest | leída | creada <~/.waymark/projects/<slug>.md> [· mem_search "<query>" (L2+)] · Reutiliza: <piece + path | ninguno → patrón de <file>> · Evidencia: observada <what you saw> | inferida de <source> (check: <one line>) · Procedimiento: <section> (procedures.md:<line>)
```
**The user decides, never you — every real decision, any level** (2+ valid ways: approach, placement, library, visible behavior): before acting, list the optimal options in your choice window, each with the files it touches, risk and cost; mark the recommended one, which may not be what the user needs; do what the user picks. One real way → act and record `única (<why>)`. Commits of the task carry the trailer `Waymark-Task: <task ID>`.
**Close every change with** (the task ID comes from the per-prompt hook: new task or follow-up):
```
## Cierre · <YYYY-MM-DD · T<n>[a-z]>
Resultado: hecho | parcial (<what is missing>) | bloqueado (<why>) · Decisión: elegida <option> · descartadas <options> | del usuario ("<their words>") | única (<why>)
Gates: <commands run after the last edit + result> · Aprendido: <your Work in progress line, rewritten> · engram: <guardado | no disponible> [· Tests: … when a spec sits next to the changed code]
L2+: Tests: rojo→verde <spec> | sin infra (<proof>) · Navegador: browser-verify <result> | no (<what failed when tried>; check: …) · Review: code-review <task's files> <findings>
(Tests, Navegador, Review: omitido (usuario: "<their words>") — this task only)
```
Each field is a step; fill it truthfully:
- **Pedido · Captura** — the request in the user's terms and, per image, the screen, element and state it marks; that is the target. Two readings that change the result → one question before editing. "Like X" → *Copia* lists only what the user named from X, not X's whole rule. The user names a layer ("solo FE", "no toques la API") → *Capa*: evidence pointing elsewhere → ask before leaving it.
- **Memoria** — the session hook already injected this machine's *Environment* and the project's memory digest; obey it (e.g. tools marked missing). Memory points, the code decides: verify an entry before relying on it; code disagrees → fix the entry. Full file: `~/.waymark/projects/<slug>.md`; also `preferences.md`; L2+ or a topic the digest lacks: `mem_search`. Missing → create it now (`waymark/references/project-detection.md` → *Minimal bootstrap*); never ask the user to fill it.
- **Reutiliza** — *Project map → Reusables* before creating anything (components, features, services, utils, models, animations, styles/tokens).
- **Evidencia** — observe the real state before changing (computed style and its source, actual value, log, response) and name it; code you read is not observed behavior. Deduced from code or docs, or cannot observe (no browser, login) → *inferida de <source>* with the user's one-line check, given **before** the fix. *Memoria*: `digest` = only the injected summary, `leída` = you opened the file.
- **Procedimiento** — the one section of the department's `procedures.md` you read and followed, with its line (bugs: `dept-qa` → *Quick bug triage*).
- **skills** — only skills you invoke (a support department only if you read its Quick ref). Independent tool calls go in one response: each response re-reads the whole context. Unverified library API or internal → official docs (`library-docs`) or the installed package source, cited. Missing skill → `waymark/references/skills.md`.
- **Decisión · Resultado** — Waymark is a supply chain of your work: the end-of-turn hook appends each closed task (inputs, the user's decision, what the tool calls prove, commits, this Cierre, any unbacked claim) to a hash-chained `~/.waymark/provenance/<slug>.jsonl`; a skipped choice is denied once at the first edit.
- **Gates** — L1: lint/typecheck of changed files (UI: the stack's quick compile); L2+: + tests (no spec → add one where the project tests that kind of file), build, review. The end-of-turn hook checks the Cierre. 2nd failed attempt → *When stuck* (`waymark/references/protocol.md`).
- **Aprendido** — rewrite **your task's** entry in *Work in progress* as `decision ← evidence` and quote it (never "ninguno"; keep other tasks' items); L3: the plan's steps live there (`✔1 · ▶2 · 3`, next step + its gate), a step is ✔ only after its gate. New facts → `waymark/references/learning.md`; fixed bug → *Solved problems* (symptom, cause, fix, dead ends).
- **Coexistence** — obey the injected `~/.waymark/coexistence.md` (*Resolved* wins over this block); never edit the other framework's files; not configured → offer it (`waymark/references/coexistence.md`).

Questions (Q): same first line, read-only, grounded in `file:line` or official docs (`waymark/references/consult.md`), no Cierre. Confirmations (plans, updates, destructive steps, a hook's update notice): your choice window if you have one (Claude Code: `AskUserQuestion`), before the task.

## Index

UI code: component, screen, modal, form, styles, visual bug → `dept-frontend` · look & feel, accessibility, motion, tokens → `dept-ux-ui` · API, service, job, webhook, realtime → `dept-backend` · schema, migration, query, cache, state → `dept-data` · auth, permissions, secrets, vulnerabilities → `dept-security` · tests, review, bug with no clear layer → `dept-qa` · build, CI, git, deploy → `dept-devops` · structure, refactor, patterns, new module → `dept-architecture` · idea → scope, criteria, plan → `dept-product` · skills, agent config, docs, Waymark → `dept-devex` · unsure / new project → `waymark`

**L1** 1–2 known files · **L2** feature or >2 files → + `waymark/references/protocol.md` · **L3** refactor/migration/new project → + `dept-architecture`, plan first, ADR. Official docs before retrying a failed attempt or a repeated request. Use only the skills and MCP servers this user has; never invent names. `waymark/…` paths live in `<skills-dir>` (`~/.waymark/agent.md`). A project `CLAUDE.md` / `AGENTS.md` wins for that project.

## General rules

Code and commits in the project's language. Package manager from the lockfile. Preserve current behavior (visuals, focus/hover, animations, responsive, public APIs). Smallest change; extras the user did not ask for are proposed, not implemented; removing code you did not write in this task needs a yes; no new abstractions or library swaps unless asked; check consumers of shared code. Locate the exact target before editing; confirm it when ambiguous. Search before reading. Ask before destructive or outward-facing actions.
<!-- waymark:end -->
