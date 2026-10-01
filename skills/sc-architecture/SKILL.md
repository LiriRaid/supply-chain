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
Run the *Supply chain protocol → Entry* from the instructions file (already in context; do not load the `supply-chain` skill for it). Department-specific reads:
- Learnings: `~/.supply-chain/learnings/sc-architecture.md` if it exists.
- Stack profile: L1 *Commands*. Architecture profile: L1 *Quick ref* + *Placement rules*, L2+ full. Also existing ADRs (`docs/adr/` or equivalent).
- Tools: the **Tools** table below. Open `../supply-chain/skill-registry.md` only if a capability there has no installed provider.

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

## Procedures
Detailed steps live in `procedures.md` (same folder). **Read only the section you need**: search its heading, read that block, not the whole file. Anti-patterns and references are at the end of that file.

- Identify the architecture (always first)
- Place new code (L1/L2)
- Refactor (L2/L3)
- Migration, new module or new project (L3)
- Review for conformance
- Architecture Decision Record (L3)

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
| `framework.cli` | `angular-cli` MCP (stack angular); other stacks: none yet → supply-chain `references/skills.md` | Generators, migrations, project structure | L1 |
| `review.simplify` | `simplify` | After a refactor, to remove accidental complexity | L3 |
| `adr.tooling` | none yet → supply-chain `references/skills.md` | ADR scaffolding or architecture lint | — |

## Definition of Done
- [ ] Exit protocol of `supply-chain` (instructions file → Exit; L2+ full: `../supply-chain/references/protocol.md`) (gates, architecture conformance, review, learnings)
- [ ] Architecture identified and named in the brief; recorded in project memory
- [ ] New code placed per *Placement rules*; imports respect *Dependency rules*
- [ ] Conformance checklist reported ✔/✘ with file:line for any failure
- [ ] Public contracts unchanged, or changes documented with migration notes
- [ ] ADR written and linked (L3)
- [ ] Decision saved (engram and project memory) at L3

## Hand-offs
- To `sc-product`: the requirement is ambiguous or the scope must change to fit the architecture.
- To `sc-frontend` / `sc-backend`: implementation inside the agreed boundaries.
- To `sc-data`: entity ownership, schema boundaries, state stores, caching layers.
- To `sc-security`: trust boundaries, auth placement, secret handling.
- To `sc-devops`: deployment topology, rendering mode, build splitting.
- To `sc-qa`: characterization tests before refactors; architecture lint rules.
- To `sc-devex`: new architecture profiles, ADR tooling.

## Learned rules

_Grows with use (supply-chain `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
