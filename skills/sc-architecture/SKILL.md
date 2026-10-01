---
name: sc-architecture
description: "Supply chain · Software Architecture department. Use FIRST for structure and design decisions in any stack or language: \"refactoriza\", \"dónde pongo esto\", \"estructura de carpetas\", \"nuevo módulo\", \"arquitectura hexagonal / clean / screaming\", \"desacoplar\", \"capas\", \"patrón de diseño\", \"migrar de X a Y\", \"proyecto desde cero\", boundaries, dependencies, ADR, SOLID, clean code. Mandatory owner of every L3 task. Loads the architecture rules and decides which skills, agents and MCP servers to use. Not for trivial edits."
---

# Software Architecture & Design

## Quick ref
**Mission:** Keep every change inside the project's declared architecture and apply design principles that keep code changeable.
**Must:** identify the architecture before placing code · follow the architecture profile's dependency rules (a violation is a bug) · cross-module access only through public contracts · plan + ADR for every L3 decision · no speculative abstraction
**Skills by default:** `Explore` · `Plan` · `library-docs` · `engram` · `simplify`
**DoD:** Conformance checklist passed with file:line evidence, ADR written at L3, gates green.

## Entry
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3):
- Project memory `~/.supply-chain/projects/<slug>.md` → declared architecture, prior decisions.
- Stack profile `../supply-chain/stacks/<stack>.md` — L1: *Commands*; L2+: full.
- Architecture profile `../supply-chain/architectures/<arch>.md` — L1: *Quick ref* + *Placement rules*; L2+: full. Also the project `CLAUDE.md` and existing ADRs (`docs/adr/` or equivalent).
- Learnings `~/.supply-chain/learnings/sc-architecture.md` if it exists.
- Registry `../supply-chain/skill-registry.md` → `## sc-architecture`.
- Print the brief before the first edit.

## Brief questions
The brief must answer:
1. **What** structural change or decision is being made (placement, refactor, migration, new module)?
2. **Why** — which force drives it (coupling, growth, testability, a new requirement) and what breaks if nothing changes?
3. **Which architecture** applies (from project memory or detected), with confidence if detected?
4. **Where** does each new or moved piece live per *Placement rules*, and which public contract does it expose or consume?
5. **Which invariants** must hold — current behavior, public APIs, dependency direction?
6. **How** — staged plan, level, and the skills/agents used (`Plan`, `Explore`, `library-docs`, CLI MCP)?
7. **Which decision record** is needed (ADR at L3) and which alternatives were considered?
8. **Done** when — conformance checklist items and gates that prove it?

## Scope
- Owns: architecture identification, module boundaries, layer contracts, placement of new code, dependency direction, design patterns, refactor and migration strategy, ADRs. Mandatory owner of every L3 task.
- Does not own: requirements → `sc-product` · UI composition details → `sc-frontend` · schema and state design → `sc-data` · build/deploy topology → `sc-devops` · threat modeling → `sc-security`.

## Procedure

### Identify the architecture (always first)
1. Read project memory → architecture. If present, load `../supply-chain/architectures/<slug>.md`. Available: `screaming`, `hexagonal`, `clean`, `layered`, `feature-sliced`, `modular-monolith`.
2. If absent, detect it with the folder signals of `supply-chain` §6 and each profile's *Detect* line.
3. Signals mixed or absent → state the best match and its confidence in the brief; ask the user before an L3 change and record the answer in project memory.
4. Search `engram` (mem_search) for prior architecture decisions on this project.

### Place new code (L1/L2)
1. Apply the decision list in the architecture profile → *Placement rules*.
2. Default scope rule: used by one module → stays inside it; used by two or more → promoted to the shared layer; cross-cutting infrastructure → the core/infrastructure layer.
3. Check the import direction against *Dependency rules* before writing the import.
4. Name folders and files after the domain concept, not the technical type, unless the profile says otherwise.
5. Follow the stack's naming and file conventions (stack profile → *Conventions by department*).

### Refactor (L2/L3)
1. Write down current behavior and public API; they are invariants.
2. Ensure tests cover the invariants; if not, add characterization tests first (hand-off to `sc-qa`).
3. Refactor in small steps, each leaving gates green. Separate behavior-preserving commits from behavior changes.
4. Run `simplify` on the result.

### Migration, new module or new project (L3)
1. Produce a staged plan with the `Plan` agent (plan mode if the user must approve).
2. New project: choose the architecture with the user from the available profiles, record it in project memory.
3. Define the module's public contract (exported interface, events, DTOs) before its internals.
4. Prefer strangler-style incremental migration over big-bang rewrites; keep old and new paths working until cut-over.
5. Verify framework/library migration steps with `library-docs`; use the framework CLI MCP when the stack has one.
6. Write an ADR (below) and save the decision (`engram` mem_save and project memory).

### Review for conformance
1. Run every item in the architecture profile → *Conformance checklist* (Grep patterns where given).
2. Report each item as ✔/✘ with file:line for failures.
3. Fix violations using *Common violations → fix* in the profile.

### Architecture Decision Record (L3)
1. Location: `docs/adr/NNNN-<kebab-title>.md` (or the project's ADR folder), numbered sequentially.
2. Sections: **Title** · **Status** (proposed / accepted / superseded by NNNN) · **Context** (forces, constraints, current state) · **Decision** (one paragraph, active voice) · **Alternatives considered** (at least two, with why rejected) · **Consequences** (positive, negative, follow-up work).
3. Keep it under one page. Never edit an accepted ADR; supersede it.
4. Link the ADR in the closing report.

## Rules

### Architecture conformance
- **MUST** identify the architecture before placing or moving code.
- **MUST** follow the dependency rules of the architecture profile; a violation is a bug, not a style choice.
- **MUST** depend on another module only through its public contract (index/export file, interface, port, event).
- **MUST NOT** import between sibling modules/features directly; move the contract to the shared layer or communicate via events/ports.
- **MUST NOT** let inner or core layers depend on outer, UI or feature layers.
- **MUST NOT** introduce a second architectural style into a project without an ADR.

### Design system principles (all architectures)
- **MUST** apply Single Responsibility: one reason to change per module, class or component.
- **MUST** depend on abstractions at boundaries where the architecture defines ports or interfaces; not everywhere.
- **SHOULD** apply Open/Closed through extension points that already exist; do not create new ones speculatively.
- **SHOULD** keep interfaces small and client-specific, and subtypes substitutable.
- **SHOULD** prefer composition over inheritance; apply YAGNI and KISS.
- **SHOULD** apply DRY to knowledge, not coincidental similarity; tolerate duplication until the third occurrence.
- **SHOULD** keep functions short, intention-revealing, without flag arguments or hidden side effects.
- **SHOULD** split files over roughly 300 lines or mixing concerns (presentation, logic, data access).
- **SHOULD** use the framework's recommended dependency injection and lazy-loading/code-splitting at module boundaries (stack profile).
- **SHOULD** keep configuration in the environment (Twelve-Factor).
- **MUST NOT** add abstractions, wrappers or patterns "just in case".
- **MUST NOT** use module systems or patterns the stack profile marks as legacy, unless an ADR justifies it.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| `memory` | `engram` MCP (mem_search / mem_save) | Before deciding: prior decisions. After any decision or ADR: save it | L1 |
| `search.codebase` | `Explore` agent | Mapping imports/consumers across more than 3 locations | L1 |
| `plan.implementation` | `Plan` agent (or plan mode when approval is needed) | Refactors, migrations, new modules, shared/core changes | L3 |
| `docs.library` | `library-docs` (→ angular-cli / primeng / context7 MCP) | Framework patterns, module systems, migration guides not verified this session | Q |
| `framework.cli` | `angular-cli` MCP (stack angular); other stacks: none yet → supply-chain §5 | Generators, migrations, project structure | L1 |
| `review.simplify` | `simplify` | After a refactor, to remove accidental complexity | L3 |
| `adr.tooling` | none yet → supply-chain §5 | ADR scaffolding or architecture lint | — |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] Architecture identified and named in the brief; recorded in project memory
- [ ] New code placed per *Placement rules*; imports respect *Dependency rules*
- [ ] Conformance checklist reported ✔/✘ with file:line for any failure
- [ ] Public contracts unchanged, or changes documented with migration notes
- [ ] ADR written and linked (L3)
- [ ] Decision saved (engram and project memory) at L3

## Anti-patterns
- Cross-module deep imports that bypass the public contract.
- Generic `utils`/`helpers` dumping grounds in the core layer.
- Promoting code to shared when only one module uses it.
- Interfaces with a single implementation and no boundary reason.
- Big-bang rewrites instead of incremental migration.
- Mixing a refactor and a behavior change in the same step.
- Designing against a framework API from memory without `library-docs`.
- God services that orchestrate, render and fetch at once.

## Hand-offs
- To `sc-product`: the requirement is ambiguous or the scope must change to fit the architecture.
- To `sc-frontend` / `sc-backend`: implementation inside the agreed boundaries.
- To `sc-data`: entity ownership, schema boundaries, state stores, caching layers.
- To `sc-security`: trust boundaries, auth placement, secret handling.
- To `sc-devops`: deployment topology, rendering mode, build splitting.
- To `sc-qa`: characterization tests before refactors; architecture lint rules.
- To `sc-devex`: new architecture profiles, ADR tooling.

## References
- ISO/IEC/IEEE 42010:2022 — Architecture description: https://www.iso.org/standard/74393.html
- SWEBOK v4 — Software Design: https://www.computer.org/education/bodies-of-knowledge/software-engineering
- Michael Nygard, "Documenting Architecture Decisions": https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- ADR templates: https://adr.github.io
- The Twelve-Factor App: https://12factor.net
- Martin Fowler, Strangler Fig Application: https://martinfowler.com/bliki/StranglerFigApplication.html

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
