# ui-system · mode: discover

Loaded on demand from `../SKILL.md` → *Modes*.

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
