---
name: ui-build
description: "Supply chain tool skill (ui.build), owned by sc-frontend. Use when building new user interface in any framework: \"crea un modal\", \"nueva pantalla\", \"construye el componente\", \"arma un dashboard\", \"formulario de registro\", \"landing\", build a component, page, dialog, form or layout with intentional, production-grade design. Load sc-frontend first if it is not loaded. Follows the project's design system; defines a direction only for greenfield projects. Not for restyling or polishing existing UI (use ui-refine)."
---

# UI Build

> **Precondition.** Tool of `sc-frontend`. If that department skill is not loaded in this conversation, load it first and use its brief (what, why, where, how) as the input of this skill. Skip only for L0 edits.

## Approach
New interface is a design decision before it is code. Decide on purpose and character first, then write code that carries that decision into every detail.
- **The existing system wins.** In a project with tokens, a component library or established screens, the "direction" is already chosen: match it so precisely that the new view looks like it was always there. Invention is reserved for greenfield work.
- **Intent over intensity.** A quiet, dense admin view and an expressive landing can both be excellent; what fails is a view with no point of view, assembled from defaults.
- **Generic is a defect.** Interchangeable layouts, a single flat type size, evenly spread color, cards wrapped around everything and decorative effects with no reason all read as "template". Each choice should be explainable by the product, the user or the content.
- **Complete beats pretty.** A view is not built until loading, empty, error, success, disabled and interaction states exist, it reflows on the narrowest screen and it works by keyboard.
- Questions before acting: who uses this and in what situation? What is the one primary action? What already exists that I can reuse? What would make this view clearly belong to this product?

### Design system decision (mini-brief)
Write it before the first file, 4–6 lines, in the brief's language. It adapts to the project's situation.

| Field | Brownfield (system exists) | Greenfield (no system) |
|---|---|---|
| **Purpose** | user task + single primary action | same |
| **Tone** | inherited: name the screens/components it must match | chosen: one concrete adjective pair (e.g. "calm, exact"; "warm, editorial") grounded in a sentence about who uses it and where |
| **Constraints** | tokens, library components, breakpoints, theme modes, SSR, a11y level | framework, performance budget, a11y level, theme modes |
| **Differentiator** | one detail that makes this view excellent inside the system (information density, a clear empty state, a well-paced form) | the one memorable trait of the visual identity (type pairing, color strategy, layout rhythm) |
| **Reuse** | components and patterns reused, new ones justified | primitives to create first (tokens, button, input, surface) |

Brownfield rule: if a field would require a new token, font or component variant, list it as a proposal for `sc-ux-ui` instead of silently adding it.

### Avoid
- Inventing fonts, colors or radii in a project that already has a system.
- Shipping only the happy path; a spinner as the only non-success state.
- A modal where inline or progressive disclosure would serve the task.
- Several competing primary actions on one view.
- New breakpoints to patch a layout that fluid sizing would fix.
- Copying a generic template layout without adapting hierarchy to the content.

## Inputs
| Input | Source |
|---|---|
| Brief | the `sc-frontend` brief (plus `sc-ux-ui` states/specs when present) |
| Stack conventions | `../supply-chain/stacks/<stack>.md` → *Conventions by department → Frontend* |
| Project context | `~/.supply-chain/projects/<slug>.md` → *Identity*, *Conventions*, `## Design system` (create the section if missing) |
| Design system | token source of truth, theme preset, shared/ui components (Grep the shared layer) |
| Known patterns | `patterns/` in this skill (generic) + project skills (project-specific) |

## Modes

### build
- **When:** a new component, dialog, form, screen or dashboard is needed and no equivalent exists.
- **Steps:**
  1. Read the brief and the mini-brief inputs; list `patterns/` and read any match.
  2. Inventory: Grep shared components, tokens and similar screens. Note spacing scale, type steps, radius, elevation and motion tokens in use.
  3. Write the design decision. Brownfield: name the screens it must match. Greenfield: run `greenfield-direction` first.
  4. Sketch structure in text: regions, hierarchy (one dominant element), primary and secondary actions, reading order.
  5. Choose primitives: native elements first, then the component library, then custom markup.
  6. Implement with the stack adapter. Tokens only; no hard-coded color, spacing, radius or duration.
  7. Implement every state: loading (skeleton for content, inline spinner for an action), empty (message + next action), error (cause + recovery), success feedback, disabled, hover, focus-visible, active. Forms add field-level validation, submit pending and server error.
  8. Responsive: build from the narrowest viewport up; prefer fluid grid/flex, `minmax`, `clamp` and container-relative sizing over new breakpoints. Check reflow at 320 CSS px.
  9. Accessibility basics: labelled controls, logical focus order, visible focus, dialogs trap and restore focus and close on Escape, async status in a live region, contrast in every theme, targets at least 24x24 px.
  10. Motion only where it explains a change (open, close, reorder, feedback); respect reduced motion. Elaborate motion belongs to `ui-refine` animate.
  11. Run it (`run` / `browser-verify`): every state, narrow and wide, light and dark, keyboard-only pass.
- **Output:** files created, the design decision, states checklist, screenshots or notes of the checks.

### compose
- **When:** the screen can be assembled mostly from existing components (library or shared layer) with little or no new styling.
- **Steps:**
  1. Map each region of the requested screen to an existing component; list the gaps.
  2. For each gap prefer, in order: a prop/variant of an existing component, composition of two existing ones, a new local component inside the feature. Promote to shared only when a second feature needs it (scope rule).
  3. Lay out with the project's grid and spacing tokens; keep the page rhythm of sibling screens (header pattern, toolbar placement, content width).
  4. Wire data and all states as in build steps 7–9.
  5. Verify visually against one sibling screen side by side.
- **Output:** component map (reused vs new), files created, gaps proposed for the shared layer.

### greenfield-direction
- **When:** no tokens, theme or component library exist yet, or the user explicitly asks for a new visual identity.
- **Steps:**
  1. Write one sentence of context: who uses it, on what device, in what situation and mood. Refine it until it forces decisions (light vs dark, density, pace).
  2. Reject the first obvious answer for the category (the palette or layout anyone would guess from the domain alone); look for a choice that fits this specific product.
  3. Decide and record:
     - **Type:** a display/body pairing (or one family with clear weight contrast), a modular scale with visible contrast between steps, body measure around 60–75 characters.
     - **Color strategy:** neutral-led with one accent, or one dominant brand color, or a small set of named roles. Tint neutrals toward the brand hue; avoid pure black and pure white surfaces. Define semantic roles (surface, text, muted, primary, danger, success) in both themes and check contrast.
     - **Space and shape:** spacing scale, radius set, elevation approach (borders, tints or shadows: pick one as primary).
     - **Motion:** durations for feedback, small transitions and view changes; one easing family that decelerates; no bounce in task flows.
     - **Composition:** grid, content width, how emphasis is created (scale, contrast, whitespace) and what to avoid (nested cards, uniform card grids, decorative blur).
  4. Encode it as tokens in the stack's source of truth before building views.
  5. Write it to project memory under `## Design system` with the date: tone, type, color strategy, scales, motion, anti-choices. Future builds treat it as brownfield.
- **Output:** design direction summary, token file(s), project memory `## Design system` entry.

## Stack adapters
| Stack | Notes |
|---|---|
| Angular | Standalone + OnPush, `input()`/`output()`/`model()`, signals for state, `@if`/`@for (track id)`/`@defer`. Tailwind 4 utilities on `@theme` tokens; PrimeNG components imported individually and themed through the preset (verify props with the `primeng` MCP); Lucide icons from the project's icon provider. Guard browser APIs for SSR. Place per *Architecture fit* (`features/<f>/components/`). |
| React | Function components, derive during render, stable keys. Next.js: Server Component by default, `"use client"` only on the interactive leaf. Use the project's UI kit (shadcn/ui, Radix, MUI) and form library; CSS variables or Tailwind theme for tokens. |
| Vue / Svelte (generic) | Single-file components; props in, events out; `ref`/`computed` or Svelte runes for state. Scoped styles consuming CSS custom properties; keep the library kit (Vuetify, PrimeVue, Skeleton) as the base. |
| Native mobile (generic) | Platform components first (SwiftUI, Jetpack Compose, React Native, Flutter); a theme object holds tokens. Respect safe areas, dynamic type, 44/48 pt targets, platform navigation and back behavior, and the OS reduced-motion setting. |

## Output contract
Always return to the department:
1. **Design decision** (mini-brief) and mode used.
2. **Files** created or changed, with placement rationale.
3. **Reuse map**: components and tokens reused; anything new and why.
4. **States** covered (checklist) and the responsive and theme checks done.
5. **A11y basics** verified (keyboard path, focus, labels, contrast).
6. **Open risks / proposals** for `sc-ux-ui` (new tokens, variants) or `sc-backend` (missing error shapes).

## Pattern library (grows with use)
- Before building, list `patterns/` and read the matching file, if any.
- After building something reusable that has no pattern yet (a modal, a data table, a stepper…), write `patterns/<pattern>.md` from `../supply-chain/templates/pattern.template.md`: stack-agnostic intent, anatomy, states, a11y, pitfalls, and one short adapter per stack it was built in. Project-specific details go to project memory, not here.
- Update an existing pattern only with new, verified information (novelty check, supply-chain §7).

## Learned notes
_Grows with use (supply-chain §7). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._
