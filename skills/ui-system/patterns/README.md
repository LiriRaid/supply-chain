# ui-system pattern library

This folder holds **system-level** patterns: reusable decisions about tokens, theming and visual structure that recur across projects. It starts empty on purpose and grows only from real work (supply-chain `references/learning.md`).

## What belongs here
- Theming mechanics: theme switch with persisted preference, applying the theme before first paint, high-contrast variant.
- Role sets: status colors with backgrounds and text, chart series palettes, selection and focus styling.
- Scales applied to a context: dense data-table metrics, KPI tile row, form density variants.
- Token architecture: primitive → semantic → component layering for a given component library.

## What does not belong here
- A specific component's build (modal, stepper, table markup) → `ui-build` patterns.
- Refinement recipes (polish, simplify) → `ui-refine`.
- Anything true for one project only (its hue, its file paths) → project memory `## Design system`.

## How to add one
1. Novelty check: list this folder and grep for the concept; extend an existing file rather than duplicating it.
2. Copy `../../supply-chain/templates/pattern.template.md` to `patterns/<kebab-name>.md`.
3. Fill intent, anatomy (which tokens and roles), states (light, dark, hover, focus, disabled), accessibility (contrast pairs and thresholds), pitfalls, and one adapter per stack where it was actually built (Tailwind 4, PrimeNG preset, CSS variables…).
4. Write only verified information: the contrast was measured, the code ran.
5. Mention the new file in the closing report.

## Index
_Add one line per pattern: `- <file> — <one-line intent> (stacks: …)`._
