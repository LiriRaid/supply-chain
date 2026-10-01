---
name: ui-refine
description: "Supply chain tool skill (ui.refine), owned by sc-ux-ui. Use to improve existing interface through explicit modes: critique, polish, simplify, clarify, harden, adapt, animate, boldify or quieten: \"mejora esta pantalla\", \"se ve feo\", \"pulir detalles\", \"hazlo más limpio\", \"agrega animaciones\", \"transiciones\", \"microinteracciones\", \"no se adapta al móvil\", \"revisa la UX\". Load sc-ux-ui first if it is not loaded. Preserves behavior that was not asked to change. Not for building new UI from scratch (use ui-build)."
---

# UI Refine

> **Precondition.** Tool of `sc-ux-ui` (supporting: `sc-frontend` for implementation). If that department skill is not loaded in this conversation, load it first and use its brief (what, why, where, how) as the input of this skill. Skip only for L0 edits.

## Approach
Refinement works on something that already exists and already has users. It improves one named quality at a time and leaves everything else exactly as it was.
- **Name the mode.** Map the request to one mode (or an explicit short sequence, e.g. critique → polish). "Make it better" without a mode starts with critique.
- **Diagnose before treating.** Look at the running screen, not only the code. Every change answers a concrete finding.
- **Smallest effective change.** Adjust tokens, spacing, hierarchy and states before restructuring. Rewrites are a hand-off to `ui-build`, not a refinement.
- **The system is the reference.** Fixes use existing tokens and components; a missing token is a proposal, not an inline value.
- Questions before acting: what exactly feels wrong, to whom, on which device? What must not change? How will I show before and after?

### Preserve first (every edit mode)
Before the first edit, write a short **keep list** for the target: hover, focus and active states; existing animations and transitions (timing included); keyboard behavior and shortcuts; inputs/outputs/props and events; responsive behavior per breakpoint; copy that was not in scope. Anything on the keep list changes only if the user asked for it. After editing, re-check each item and report it. When a requested change forces a keep-list item to change, stop and ask.

## Inputs
| Input | Source |
|---|---|
| Brief | the `sc-ux-ui` brief (what is wrong today, for whom) |
| Stack conventions | `../supply-chain/stacks/<stack>.md` → *Frontend* (styling, motion library, SSR guards) |
| Project context | `~/.supply-chain/projects/<slug>.md` → `## Design system`, *Conventions*, UI language |
| Current state | screenshot(s) via `browser-verify` or `run`, plus the component files |
| Detail references | `references/` in this skill (load only for the active mode) |
| Known patterns | `patterns/` in this skill (generic) + project skills (project-specific) |

## Modes

### critique
- **When:** "revisa la UX", "qué le falta", "se ve feo" with no concrete target, or before any larger refinement.
- **Steps:** 1. Capture the screen in its main states and the narrowest viewport. 2. Score the dimensions in `references/critique-rubric.md`. 3. List findings with severity, evidence (`file:line` or screenshot region) and the mode that fixes each. 4. Note what works and must be kept.
- **Output:** score table, top 3–5 prioritized findings, recommended mode sequence. **No edits.**

### polish
- **When:** the screen works but feels unfinished: misaligned edges, uneven gaps, inconsistent radii, missing states.
- **Steps:** 1. Keep list. 2. Align to one grid; snap spacing, radius, type and color to existing tokens. 3. Make repeated elements consistent (same component, same variant). 4. Fill missing interaction states (hover, focus-visible, active, disabled) only where absent. 5. Check icon sizes, optical alignment, truncation, both themes.
- **Output:** list of detail fixes, before/after capture, keep-list check.

### simplify
- **When:** "hazlo más limpio", too many elements, competing emphasis, high cognitive load.
- **Steps:** 1. Keep list. 2. Identify the primary task and action; rank every element against it. 3. Remove, merge or defer (progressive disclosure, overflow menu) what does not serve it; never remove a feature, only its prominence, unless asked. 4. Reduce containers, borders and colors that add no meaning. 5. Confirm one primary action per section.
- **Output:** what was removed, merged or deferred and why; before/after.

### clarify
- **When:** confusing labels, vague buttons, generic errors, empty screens with no guidance.
- **Steps:** 1. Inventory all visible copy, including placeholders, tooltips, empty and error states. 2. Rewrite in the project's UI language: verbs that name the outcome, user vocabulary, consistent terms. 3. Errors state what happened and how to fix it; empty states explain and offer the next action. 4. Keep strings in the project's i18n mechanism if one exists.
- **Output:** old → new copy table, files changed.

### harden
- **When:** the screen breaks with real data or real conditions.
- **Steps:** 1. Keep list. 2. Run the checklist in `references/harden-checklist.md` (long and missing text, i18n expansion and RTL, numbers and dates, loading/slow network, errors, offline, permissions, large lists, double submit). 3. Fix each failure with the smallest change; add a test for logic-level fixes.
- **Output:** checklist with pass/fixed/open per item.

### adapt
- **When:** "no se adapta al móvil", a new viewport, device, input mode or context (print, embedded, kiosk, touch).
- **Steps:** 1. Keep list per existing breakpoint. 2. Capture the target context. 3. Prefer fluid fixes (wrapping, `minmax`, `clamp`, intrinsic sizing, container queries) before new breakpoints. 4. Adjust targets (44/48 px on touch), navigation pattern and density for the context; hover-only affordances need a tap/focus equivalent. 5. Verify reflow at 320 CSS px and 200% zoom.
- **Output:** contexts verified, changes per context, captures.

### animate
- **When:** "agrega animaciones", "transiciones", "microinteracciones", or a state change that is hard to follow.
- **Steps:** 1. Keep list, including existing motion. 2. Name the purpose of each animation: feedback, orientation, continuity or emphasis; drop any without one. 3. Pick duration and easing from `references/motion.md`; exits faster than entrances. 4. Animate `transform` and `opacity`; avoid layout properties; no `will-change` left on permanently. 5. Provide a `prefers-reduced-motion` variant (none or a short fade). 6. Encapsulate per the stack adapter and clean up timelines, observers and listeners on destroy. 7. Check for jank on a throttled CPU and that no content is hidden if JS or the animation fails.
- **Output:** motion spec (element, trigger, purpose, duration, easing, reduced variant), files changed.

### boldify / quieten
- **When:** the design reads as bland and forgettable (boldify) or loud, busy and tiring (quieten).
- **Steps:** 1. Keep list. 2. Pick the levers: type scale contrast, weight, color saturation and coverage, whitespace, elevation, imagery, motion amplitude. 3. Boldify: strengthen one focal point and the scale contrast; let one color carry more surface. Quieten: lower saturation and accent coverage, flatten elevation, unify weights, slow or remove decorative motion. 4. Stay inside the project's `## Design system` direction; a change of direction goes back to `sc-ux-ui`. 5. Recheck contrast in every theme.
- **Output:** levers changed with before/after values, captures.

## Stack adapters
| Stack | Notes |
|---|---|
| CSS / Tailwind | Tokens as CSS custom properties or Tailwind `@theme`; motion tokens for durations and easings. Use `motion-safe:` / `motion-reduce:` variants or a `@media (prefers-reduced-motion: reduce)` block. Container queries for component-level adapt. |
| Angular | Prefer CSS transitions and `animate.enter` / `animate.leave` (v20.2+) for simple enter/leave; the legacy animations package only where already used. GSAP: timelines live in a feature service, created in `afterNextRender`, killed via `DestroyRef.onDestroy` (`ctx.revert()` with `gsap.context`), behind SSR guards, gated by `matchMedia('(prefers-reduced-motion: reduce)')`. PrimeNG: restyle through the preset and pass-through, not by overriding internals. |
| React | CSS transitions first; Motion (framer-motion) when the project has it: `AnimatePresence` for exits, `useReducedMotion` or `MotionConfig reducedMotion="user"`. Effects that start animations must return cleanup. Next.js: animated components are client leaves. |
| Native (generic) | Use the platform animation API (SwiftUI `withAnimation`, Compose `animate*AsState`, Reanimated, Flutter implicit animations); honor the OS reduce-motion setting; respect safe areas and dynamic type in adapt and harden. |

## Output contract
Always return to the department:
1. **Mode(s)** run and the finding each change answers.
2. **Keep list** and its post-change check (each item kept, or changed with user approval).
3. **Files changed** and tokens touched; proposed new tokens listed separately.
4. **Evidence:** before/after captures or a clear description of each, viewports and themes checked.
5. **A11y impact:** contrast, focus, reduced motion, target size.
6. **Open items** for `sc-frontend` (implementation), `sc-product` (scope) or a later mode.

## Pattern library (grows with use)
- Before building, list `patterns/` and read the matching file, if any.
- After building something reusable that has no pattern yet (a modal, a data table, a stepper…), write `patterns/<pattern>.md` from `../supply-chain/templates/pattern.template.md`: stack-agnostic intent, anatomy, states, a11y, pitfalls, and one short adapter per stack it was built in. Project-specific details go to project memory, not here.
- Update an existing pattern only with new, verified information (novelty check, supply-chain `references/learning.md`).
- For this skill, patterns are refinement recipes as well as components (e.g. `staggered-list-entrance.md`, `skeleton-to-content.md`).

## Learned notes
_Grows with use (supply-chain `references/learning.md`). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._
