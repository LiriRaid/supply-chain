# Project detection and minimal scan

Part of the `supply-chain` core skill. Paths are relative to the core skill folder (`<skills-dir>/supply-chain/`). Read only when the instructions file or a department points here.

Run the first time the supply chain works in a project, for a new project from scratch, or when the project memory has no *Project map*.

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
