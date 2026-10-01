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
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3):
- Project memory `~/.supply-chain/projects/<slug>.md` (commands, conventions, prior decisions).
- Stack profile `../supply-chain/stacks/<stack>.md` — L1: *Commands*; L2+: full.
- Architecture profile `../supply-chain/architectures/<arch>.md` (L2+) and the project `CLAUDE.md`.
- Learnings `~/.supply-chain/learnings/sc-product.md` if it exists.
- Registry `../supply-chain/skill-registry.md` → `## sc-product`.
- Print the brief before the first edit.

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

## Procedure

### New feature (L2/L3)
1. Search memory (`engram` mem_search) with the feature keywords; reuse prior decisions instead of re-deriving them.
2. Restate the request in one sentence: "As <actor> I want <capability> so that <outcome>".
3. List unknowns. For each, decide: ask the user (see *Ask vs assume*) or assume and record the assumption.
4. Write requirements that meet the 29148 quality attributes: necessary, unambiguous, singular, feasible, verifiable, bounded. One per line, numbered (R1, R2…).
5. Write acceptance criteria per requirement in Given/When/Then. Cover the happy path, at least one error path, and the empty/boundary case.
6. Write the non-functional constraints that apply: performance budget, accessibility (WCAG 2.2 AA for UI), security/privacy, i18n, offline/SSR behavior, supported platforms.
7. Write **Out of scope** explicitly; anything not listed in scope is out.
8. Verify feasibility against the stack: any library or framework API not verified this session → `library-docs`.
9. More than 3 locations to search → `Explore` to find existing code that already covers part of the requirement; prefer extending it.
10. Break down into tasks of one deliverable each, ordered by dependency. Tag each task with its department skill and level.
11. At L3, or when the change touches shared/core layers, hand the breakdown to the `Plan` agent; use plan mode when the user must approve before coding.
12. Map each acceptance criterion to a test (unit, integration or browser) and hand off to `sc-qa`.

### Bug report
1. Capture: expected behavior, actual behavior, reproduction steps, environment, frequency.
2. Write one acceptance criterion that fails today and must pass after the fix (it becomes the regression test).
3. Classify level: one known file → L1; more than 2 files or unknown cause → L2.
4. Hand off root-cause analysis to the owning engineering department.

### Change request on existing behavior
1. Describe current behavior precisely (read the code or launch the app with `run`) before describing the new one.
2. List every consumer affected (screens, endpoints, public APIs, stored data).
3. State whether the change is backward compatible; if not, require a migration or deprecation note.
4. Write criteria for both the new behavior and the preserved behavior.

### Scope triage (request is too large)
1. Split into a minimal vertical slice that delivers value end-to-end, then increments.
2. Propose the slice to the user with what is deferred and why.
3. Do not start increments until the slice is done.

### New project from scratch
1. Run *New feature* for the MVP slice only.
2. Hand off to `sc-architecture` to choose the architecture and write the ADR, then to the owner department.

### Ask vs assume
- **Ask** when the answer changes data shape, public API, security/privacy, cost, irreversible actions, or user-visible behavior with more than one reasonable interpretation.
- **Assume** (and state it in the brief and closing report) when the choice is reversible, local, and follows an existing project convention.
- Batch questions: ask all blocking questions in one message, each with a recommended default.
- Never ask what the codebase, project memory or engram already answers.

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
| `requirements.authoring` | none yet → supply-chain §5 | Story mapping / backlog tooling | — |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] Requirements numbered, singular, verifiable; assumptions listed
- [ ] Acceptance criteria in Given/When/Then cover happy, error and boundary paths
- [ ] Out-of-scope list written
- [ ] Every criterion mapped to a test or a manual verification step
- [ ] Preserved behavior listed for change requests
- [ ] Breakdown tagged with department skill and level
- [ ] Non-obvious scope decisions saved (engram and/or project memory)

## Anti-patterns
- Starting implementation of a creative or open-ended request without a plan.
- Criteria like "works correctly" or "looks good" that cannot be tested.
- Gold-plating: options, settings or abstractions nobody asked for.
- Asking questions the code or project memory already answers.
- Asking one question per message instead of batching.
- Silent assumptions that only surface in the closing report.
- One giant task instead of a sequenced breakdown.

## Hand-offs
- To `sc-architecture`: placement, boundaries, new modules, new projects, or any L3 decision.
- To `sc-ux-ui`: flows, states, copy and visual requirements for UI work.
- To `sc-frontend` / `sc-backend`: implementation of each task.
- To `sc-data`: new entities, schema changes, persistence or caching requirements.
- To `sc-security`: requirements touching auth, permissions, secrets or personal data.
- To `sc-qa`: acceptance criteria to turn into tests.
- To `sc-devops`: release, environment or rendering-mode constraints.

## References
- ISO/IEC/IEEE 29148:2018 — Requirements engineering: https://www.iso.org/standard/72089.html
- SWEBOK v4 — Software Requirements: https://www.computer.org/education/bodies-of-knowledge/software-engineering
- Gherkin reference (Given/When/Then): https://cucumber.io/docs/gherkin/reference/
- INVEST criteria for user stories (Bill Wake)
- PMI Disciplined Agile: https://www.pmi.org/disciplined-agile

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
