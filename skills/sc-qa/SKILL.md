---
name: sc-qa
description: "Supply chain · Quality Assurance & Testing department. Use FIRST, before browser-verify or code-review, for tests, verification and the Definition of Done in any stack: \"escribe tests\", \"agrega pruebas\", \"hay un bug\", \"no funciona\", \"regresión\", \"cobertura\", \"revisa mi código\", \"verifica que funcione\", unit, integration, e2e, TDD, code review. Also the supporting department that closes every L1+ task (Exit protocol). Loads the QA rules and decides which skills and MCP servers to use."
---

# Quality Assurance & Testing

## Quick ref
**Mission:** Prove every change works, keeps working and meets the Definition of Done before anyone says "done".
**Must:** failing test before the fix or feature (TDD) · every bug fix ships a regression test · gates run by you, green or failure proven pre-existing · UI changes verified in a real browser · `code-review` on the diff at L2+
**Skills by default:** `browser-verify` · `run` · `code-review` · `simplify` (L3) · `library-docs`
**DoD:** gates green, tests cover the change, behavior observed running, diff reviewed, report honest about anything not verified.

## Entry
Run the *Supply chain protocol → Entry* from the instructions file (already in context; do not load the `supply-chain` skill for it). Department-specific reads:
- Learnings: `~/.supply-chain/learnings/sc-qa.md` if it exists.
- Stack profile: *Commands* + *Testing*.
- Tools: the **Tools** table below. Open `../supply-chain/skill-registry.md` only if a capability there has no installed provider.

## Brief questions
1. **What** behavior is being added, changed or broken? (observed vs expected for bugs)
2. **Why / for whom** does it matter — which user journey or acceptance criterion does it protect?
3. **Where** do the tests live — which pyramid level (unit, integration, e2e) and which files?
4. **How** is it reproduced or exercised — exact steps, inputs, data, viewport?
5. Which **gate commands** apply (from project memory) and are any already red before the change?
6. Is UI affected, so browser verification is required?
7. **What does done look like** — which tests must pass and what must be observed running?

## Scope
- Owns: test strategy and pyramid, TDD, regression tests, running and interpreting quality gates, browser verification, code review of the diff, the quality score, the Definition of Done every department inherits.
- Does not own: what to build → `sc-product` · layer rules → `sc-architecture` · CI pipelines and release → `sc-devops` · security testing depth → `sc-security` · accessibility design decisions → `sc-ux-ui`.

## Procedures
Detailed steps live in `procedures.md` (same folder). **Read only the section you need**: search its heading, read that block, not the whole file. Anti-patterns and references are at the end of that file.

- Test pyramid — choose the level
- New feature or behavior (TDD: red / green / refactor)
- Bug fix
- Run the quality gates yourself
- Browser verification (any UI change)
- Code review (L2+, before done or a PR)
- Quality score (L3 or explicit request only)

## Rules
- **MUST** write or update a test for every behavior change; a bug fix without a regression test is not done.
- **MUST** see a new test fail before making it pass.
- **MUST** run the gates yourself with verified commands and report real output.
- **MUST** verify UI changes in a browser; "tests pass" is not "feature works".
- **MUST** state in the report anything not verified and why.
- **SHOULD** keep tests deterministic: control clock, randomness, network and shared state.
- **SHOULD** test public behavior, not private implementation details.
- **MUST NOT** weaken, skip or delete tests or lint rules to get green.
- **MUST NOT** mock the unit under test or mock so much the test proves nothing.
- **MUST NOT** run the quality score on L0/L1 work unless asked.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| test.browser | `browser-verify` | Any UI change, e2e journeys, visual regressions | L1+ when UI changed |
| app.run | `run` | Reproduce a bug or observe the change running | L2 |
| review.diff | `code-review` | Before done or opening a PR | L2 |
| review.simplify | `simplify` | Clean-up after green, behavior-preserving | L3 |
| ui.audit | `ui-audit` | Significant UI change; WCAG 2.2 AA check | L2 |
| docs.library | `library-docs` (→ angular-cli / primeng / context7 MCP) | Test runner, assertion or mocking API not verified this session | Q |
| search.codebase | `Explore` agent | Finding existing tests, fixtures, helpers across >3 locations | L1 |
| memory | MCP `engram` | `mem_search` bug history; `mem_save` root causes | L1 |
| mutation / load testing | none yet → supply-chain `references/skills.md` | Critical logic or performance budgets | L3 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` (instructions file → Exit; L2+ full: `../supply-chain/references/protocol.md`) (gates, architecture conformance, review, learnings)
- [ ] Every new or changed behavior has a test; bug fixes have a regression test that failed first
- [ ] Edge cases and error paths covered
- [ ] UI verified in the browser (golden path + edge cases, console clean, mobile + desktop)
- [ ] `code-review` findings resolved or justified (L2+)
- [ ] Pre-existing failures proven with `git stash` and quoted
- [ ] Quality score with fixes for areas < 8 (L3 or on request)

## Hand-offs
- To `sc-product`: acceptance criteria missing or ambiguous.
- To `sc-architecture`: a bug or score reveals a structural or boundary problem.
- To `sc-ux-ui`: `ui-audit` finds accessibility or hierarchy issues.
- To `sc-security`: a finding touches auth, input validation, secrets or dependencies.
- To `sc-data`: failures caused by state, caching or persistence design.
- To `sc-devops`: gates pass locally but fail in CI, or build/environment issues.
- To `sc-devex`: a gate command, skill or registry entry misbehaves.

## Learned rules

_Grows with use (supply-chain `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
