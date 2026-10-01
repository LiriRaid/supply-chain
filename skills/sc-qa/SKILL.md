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
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3) — project memory, stack profile (`../supply-chain/stacks/<stack>.md` → *Commands* and *Testing*), architecture profile (L2+), learnings (`~/.supply-chain/learnings/sc-qa.md`), registry section `## sc-qa` in `../supply-chain/skill-registry.md`, brief.

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

## Procedure

### Test pyramid — choose the level
1. **Unit** (most): pure logic, services, state, mappers. No network, DB or browser.
2. **Integration** (fewer): component + template, endpoint + DB, repository + real store. Test the seam.
3. **End-to-end** (fewest): critical journeys only (login, checkout, main CRUD) with `browser-verify`.
4. Put each assertion at the lowest level that can prove it.

### New feature or behavior (TDD: red / green / refactor)
1. Turn acceptance criteria into test names (one behavior each, Given/When/Then).
2. **Red:** write the smallest failing test. Run it; confirm it fails for the expected reason (assertion, not compile or import error).
3. **Green:** minimum code that makes it pass. No extra branches "for later".
4. **Refactor:** clean names, remove duplication, keep tests green after every step.
5. Repeat per criterion; add edge cases: empty, null, boundaries, error paths, permissions.
6. Run the gates for the level (below).

### Bug fix
1. **Reproduce:** exact steps, input, observed vs expected. UI: reproduce with `run` + `browser-verify`.
2. **Root cause:** hypothesis, confirm with logs, debugger or a minimal test. Do not patch the symptom.
3. **Failing regression test** at the lowest pyramid level. Run it; it MUST fail.
4. **Fix:** smallest change that addresses the root cause. The regression test MUST now pass.
5. **Gates:** run the gates for the level; rerun the original reproduction steps.
6. Structural cause → hand off to `sc-architecture` and note it in the report.

### Run the quality gates yourself
Commands come from project memory → *Quality gates* (`~/.supply-chain/projects/<slug>.md`), else `../supply-chain/stacks/<stack>.md` → *Commands*. Never invent a command; if none is verified, discover it per the stack profile, run it once and record it in project memory.

| Level | Gates |
|---|---|
| L1 | typecheck · lint (changed files) · related tests |
| L2 | L1 + build |
| L3 | typecheck · lint · full test suite · build |

1. Run non-interactively (no watch mode). Read the first error; fix top-down: typecheck → lint → test → build.
2. Erroring file in your diff → it is yours, fix it.
3. Not in your diff → prove it is pre-existing: `git stash --include-untracked` → rerun the exact failing command → `git stash pop`. Fails without your change = pre-existing; quote command and error in the report.
4. Never skip, comment out or loosen a test or lint rule to get green.
5. After 3 honest attempts, stop and report the remaining failures verbatim; do not claim done.

### Browser verification (any UI change)
1. Start the app with `run` (dev command from project memory or the stack profile).
2. With `browser-verify`: golden path, then at least two edge cases (empty, error, long content, slow network).
3. Console and network: no new errors or failed requests.
4. Check narrow (mobile) and wide (desktop) viewports, keyboard navigation and visible focus.
5. Screenshot visual changes and mention them in the report.

### Code review (L2+, before done or a PR)
1. Run `code-review` on the current diff.
2. Verify each finding technically (reproduce or read the code path). Fix real issues; justify rejected ones in one line.
3. L3: `simplify`, applying only behavior-preserving changes. Security-relevant diff → `security-review` via `sc-security`.
4. Human feedback: confirm each point technically before changing code.

### Quality score (L3 or explicit request only)
Define the unit (module, feature, context). Score each area 1–10 against the project's own profiles. For every area < 8 give a fix with `path:line`. ≥ 8 everywhere = healthy · 6–7 = log and schedule · < 6 = fix before merge.

| # | Area | Evaluate |
|---|---|---|
| 1 | Architecture conformance | Checklist of `architectures/<arch>.md` passes; names reveal the domain |
| 2 | Boundaries & dependencies | No forbidden imports; shared code truly shared |
| 3 | Framework best practices | Stack profile idioms; no deprecated APIs |
| 4 | State & data flow | Single source of truth, explicit ownership, no hidden mutation |
| 5 | Clean code | Small units, no dead code, clear names |
| 6 | Maintainability | Single responsibility, low coupling |
| 7 | Type safety | No untyped escapes or needless casts |
| 8 | Testing | Logic, edge cases, regressions covered; low mocking |
| 9 | Styling architecture (UI, else N/A) | Tokens over literals, no specificity hacks |
| 10 | Config & secrets | Injected per environment, nothing hardcoded |
| 11 | Error handling & observability | Handled at boundaries, logged with context |
| 12 | Scalability & performance | No god units, N+1 or unbounded work |
| 13 | Regression risk | Changes isolated, no silent coupling |

Output: table `# · Area · Score · Verdict`, then `Overall: XX/130 (X.X/10)` (exclude N/A and say so), then `Issues to fix (score < 8)` as `[Area] — problem — path:line — fix`.

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
| mutation / load testing | none yet → supply-chain §5 | Critical logic or performance budgets | L3 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] Every new or changed behavior has a test; bug fixes have a regression test that failed first
- [ ] Edge cases and error paths covered
- [ ] UI verified in the browser (golden path + edge cases, console clean, mobile + desktop)
- [ ] `code-review` findings resolved or justified (L2+)
- [ ] Pre-existing failures proven with `git stash` and quoted
- [ ] Quality score with fixes for areas < 8 (L3 or on request)

## Anti-patterns
- Declaring done without running the app or the tests.
- Tests that assert on mocks instead of outcomes.
- Flaky tests "fixed" with retries or sleeps.
- Claiming "pre-existing" without `git stash` proof.
- Using gate commands that were never verified in this project.

## Hand-offs
- To `sc-product`: acceptance criteria missing or ambiguous.
- To `sc-architecture`: a bug or score reveals a structural or boundary problem.
- To `sc-ux-ui`: `ui-audit` finds accessibility or hierarchy issues.
- To `sc-security`: a finding touches auth, input validation, secrets or dependencies.
- To `sc-data`: failures caused by state, caching or persistence design.
- To `sc-devops`: gates pass locally but fail in CI, or build/environment issues.
- To `sc-devex`: a gate command, skill or registry entry misbehaves.

## References
- ISO/IEC/IEEE 29119 (Software testing) · ISO/IEC 25010 (Product quality)
- ISTQB Foundation Level: https://www.istqb.org
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Kent Beck, *Test-Driven Development: By Example*

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
