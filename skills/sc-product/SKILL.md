---
name: sc-product
description: "Supply chain · Product Management department. Use FIRST when a request is an idea to turn into scoped, testable work, before any implementation department: \"quiero un feature de…\", \"necesito que la app haga…\", \"historia de usuario\", \"criterios de aceptación\", \"alcance\", \"desglosa esto\", \"MVP\", \"roadmap\", \"qué debería incluir\", requirements, user stories, planning, prioritization. Loads the product rules (what, why, for whom, how to verify) and decides which skills and agents to use. Not for trivial edits."
---

# Product Management

## Quick ref
**Mission:** Turn a request into verifiable requirements, acceptance criteria and a scoped breakdown before code is written.
**Must:** Given/When/Then criteria for every L2+ change · ask when ambiguity changes the outcome, assume and state it otherwise · explicit out-of-scope · smallest scope that delivers the value · plan before coding at L3
**Skills by default:** `engram` (mem_search) · `Explore` · `Plan` · `library-docs`
**DoD:** Requirements unambiguous and testable, criteria mapped to tests, scope and out-of-scope written, gates green.

## Entry
Run the *Supply chain protocol → Entry* from the instructions file (already in context; do not load the `supply-chain` skill for it). Department-specific reads:
- Learnings: `~/.supply-chain/learnings/sc-product.md` if it exists.
- Stack profile: L1 *Commands*, L2+ full.
- Tools: the **Tools** table below. Open `../supply-chain/skill-registry.md` only if a capability there has no installed provider.

## Brief questions
The brief must answer:
1. **What** is being delivered, in one sentence (actor, capability, outcome)?
2. **Why / for whom** — which user or role gains what value?
3. **Where** does it land — which feature/module per the architecture, and which departments implement it?
4. **What is out of scope** for this iteration?
5. **Which unknowns** block the outcome (ask) and which are assumed (state them)?
6. **How is it verified** — the acceptance criteria and the test or manual step for each?
7. **How** — procedure from this skill, level, and the skills/agents used (`Explore`, `Plan`, `library-docs`)?
8. **Done** when — the DoD items that apply, including preserved behavior for change requests?

## Scope
- Owns: requirement elicitation, clarification, acceptance criteria, scope and out-of-scope, task breakdown, prioritization, Definition of Done per task.
- Does not own: technical design and placement → `sc-architecture` · UI/visual decisions → `sc-ux-ui` · test implementation → `sc-qa` · delivery pipeline → `sc-devops`.

## Procedures
Detailed steps live in `procedures.md` (same folder). **Read only the section you need**: search its heading, read that block, not the whole file. Anti-patterns and references are at the end of that file.

- New feature (L2/L3)
- Bug report
- Change request on existing behavior
- Scope triage (request is too large)
- New project from scratch
- Ask vs assume

## Rules
- **MUST** have written acceptance criteria in Given/When/Then for every L2+ task before the first edit.
- **MUST** write an explicit out-of-scope list for every L2+ task.
- **MUST** convert relative dates ("next sprint", "tomorrow") to absolute dates when writing plans or saving memory.
- **MUST** use the `Plan` agent or plan mode before coding at L3 and for any change touching shared/core layers.
- **MUST** preserve existing behavior unless the requirement explicitly changes it; list preserved behavior as criteria.
- **MUST** escalate the level as soon as the breakdown exceeds the current level's scope.
- **SHOULD** express requirements in the domain language used by the codebase (entity and feature names).
- **SHOULD** include the non-functional constraints the stack profile flags (rendering mode, platform targets).
- **SHOULD** keep each task independently verifiable and mergeable.
- **MUST NOT** accept ambiguous requirements that change outcomes; ask first.
- **MUST NOT** plan speculative abstractions or features for a hypothetical future.
- **MUST NOT** jump to code when the change touches more than 3 files without a written plan.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| `memory` | `engram` MCP (mem_search / mem_save) | Before eliciting: prior decisions. After a non-obvious scope decision: save it | L1 |
| `search.codebase` | `Explore` agent | Scoping needs more than 3 locations | L1 |
| `plan.implementation` | `Plan` agent (or plan mode when approval is needed) | Multi-layer features, shared/core changes, L3 breakdowns | L3 |
| `docs.library` | `library-docs` (→ angular-cli / primeng / context7 MCP) | Feasibility depends on an unverified library/framework API | Q |
| `app.run` | `run` | Observe current behavior before a change request | L2 |
| `requirements.authoring` | none yet → supply-chain `references/skills.md` | Story mapping / backlog tooling | — |

## Definition of Done
- [ ] Exit protocol of `supply-chain` (instructions file → Exit; L2+ full: `../supply-chain/references/protocol.md`) (gates, architecture conformance, review, learnings)
- [ ] Requirements numbered, singular, verifiable; assumptions listed
- [ ] Acceptance criteria in Given/When/Then cover happy, error and boundary paths
- [ ] Out-of-scope list written
- [ ] Every criterion mapped to a test or a manual verification step
- [ ] Preserved behavior listed for change requests
- [ ] Breakdown tagged with department skill and level
- [ ] Non-obvious scope decisions saved (engram and/or project memory)

## Hand-offs
- To `sc-architecture`: placement, boundaries, new modules, new projects, or any L3 decision.
- To `sc-ux-ui`: flows, states, copy and visual requirements for UI work.
- To `sc-frontend` / `sc-backend`: implementation of each task.
- To `sc-data`: new entities, schema changes, persistence or caching requirements.
- To `sc-security`: requirements touching auth, permissions, secrets or personal data.
- To `sc-qa`: acceptance criteria to turn into tests.
- To `sc-devops`: release, environment or rendering-mode constraints.

## Learned rules

_Grows with use (supply-chain `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
