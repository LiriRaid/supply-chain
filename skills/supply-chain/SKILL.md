---
name: supply-chain
description: Supply chain entry point for software work in any stack, framework or language. Use at the start of any non-trivial development task (new feature, refactor, multi-file bug fix, new project from scratch, "quiero hacer un feature", "arranca el proyecto", "inicia el supply chain", "qué departamento aplica") to triage the task, pick the department skills (sc-frontend, sc-backend, sc-data, sc-security, sc-qa, sc-devops, sc-architecture, sc-ux-ui, sc-product, sc-devex) and resolve which skills and MCP servers to use from the skill registry. Also use to sync the skill registry, install missing skills, record learnings or generate project-specific skills. Department skills call this skill's Entry and Exit protocols. Not for trivial edits such as changing a color, a text or a single value.
---

# Supply Chain

A supply chain of **departments**. Every non-trivial task passes through the department that owns it before any tool skill is used. The department answers *what, why, for whom, where and how*, then decides which skills and MCP servers to call. Nothing is enforced by hooks: the trigger is each skill's description, and the discipline is this protocol.

Paths below are relative to this skill's directory. `~/.supply-chain/` is the **user's private layer** (learnings, project memory, `agent.md`); it is never shared and works the same for every agent. `<skills-dir>` is the agent's user skills folder and `<project-skills-dir>` its project skills folder (e.g. `~/.claude/skills` and `.claude/skills` for Claude Code); `~/.supply-chain/agent.md` records which ones apply on this machine.

## 1. Triage

| Level | Name | Examples | Mandatory |
|---|---|---|---|
| L0 | Trivial | a color, a text, a typo, one CSS value | Nothing. Do it directly. No department. |
| Q | Question | explain, where is, how does | Answer. `library-docs` if library behavior matters. |
| L1 | Localized | bug in one known file, small addition in 1–2 files | Entry (short) · department Quick ref · Exit gates without build |
| L2 | Feature | new screen, endpoint, component tree, integration, bug touching >2 files | Full Entry · full department rules · department skills · Exit with build + review |
| L3 | Architectural | refactor, migration, new module, cross-cutting change, new project | L2 + `sc-architecture` + plan before coding (Plan agent or plan mode) + ADR |

Escalate as soon as the scope grows. Never de-escalate to skip rules.

## 2. Departments

| Skill | Owns | Typical requests |
|---|---|---|
| `sc-product` | requirements, scope, acceptance criteria, breakdown | "quiero un feature de…", user stories, plan |
| `sc-architecture` | structure, layers, boundaries, patterns, ADRs | refactor, new module, "dónde va esto" |
| `sc-frontend` | UI code in any framework: components, screens, state, rendering | modal, pantalla, formulario, componente, SSR |
| `sc-ux-ui` | visual design, accessibility, motion, design system | animación, accesibilidad, jerarquía visual, tokens |
| `sc-backend` | APIs, services, jobs, realtime, integrations | endpoint, webhook, job, canal, servicio |
| `sc-data` | schema, migrations, queries, caching, client state | migración, tabla, consulta, cache, store |
| `sc-security` | authn/authz, secrets, OWASP, dependencies | login, permisos, roles, CORS, vulnerabilidad |
| `sc-qa` | tests, verification, review, Definition of Done | test, bug, regresión, cobertura |
| `sc-devops` | build, CI/CD, git, environments, deploy | deploy, pipeline, rama, PR, build |
| `sc-devex` | Claude Code tooling, this supply chain, docs | skill, MCP, CLAUDE.md, documentación |

A task usually has one **owner** department plus 1–2 supporting ones (e.g. "crear un modal de contactos" → owner `sc-frontend`, support `sc-ux-ui`, `sc-qa`). Load the owner skill; read only the Quick ref of supporting ones.

## 3. Entry protocol (every department runs it)

1. **Project memory.** Identify the project root (nearest folder with a manifest: `package.json`, `Gemfile`, `pyproject.toml`, `go.mod`, `pom.xml`, `*.csproj`, `Cargo.toml`, `composer.json`, `pubspec.yaml`). Read `~/.supply-chain/projects/<project-slug>.md`. If it does not exist, read `~/.supply-chain/profile.md` (the user's defaults), run §6 and create the memory from `templates/project-memory.template.md`. If the memory exists but has no *Project map*, run the minimal project scan of §6 once and add it. Any private-layer file missing (`profile.md`, `preferences.md`, `subagents.md`, `projects.md`, `agent.md`) → create it from `templates/private-layer/` without asking.
2. **Stack profile.** Read `stacks/<stack>.md` (L1: *Commands* + your department's section; L2+: full). Unknown stack → `stacks/generic.md`.
3. **Architecture profile** (L2+). Read `architectures/<architecture>.md`. Unknown → ask once, record the answer in project memory.
4. **Learnings.** Read `~/.supply-chain/learnings/<department>.md` if it exists.
5. **Tools.** Read `skill-registry.md` → your department section. Pick the skills/MCP whose *When* matches the task and whose *Level* ≤ current level. Missing provider → §5.
6. **Brief.** Print before the first edit:

```
Supply chain → L2 · sc-frontend (+ sc-ux-ui, sc-qa) · stack angular · arch screaming
Qué: modal de confirmación para eliminar contacto
Para qué / quién: evitar borrados accidentales del agente
Dónde: features/contacts/components/delete-contact-dialog/ (scope rule: un solo feature)
Cómo: procedure "New component" · skills: ui-build → browser-verify · docs: library-docs → angular-cli (Angular CDK dialog), primeng (Dialog)
```

## 4. Exit protocol (Definition of Done)

1. **Quality gates** — run them yourself with the commands from project memory (or the stack profile): typecheck · lint (changed files) · tests (related at L1/L2, full at L3) · build (L2+). Report real output. If a failure is pre-existing, prove it (`git stash` → rerun → `git stash pop`) and say so. Never claim done with red gates.
2. **Architecture conformance** (L2+) — run the *Conformance checklist* of the architecture profile against the changed files. Report ✔/✘ with `file:line`.
3. **Review** (L2+) — `code-review` skill on the diff. L3 — also `simplify` and, if security-relevant, `security-review`.
4. **Department DoD** — tick the department's Definition of Done.
5. **Learn** — §7.
6. **Closing report**:

```
## Cierre
- Nivel / departamentos · Skills usadas (omitidas y por qué) · MCP consultados
- Gates: typecheck ✔ · lint ✔ · test ✔ · build ✔
- Arquitectura (<name>): ✔ / ✘ file:line
- Aprendizajes guardados: <file> · Skill de proyecto: creada / propuesta / no aplica
```

## 5. Missing skills — autocompletion

When a capability's provider is marked `missing` in `skill-registry.md`, or is not in the session's skill list:

1. Tell the user in one line: *"Para `<capability>` el registro recomienda `<skill>` (`<source>`). ¿La instalo?"*
2. On yes: `npx skills add <source>` (the skills CLI; run `npx skills --help` if the syntax differs), then `node scripts/sync.mjs --vendor <name>` to make it owned (§8) and continue. Never install without an explicit yes.
3. No known provider: search with the `SearchSkills` / `SuggestSkills` tools if the session has them, else `npx skills find <keywords>`. Propose at most 3 options.
4. Nothing suitable, and the need is specific to this project → generate a project skill (§7.3). Otherwise do the work manually and note it in the closing report.

## 6. Project detection (first time in a project or new project from scratch)

| Signal | Stack |
|---|---|
| `package.json` with `@angular/core` / `@nestjs/core` / `next` or `react` / other | angular / nestjs / react / node |
| `Gemfile` with `rails` | rails |
| `pyproject.toml`, `requirements.txt` | python |
| `go.mod` · `pom.xml`/`build.gradle` · `*.csproj` | go · java · dotnet |
| nothing known | generic |

| Folder signal | Architecture |
|---|---|
| `src/app/features/` or `src/features/` | screaming |
| ≥4 of `app, pages, widgets, features, entities, shared` | feature-sliced |
| `domain/` + `adapters/` or `ports/` | hexagonal |
| `domain/` + `application/` + `infrastructure/` | clean |
| `modules/<a>/`, `modules/<b>/` with public index, or `packs/` | modular-monolith |
| `controllers/` + `services/` or Rails `app/models` + `app/controllers` | layered |

Signals only say *which* technology it is, not *how this project is built*. Before writing the memory, run a **minimal project scan** (read-only, bounded: config files plus at most ~5 source files):

1. **Config:** manifest, compiler/tsconfig, lint and format config, test config, path aliases, env example (never real secrets).
2. **Structure:** list folders 2–3 levels deep from the source root; confirm or correct the architecture guessed above.
3. **Reference examples:** read 1–2 existing files of the same kind as the current task (a component, an endpoint, a migration, a test) to learn naming, file layout, state and error-handling patterns.
4. **Reusables:** locate shared components, design tokens/theme, base services, helpers and utilities the task should reuse instead of recreating.
5. **Record** it in project memory → *Identity*, *Project map* and *Conventions specific to this project*. Later tasks read the map instead of rescanning; extend it when a task explores a new area.

Then verify the gate commands once (run each, keep the ones that work) and write the project memory file. Then keep the private layer current: add the project's row to `~/.supply-chain/projects.md`, and add any stack, package manager or architecture not yet listed to `~/.supply-chain/profile.md`. **New project from scratch**: run `sc-product` (scope) → `sc-architecture` (choose architecture, write ADR) → owner department, and create the project memory at the end of the first session.

## 7. Learning loop (per user, grows with every task)

After each L1+ task, collect what was **non-obvious and new**: something you had to discover, a correction from the user, a command or flag that was needed, a library quirk, a mistake you made. Discard anything already stated anywhere in the supply chain.

**1. Novelty check (mandatory before writing anything).** Grep the candidate concept in: the department `SKILL.md`, the stack profile, the tool skill, the project memory and the learnings file. Already covered → write nothing. Covered but wrong or outdated → fix it in place and say so.

**2. Place it where it belongs** (exactly one destination):

| The lesson is about… | Write it to |
|---|---|
| this project only (paths, conventions, gotchas, commands) | `~/.supply-chain/projects/<slug>.md` |
| a stack/framework, valid in any project of that stack | `stacks/<stack>.md` → matching *Conventions* section |
| how to use a tool skill (ui-build, ui-refine, …) | that skill's `## Learned notes` |
| a general rule of the department, valid in any stack | the department's `## Learned rules` |
| how the user wants answers or code delivered (a correction) | `~/.supply-chain/preferences.md` → *Learned preferences* |
| searching or delegating to subagents | `~/.supply-chain/subagents.md` → *Learned rules* |
| not sure yet / seen once | `~/.supply-chain/learnings/sc-<dept>.md` (staging) |

Format: `- [YYYY-MM-DD] <lesson> — <why> (source: <project>)`.

**3. Promotion.** A staged learning seen a second time (any project) is promoted to its final destination from the table and removed from staging. A user correction is promoted immediately.

**4. Consolidation (the skills evolve).** When a `## Learned notes` / `## Learned rules` list passes ~10 items, fold them into the body of the skill (the Procedure, Rules or Anti-patterns they refine), keep the meaning, and clear the list. Report it in the closing report.

**5. Project skills.** When the same project-specific procedure has been done twice (project memory → *Repeated procedures*), or the user asks, generate a skill **inside the project**: `<project>/<project-skills-dir>/<slug>-<topic>/SKILL.md` from `templates/project-skill.template.md`, with the trigger phrases the user actually used. Register it in project memory and run `node scripts/sync.mjs`. Ask before writing into the repository; offer `.gitignore` if it should not be committed.

**6.** If an `engram` (or other memory) MCP is available, also `mem_save` architecture decisions and bug root causes.

Mention in the closing report every file written by this loop.

## 8. Maintenance

- **Own tool skills.** `ui-build`, `ui-refine`, `ui-system`, `ui-audit`, `browser-verify` and `library-docs` are original skills of this supply chain (`"owned": true`). They evolve only through §7: their `patterns/`, `rules/`, `facts/` folders and `## Learned notes`. External skills vendored later keep provenance in `NOTICE.md` (`vendoredFrom`, `upstreamHash`).
- **New external skill.** After the user approves and installs one (§5), make it owned so everything stays in `<skills-dir>` and is portable: `node scripts/sync.mjs --vendor <name>` (replaces a link with a real copy, marks it owned, adds NOTICE and the precondition), then fix its department in `skill-map.json` if it was auto-assigned.
- `node scripts/sync.mjs` — re-indexes skills and MCP servers into `skill-registry.md`, auto-assigns new skills, ensures preconditions, `Learned` sections and NOTICE files. Idempotent; `--dry-run` and `--unpatch` available.
- New stack / architecture / department → copy the matching file in `templates/`.
- Installed as a plugin, skill names are prefixed: `supply-chain:sc-frontend`. Use whichever form the session lists.
