---
name: ui-audit
description: "Supply chain tool skill (ui.audit), owned by sc-ux-ui. Use to audit user interface code against accessibility (WCAG 2.2 AA) and interface guidelines: \"revisa la accesibilidad\", \"audita la UI\", \"cumple WCAG\", \"revisa el formulario\", \"problemas de foco o teclado\", \"revisa la UX\", review my UI, check accessibility, audit design. Load sc-ux-ui first if it is not loaded. Reports findings with rule id and file:line before changing anything. Not for redesigning (use ui-refine)."
---

# UI Audit

> **Precondition.** Tool of `sc-ux-ui` (supporting: `sc-qa`, which runs it in the Definition of Done of significant UI changes). If that department skill is not loaded in this conversation, load it first and use its brief (what, why, where, how) as the input of this skill. Skip only for L0 edits.

## Approach
An audit produces evidence, not opinions. Every finding names a rule, a location and a fix; a concern that maps to no rule is a note for `ui-refine`, not a finding.
- **Local, versioned rules.** The rule set lives in `rules/` (no network fetch) and grows from real audits.
- **Report before touching.** `audit` never edits. Only findings the user approved are fixed.
- **Severity decides order.** Critical and serious first; twenty minor findings must not hide one blocker.
- **A search hit is a candidate, not a finding.** Confirm each hit in context: component libraries often supply roles, labels and focus handling that a pattern cannot see.
- **Name the limits.** Static review cannot prove computed contrast, focus order or screen-reader output; list what was not verified.
- Questions before acting: which files or diff? Which template and styling syntax? Which component library and what does it handle? Which themes? Which UI language?

## Inputs
| Input | Source |
|---|---|
| Brief | the `sc-ux-ui` (or `sc-qa`) brief |
| Scope | files or globs given; else the diff (`git diff --name-only HEAD` plus untracked) filtered to templates, components and styles |
| Stack conventions | `../supply-chain/stacks/<stack>.md` → *Frontend* (template syntax, component library) |
| Project context | `~/.supply-chain/projects/<slug>.md` → `## UI audit log`, `## Design system` (token pairs for contrast), UI language |
| Rules | `rules/README.md` (index, check syntax) + the category files it lists |
| Known patterns | `patterns/` of `ui-build` / `ui-system` (expected a11y of known widgets) + project skills |

## Severity
| Severity | Meaning | Gate |
|---|---|---|
| critical | blocks a task for some users: WCAG A failure, keyboard trap, unlabeled control in a key flow | fix before done |
| serious | WCAG AA failure or major friction | fix before done, or the user accepts it with a reason |
| moderate | best-practice gap that degrades the experience | schedule |
| minor | polish and consistency | optional |

Each rule has a default severity. Raise it one level when the issue sits on a primary flow (sign-in, checkout, send, save); lower it only with a stated reason.

## Modes

### audit
- **When:** "audita la UI", "revisa la accesibilidad", "cumple WCAG", "revisa el formulario", before a PR with UI changes, `sc-qa` Definition of Done.
- **Steps:**
  1. Fix the scope. More than ~30 files → ask, or start with the primary flows.
  2. Read `rules/README.md` and pick categories by file type: templates → accessibility, focus-and-keyboard, forms, navigation-and-state, content-and-copy; styles → layout-and-responsive, motion, contrast rules; routes, config, image and font loading → performance.
  3. Automated pass: run each selected rule's **Check** pattern over the scope with Grep (count first, then content with 2–3 lines of context).
  4. Confirm every hit by reading the code; drop false positives (library handles it, element is hidden or decorative). Then do the manual pass for rules marked `manual`.
  5. Contrast: resolve token pairs from `## Design system` or the theme files and measure them per theme with the script in `../ui-system/references/palette-method.md`.
  6. Runtime evidence when the app can run locally and the brief includes it: `browser-verify` for a keyboard-only pass, focus screenshots, 320 px reflow and 200% zoom. Use an axe engine only if the project already has it.
  7. Report, record in project memory, then ask which findings to fix (propose all critical and serious).
- **Output (no edits):**
```
## UI audit — <scope> — <YYYY-MM-DD>
| # | Rule | Severity | File:line | Finding | Fix |
|---|---|---|---|---|---|
| 1 | FORM-01 | critical | src/app/features/auth/login.html:14 | email input labelled only by placeholder | add a visible <label for> bound to the input id |
Totals: critical N · serious N · moderate N · minor N
Clean categories: … · Not verified: … (why)
```

Audit log in project memory (keep only open findings and the last audit line per scope):
```
## UI audit log
- [YYYY-MM-DD] <scope> · c N / s N / m N / n N · open: FORM-01 login.html:14 "placeholder=\"Email\"" · KEY-02 …
```

### fix
- **When:** the user approved findings by number, rule id or severity.
- **Steps:**
  1. Restate the approved list. Nothing else changes; issues noticed on the way become new findings.
  2. Group by file. Apply the rule's **Fix** with existing tokens and components; keep hover, focus, keyboard behavior, animations, inputs and outputs intact.
  3. Structural changes (element swap, focus management, live-region service) follow `sc-frontend` conventions; library components are fixed through their own accessibility API (check props with the library's docs or MCP).
  4. Re-run each fixed rule's Check on the touched files. Run the `sc-qa` gates (typecheck, lint on changed files, related tests); add a test when behavior changed, such as a new keyboard handler.
  5. Update the audit log.
- **Output:** table `# · rule · file:line · fixed | partial | deferred (reason)`, gate output.

### regression
- **When:** after a fix round, before a release, "verifica que sigan corregidos".
- **Steps:**
  1. Load the findings from `## UI audit log` (or the earlier report in this conversation).
  2. Locate each one by file and the recorded snippet, because lines move. Re-run only that rule's check there.
  3. Classify: fixed · still open · regressed (fixed before, back now) · gone (code removed).
  4. Do not hunt for new issues. If something new is obvious, count it and recommend an `audit`.
  5. Remove confirmed-fixed entries from the log; keep the rest.
- **Output:** table `# · rule · location · before · now`.

## Growing the rule set
- A confirmed finding that matches no rule → **novelty check**: grep `rules/` for the concept, its keywords and its WCAG criterion. Covered → reuse that id and, if its pattern missed the case, refine the Check. Not covered → append a rule to the right category file with the next free id and `Added: <YYYY-MM-DD> · source: <project>`; update the count in `rules/README.md`.
- A recurring false positive → tighten that rule's Check and note why.
- Never renumber. Retire a rule with `Retired: <date> — <reason>` so old reports stay readable.
- A category file beyond ~15 rules → split it and update the index.

## Stack adapters
| Stack | Notes |
|---|---|
| Angular | `*.html` and inline `template:`; `[attr.aria-*]`; `routerLinkActive` + `ariaCurrentWhenActive`; CDK a11y (`cdkTrapFocus`, `LiveAnnouncer`). PrimeNG: icon-only `p-button` needs `ariaLabel`; dialogs already trap focus (confirm via the `primeng` MCP). |
| React / Next.js | `htmlFor`, `alt` on `img`/`next/image`; `eslint-plugin-jsx-a11y` output counts as candidates; route changes need focus handling. |
| Vue / Svelte | `@click` / `on:click` handlers; Svelte compiler a11y warnings are candidates. |
| Rails views | `image_tag` without `alt:`, `link_to "#"`, `f.label` for every field; Turbo Frame and Stream updates need focus and live-region checks. |
| Plain HTML / CSS | Patterns apply as written. |

## Output contract
Always return: scope (file count), categories applied, findings table with totals by severity, the not-verified list, files changed (fix mode only), check re-run results, audit log updated (yes/no), rules added or refined, and hand-offs: `ui-system` for system-level token or contrast fixes, `ui-refine` for non-rule UX critique, `sc-frontend` for structural changes, `sc-qa` for automated accessibility tests.

## Pattern library (grows with use)
- Before building, list `patterns/` and read the matching file, if any. In this skill the reusable knowledge is the rule set in `rules/`; widget patterns (dialog, combobox, tabs) live in `ui-build` and are the reference for what a correct widget looks like.
- After building something reusable that has no pattern yet (a modal, a data table, a stepper…), write `patterns/<pattern>.md` from `../supply-chain/templates/pattern.template.md`: stack-agnostic intent, anatomy, states, a11y, pitfalls, and one short adapter per stack it was built in. Project-specific details go to project memory, not here.
- Update an existing pattern only with new, verified information (novelty check, supply-chain `references/learning.md`).

## Learned notes
_Grows with use (supply-chain `references/learning.md`). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._
