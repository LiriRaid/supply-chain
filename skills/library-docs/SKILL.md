---
name: library-docs
description: "Supply chain tool skill (docs.library), shared by every department. Use before writing or changing code that depends on a library or framework API you have not verified in this session, and for setup, configuration, migration or version questions: \"cómo se usa\", \"cuál es la API de\", \"documentación de\", \"migrar a la versión\", \"configurar\", Angular, PrimeNG, Rails, NestJS, Tailwind, Vitest, GSAP, Supabase or any library. Routes to the angular-cli MCP for Angular, the primeng MCP for PrimeNG and context7 for everything else, using the installed version."
---

# Library Docs

> **Precondition.** Tool of `supply-chain`, shared by every `sc-*` department. If no department skill is loaded in this conversation, load the owner of the task first and use its brief (what, why, where, how) as the input of this skill. Skip for L0 edits and for questions that do not depend on a library's behavior.

## Approach
Training data ages; libraries do not wait. Before code leans on an API, this skill pins down which version the project really runs and asks a source that speaks for that version.
- **Version first, question second.** The installed version decides the answer. A correct answer for the wrong major is a wrong answer.
- **Most authoritative source wins.** A framework's own MCP beats a general docs index; a docs index beats web search; web search beats memory.
- **One concept per question.** Narrow queries return focused, citable snippets; broad ones return noise.
- **Budget the lookups.** At most 3 docs calls per question. If three calls did not settle it, say what is still uncertain instead of guessing.
- **Nothing private leaves the machine.** Queries carry API names and symptoms, never keys, tokens, connection strings, customer data or proprietary code.
- **Remember only what surprised you.** Verified, non-obvious facts are saved per library and version so the next session does not pay for the same lookup.

### When to run
- Before writing or changing code that calls a library API not verified in this session.
- Setup, configuration, CLI flags, migration between versions, deprecations, breaking changes.
- An error message that points at library behavior (wrong signature, removed option, changed default).
- Skip it for general programming questions, business logic and code review that does not hinge on an API.

### Provider routing
Check the session's tool list (or `ToolSearch`) for the exact tool names before calling; servers rename tools between releases. A server listed as failed to connect counts as unavailable.

| Library | First provider | Tools (verify names in session) | Fallback |
|---|---|---|---|
| Angular framework, Angular CLI, `@angular/*` | `angular-cli` MCP | `list_projects` (workspaces and versions), `search_documentation` (official angular.dev, version-aware), `get_best_practices`, `find_examples`, `onpush_zoneless_migration` (migration guidance) | `context7` → official angular.dev |
| PrimeNG, `@primeuix/themes` | `primeng` MCP | `search` (find components/guides), `list`, `get_component` (API: props, events, templates, a11y), `get_example`, `get_guide` (theming, styled/unstyled, pass-through), `get_setup`, `validate_usage` (check a usage against the installed version), `version` | `context7` → primeng.org |
| Everything else: Rails, NestJS, Tailwind, Vitest, GSAP, Supabase, AnyCable, Redis, React, Prisma, any package or gem | `context7` MCP | `resolve-library-id` → `query-docs` | official docs via web fetch/search |
| No docs MCP connected | web | fetch the official docs site or search scoped to it | memory, labelled as unverified |

When the route falls back, say so in one line (for example: "angular-cli MCP not connected; used context7 + angular.dev").

### Guardrails
- **MUST** detect the installed version before the first query.
- **MUST** quote or paraphrase the docs that justify the code, with the version and the source.
- **MUST NOT** send secrets, environment values, personal data or large private code excerpts in a query.
- **MUST NOT** exceed 3 docs calls per question without telling the user why.
- **MUST NOT** present memory as documentation; when unverified, say so.

## Inputs
| Input | Source |
|---|---|
| Brief | the department brief: what code depends on which library API |
| Stack conventions | `../supply-chain/stacks/<stack>.md` → *Tools* (`docs.library` row) and *Official docs* |
| Project context | `~/.supply-chain/projects/<slug>.md` → *Identity* (stack, versions), *Gotchas* |
| Known facts | `facts/<library>.md` in this skill (verified, version-scoped) |

## Modes

### lookup
- **When:** an API, option, signature or behavior must be confirmed before coding.
- **Steps:**
  1. **Detect the version.** Prefer the lockfile's resolved version over the manifest range: `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` (or `<pm> list <pkg> --depth 0`), `Gemfile.lock` (`bundle info <gem>`), `uv.lock` / `poetry.lock` / `requirements*.txt`, `go.mod`, `pom.xml` / `build.gradle`, `*.csproj`, `Cargo.lock`, `composer.lock`. Angular: `list_projects` also reports it.
  2. **Check known facts.** Read `facts/<library>.md` if it exists; a fact whose version range covers the installed version answers the question without a call.
  3. **Route** with the table above.
  4. **Query.** context7: `resolve-library-id` with the library name and the question; pick the official package, prefer an ID that matches the installed major; then `query-docs` with that ID and one precise concept ("signal inputs with transform", not "Angular inputs"). Dedicated MCPs: pass the exact component or topic and the version when the tool accepts it.
  5. **Apply.** Write the code to the documented shape for that version. If the docs contradict the code base, the code base may be on an older pattern: follow the project's version, flag the gap.
  6. **Learn** (see *Fact library*).
- **Output:** the answer, the version it applies to, the source, and the code or configuration that follows from it.

### migrate
- **When:** upgrading a major or minor, removing a deprecation, adopting a new API across the code base.
- **Steps:** 1. Detect current and target versions. 2. Ask the provider for the official migration guide or update path between those versions (Angular: `search_documentation` plus `onpush_zoneless_migration` when relevant; also the official schematics such as `ng update`). 3. List breaking changes that touch code in this project (Grep each removed or renamed symbol). 4. Hand the list to `sc-architecture` for L3 planning; do not start a cross-cutting migration from this skill alone.
- **Output:** version path, breaking changes with affected files, recommended order, commands to run.

### configure
- **When:** setting up or changing a library's configuration, provider wiring, CLI flags or build integration.
- **Steps:** 1. Detect the version and the existing config files. 2. Query only the option being changed. 3. Change the minimum; keep unrelated options as they are. 4. Run the gate that would catch a bad config (build or typecheck).
- **Output:** the config diff, the doc reference and the gate result.

## Stack adapters
| Stack | Notes |
|---|---|
| Angular | `angular-cli` MCP first, also for best practices before generating code. PrimeNG on the project → `primeng` MCP for component props and a11y. Tailwind, GSAP, Vitest, RxJS → `context7`. |
| React / Next.js | `context7`; Next.js answers differ sharply between App Router and Pages Router: state which one the project uses in the query. |
| Rails | `context7` for Rails, gems and AnyCable; the version comes from `Gemfile.lock`. Rails guides are versioned by URL (`guides.rubyonrails.org/v<x.y>/`) for the web fallback. |
| NestJS | `context7`; check the versions of `@nestjs/core` and the adapter (Express or Fastify), since examples differ. |
| Other | `context7`, then the official docs linked from the stack profile. |

## Output contract
Return to the department, in this shape:

```
Docs · <library> <installed version> · provider: <angular-cli | primeng | context7 | web | memory (unverified)>
Answer: <one or two sentences>
Source: <tool + library id or doc page>
Applied to: <file:line or "answer only">
Fact saved: <facts/<library>.md | none (not novel) | proposed for stacks/<stack>.md>
Open risk: <anything still uncertain, or none>
```

## Pattern library (grows with use)
This skill grows facts instead of UI patterns:
- Before querying, read `facts/<library>.md` (format in `facts/README.md`).
- After a lookup confirmed something non-obvious (a renamed option, a changed default, a version-specific signature, a deprecated path that still compiles), run the novelty check (supply-chain `references/learning.md`: grep the fact in this file, the stack profile, project memory and `facts/`). Novel and verified → append it to `facts/<library>.md` with its version range and source.
- If the fact is really a convention of the stack (how the user's projects should use the library), propose it for `../supply-chain/stacks/<stack>.md` → *Conventions* instead of saving it here.
- A newer version that changes a fact → mark the old line as superseded with its version range; never silently rewrite it.

## Learned notes
_Grows with use (supply-chain `references/learning.md`). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._
