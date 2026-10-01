---
name: ui-system
description: "Supply chain tool skill (ui.system), owned by sc-ux-ui. Use for design systems and visual identity in any stack: \"paleta de colores\", \"tipografía\", \"design tokens\", \"tema oscuro\", \"sistema de diseño\", \"jerarquía visual\", \"hazlo más profesional\", \"qué estilo le queda\", \"qué gráfica uso\", palette, font pairing, spacing scale, theming, dashboards and landing direction. Load sc-ux-ui first if it is not loaded. Discovers and records the project's existing system before proposing anything new. Not for building a specific component (use ui-build)."
---

# UI System

> **Precondition.** Tool of `sc-ux-ui`. If that department skill is not loaded in this conversation, load it first and use its brief (what, why, where, how) as the input of this skill. Skip only for L0 edits.

## Approach
A design system is derived from a few decisions, not chosen from a catalogue: product, audience, conditions of use and existing code in; tokens in the project's own styling system out.
- **Existing system first.** Discover and record before proposing. Ignoring what shipped creates a second system.
- **Few inputs, many outputs.** One brand hue, one scale ratio and one base unit generate palette, type and spacing.
- **Roles over values.** Components consume semantic roles (`surface`, `text-muted`, `danger`), never raw values or primitive steps.
- **Accessibility constrains generation.** A color pair becomes a token only after its contrast passes in every theme it appears in.
- **Memory is the system's spine.** Every decision lands in project memory (`## Design system`) so the next session extends it.
- Questions before acting: Is there a system already, and where is its source of truth? Who uses it, how long, on which devices? Light, dark or both? Which component library constrains tokens? What brand traits must stay?

## Inputs
| Input | Source |
|---|---|
| Brief | the `sc-ux-ui` brief |
| Stack conventions | `../supply-chain/stacks/<stack>.md` → *Frontend* (styling system, component library, SSR) |
| Project context | `~/.supply-chain/projects/<slug>.md` → `## Design system` (this skill's record, shared with ui-build and ui-refine) |
| Methods | `references/`: `palette-method`, `type-scale`, `product-direction`, `chart-choice` (load only what the mode needs) |
| Known patterns | `patterns/` in this skill (generic) + project skills (project-specific) |

## Modes

### discover
- **When:** first UI-system task in a project; record missing or older than the theme files; always before `recommend` or `tokens` on existing code.
- **Steps:**
  1. Find the sources of truth with Glob/Grep: `**/styles.{css,scss}`, `**/globals.css`, `**/*theme*.{ts,js,css,scss,json}`, `**/*tokens*.{json,ts,css}`, `tailwind.config.*`, files containing `@theme`, `definePreset`, `createTheme`, `:root {`. Skip `node_modules` and build output.
  2. Extract: color primitives and roles per theme; fonts and loading; sizes and weights; spacing base and steps; radius; elevation; motion durations and easings; breakpoints; z-index layers; component library and preset; icon set.
  3. Measure real usage with `consistency-check` in count mode (unused tokens and undefined values both matter).
  4. Check contrast of the core pairs (body text, muted text, primary button, borders, focus ring) in every theme with the script in `references/palette-method.md`.
  5. Write or refresh the record below in project memory. List gaps explicitly.
- **Output:** the record, plus a 3–5 line summary of gaps (missing roles, no dark theme, failing pairs, drift count).

Record format (project memory):
```
## Design system
Updated: <YYYY-MM-DD> · Source of truth: <paths> · Library: <name + preset | none>
- Direction: <product type> · <audience> · tone <…> · density <compact|regular|comfortable>
- Color: hue <…> · primitives <where> · roles <surface, surface-raised, text, text-muted, border, primary, on-primary, focus, success, warning, danger, info> · themes <light, dark>
- Type: <families + loading> · base <px> · ratio <…> · steps <…> · weights <…>
- Space: base <4|8> · steps <…> · radius <…> · elevation <…> · motion <durations, easings>
- Contrast: <pair → ratio, per theme; date verified>
- Gaps / drift: <list; consistency-check counts and date>
- Decisions: - [YYYY-MM-DD] <decision> — <why>
```

### recommend
- **When:** greenfield, explicit redesign, "qué estilo le queda", or "hazlo más profesional" when the system itself is the problem rather than one screen (one screen → `ui-refine`).
- **Steps:**
  1. Run `discover` if code exists. Keep what works; every change needs a reason.
  2. Classify product type, audience and context of use with `references/product-direction.md` → direction statement.
  3. Palette with `references/palette-method.md`: hue → scale → tinted neutrals → roles (light, dark) → contrast table.
  4. Type with `references/type-scale.md`: ≤ 2 families, base, ratio by density, line heights, weights.
  5. Spacing on a 4 px base; radius and elevation scales that match the direction.
  6. Present: direction in three lines, token tables, at most two alternatives with their trade-off. Get approval before writing tokens; record it under `Decisions`.
- **Output:** proposal; after approval, the updated record.

### tokens
- **When:** implement an approved system, add a theme ("tema oscuro"), or refactor tokens ("unifica los colores", "design tokens").
- **Steps:**
  1. Confirm the source of truth from the record and the stack adapter below. Never edit generated or vendor files.
  2. Three layers: primitives (scale steps) → semantic roles → component tokens only where a library requires them. Components reference semantic roles only.
  3. Dark theme remaps roles, not primitives (rules in `palette-method.md` §3); never a blind inversion.
  4. Theme switching: one attribute or class on the root, `prefers-color-scheme` as default, applied before first paint (with SSR: cookie or inline bootstrap). Runtime code is handed to `sc-frontend`.
  5. Migrate literals reported by `consistency-check` file by file; visual output stays identical unless change is the goal.
  6. Verify: contrast table for every touched pair and theme; build gate; light and dark screenshots via `test.browser` (`browser-verify`).
- **Output:** files changed, token diff (added / renamed / removed), contrast table.

### chart
- **When:** "qué gráfica uso", dashboards, KPI rows, choosing chart colors.
- **Steps:** 1. Write the data question as one sentence ("how did X change in 12 weeks?"). 2. Choose the form and the color scheme with `references/chart-choice.md`. 3. Assign series colors from the palette roles; marks reach 3:1 against the plot background. 4. Apply the accessibility list of that reference (never color alone, text alternative). 5. If a chart or dataviz skill is available in the session, use it for implementation detail.
- **Output:** chosen form and why, color per series, accessibility notes.

### consistency-check
- **When:** before a tokens refactor, after a large UI change, or "se ve inconsistente". Read-only unless the user asks to fix (then `tokens`).
- **Steps:** 1. Run the searches below (Grep tool, or `rg` via Bash), excluding the token source files. 2. Count per file. 3. Classify each hit: maps to an existing token → replace; near an existing step → snap to it; a real new need → propose a token. 4. Record the counts in `Gaps / drift`.

Ripgrep patterns (`smell — where — pattern`):
```
hex literal        — styles, templates (ignore anchors, ids) — #[0-9a-fA-F]{3,8}\b
function color     — styles, templates                        — \b(rgba?|hsla?|oklch|oklab)\(
magic spacing      — styles                                   — \b(margin|padding|gap|inset|top|right|bottom|left)[a-z-]*:\s*-?\d+px
arbitrary utility  — templates (Tailwind)                     — -\[(#|\d+(\.\d+)?(px|rem)|rgb)
inline style       — templates                                — style="|style=\{\{|\[style\.|\[ngStyle\]
raw type           — styles outside the theme                 — font-size:\s*\d+px|font-family:
ad-hoc depth/shape — styles                                   — box-shadow:\s*-?\d|border-radius:\s*\d+px
magic layer        — everywhere                               — z-index:\s*\d{3,}|z-\[\d+\]
palette bypass     — templates, only if semantic roles exist  — \b(bg|text|border)-(red|blue|green|gray|slate|zinc|neutral)-\d{2,3}\b
```
Globs: styles `*.{css,scss,sass,less}`; templates `*.{html,tsx,jsx,vue,svelte,erb}` plus inline Angular `template:` in `*.ts`.

- **Output:** table `file · smell · count · suggested token`, worst first; before/after totals if fixed.

## Stack adapters
| Stack | Notes |
|---|---|
| Tailwind CSS 4 (any framework) | Tokens in `@theme` inside the main CSS file; semantic roles as CSS variables mapped in `@theme inline`; dark via a custom variant on `[data-theme=dark]` or `.dark`. |
| Angular + PrimeNG | Preset with `definePreset` from `@primeuix/themes`: primitive palette → `semantic.primary`, `semantic.colorScheme.light/dark.surface`; wired in `providePrimeNG`. Check token names with the `primeng` MCP; keep `--p-*` variables and Tailwind roles in sync. |
| React / Next.js | CSS variables in `globals.css` (shadcn/ui uses `--background`, `--foreground`, `--primary`… keep its names); theme class on `<html>` set before hydration. |
| Plain CSS / SCSS, Rails views | Custom properties on `:root` and `[data-theme=dark]`; SCSS maps only generate variables, components read `var(--…)`. Rails: `app/assets/stylesheets` or the tailwindcss-rails entry. |
| Native or other UI toolkits | Map roles onto the toolkit's theme object (color scheme, text theme); see `../supply-chain/stacks/generic.md`. |

## Output contract
Always return: mode(s) run; sources of truth read; files changed; decisions (recorded in project memory: yes/no); contrast table for every touched pair (pair · theme · ratio · pass/fail); drift counts; open risks (failing pairs, unmigrated files, library tokens not covered); hand-offs (`sc-frontend` for runtime theme code, `ui-audit` for a full accessibility pass, `sc-qa` for visual regression).

## Pattern library (grows with use)
- Before building, list `patterns/` and read the matching file, if any. See `patterns/README.md` for what belongs here.
- After building something reusable that has no pattern yet (theme switch, status color set, KPI tile row…), write `patterns/<pattern>.md` from `../supply-chain/templates/pattern.template.md`: stack-agnostic intent, anatomy, states, a11y, pitfalls, and one short adapter per stack it was built in. Project-specific details go to project memory, not here.
- Update an existing pattern only with new, verified information (novelty check, supply-chain §7).

## Learned notes
_Grows with use (supply-chain §7). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._
