---
name: sc-ux-ui
description: "Supply chain · UX/UI Design department. Use FIRST, before ui-system, ui-refine or ui-audit, when the task is about how the interface looks, feels or is perceived: \"mejora el diseño\", \"se ve feo\", \"hazlo más profesional\", \"animación\", \"transición\", \"accesibilidad\", \"contraste\", \"jerarquía visual\", \"tipografía\", \"paleta de colores\", \"design tokens\", \"tema oscuro\", motion, WCAG, design system, UX copy, empty and error states. Loads the design rules and decides which skills and MCP servers to use. Not for a single color or text change."
---

# UX/UI Design

## Quick ref
**Mission:** Make interfaces accessible (WCAG 2.2 AA), clear in hierarchy, consistent through tokens, and respectful in motion and copy.
**Must:** WCAG 2.2 AA minimum · visible focus and full keyboard access · reduced-motion respected for every non-essential animation · tokens only, contrast checked in every theme · every state designed (loading, empty, error, success)
**Skills by default:** `ui-system` · `ui-audit` · `ui-refine` · `browser-verify`
**DoD:** Audit passes AA, states and copy complete, tokens consistent, motion reduced-safe, gates green.

## Entry
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3):
- Project memory `~/.supply-chain/projects/<slug>.md` (UI language, theme setup, token source).
- Stack profile `../supply-chain/stacks/<stack>.md` — L1: *Conventions by department → Frontend*; L2+: full.
- Architecture profile `../supply-chain/architectures/<arch>.md` (L2+), the project `CLAUDE.md`, and the token source of truth (stack profile).
- Learnings `~/.supply-chain/learnings/sc-ux-ui.md` if it exists.
- Registry `../supply-chain/skill-registry.md` → `## sc-ux-ui`.
- Print the brief before the first edit.

## Brief questions
The brief must answer:
1. **What** is designed or improved (screen, flow, component, theme, motion, copy)?
2. **Why / for whom** — the user's primary task on this view and the single primary action?
3. **What is wrong today** — the perceived problem in concrete terms (hierarchy, contrast, density, feedback, consistency)?
4. **Where** — which feature/components are affected, and where the token source of truth lives?
5. **States and copy** — loading, empty, error, success, disabled, interaction states, and the microcopy for each, in the project's UI language?
6. **Accessibility and motion** — WCAG criteria at risk, keyboard/focus behavior, reduced-motion variant?
7. **How** — procedure, and which skills/MCP (`ui-system`, `ui-refine`, `ui-audit`, `primeng`, `library-docs`), and what is handed to `sc-frontend`?
8. **Done** when — audit result, themes and viewports checked, evidence captured?

## Scope
- Owns: accessibility requirements, visual hierarchy, layout rhythm, typography, color, design tokens and theming rules, interaction states, motion design, microcopy, information architecture, responsive intent.
- Does not own: component implementation → `sc-frontend` · requirements and priority → `sc-product` · test automation → `sc-qa`.

## Procedure

### New screen or flow (L2)
1. Identify the primary task of the screen and the single primary action; everything else is secondary.
2. Define hierarchy: one dominant heading, grouped content, consistent spacing scale, scannable alignment.
3. Specify states: loading (skeleton for lists/content, spinner only for one-off actions), empty (message + action), error (what happened + how to recover), success (immediate feedback), disabled, hover, focus, active.
4. Specify responsive intent: narrowest viewport first, touch targets, reflow at 320 CSS px without horizontal scroll.
5. Write microcopy (copy rules) in the project's UI language.
6. Pick tokens from the existing system; propose new tokens only when none fits.
7. Invoke `ui-system` for hierarchy and design-system quality; hand implementation to `sc-frontend` (`ui-build`).
8. Run `ui-audit` on the implemented code; fix every AA failure.

### Visual improvement ("se ve feo", "más profesional")
1. Capture the current screen (`browser-verify` screenshot) and name the concrete problems.
2. Fix hierarchy, spacing rhythm and contrast before adding decoration.
3. Invoke `ui-system`; use `ui-refine` for critique and polish. Preserve behavior and interactions.
4. Capture after and compare.

### Accessibility audit
1. Invoke `ui-audit` on the target screens/components.
2. Check manually: keyboard-only pass (tab order, focus visible, no traps except modals), screen reader names/roles, contrast in all themes, zoom to 200%, reflow at 320px, reduced motion.
3. Use `browser-verify` to capture evidence (screenshots, focus order).
4. Report findings by WCAG success criterion, severity and file:line; fix or hand off.

### Theming / tokens change
1. Locate the token source of truth (stack profile); never edit generated or vendor files. PrimeNG themes → `primeng` MCP for token names.
2. Change tokens at the semantic layer (surface, primary, text-muted), not raw palette usages.
3. Validate contrast for every affected pair in light and dark themes.
4. Runtime theming → verify the theme persists and applies before first paint where possible.

### Motion
1. Invoke `ui-refine`.
2. Give each animation a purpose: feedback, orientation or continuity. Remove decorative-only motion from task flows.
3. Provide a reduced-motion variant (no motion or a simple fade) for every non-essential animation.

## Rules

### Accessibility (WCAG 2.2 AA)
- **MUST** meet WCAG 2.2 AA on every user-facing interface.
- **MUST** meet contrast: 4.5:1 normal text, 3:1 large text and UI components/focus indicators, in every theme.
- **MUST** make every interactive element keyboard operable with a visible focus indicator not obscured by sticky content (2.4.11).
- **MUST** keep a logical focus order; dialogs trap focus, restore it to the trigger on close, and close on Escape.
- **MUST** give icon-only controls an accessible name; hide decorative icons from assistive tech.
- **MUST** announce async status (toasts, form errors, results) through live regions with appropriate politeness.
- **MUST** provide targets of at least 24x24 CSS px (2.5.8); 44x44 recommended on touch.
- **MUST** offer a non-drag alternative for drag interactions (2.5.7).
- **MUST** associate visible labels with inputs; errors identify the field and suggest a fix (3.3.1, 3.3.3); no forced re-entry of known data (3.3.7).
- **MUST NOT** convey information by color alone.
- **SHOULD** follow WAI-ARIA APG patterns for composite widgets (tabs, menus, comboboxes, dialogs).

### Hierarchy, layout and tokens
- **MUST** use design tokens for color, spacing, radius, typography, elevation and motion; no hard-coded values.
- **MUST** keep one primary action per view or section.
- **SHOULD** use a consistent spacing and type scale; limit to the steps the system defines.
- **SHOULD** separate primitive and semantic tokens; components consume semantic tokens.
- **SHOULD** prefer skeletons over spinners for content loading.

### Motion
- **MUST** honor `prefers-reduced-motion` (or the platform equivalent) for every non-essential animation and any transition over 300ms.
- **SHOULD** keep hover/press feedback under 200ms and view transitions under 400ms on mobile.
- **SHOULD** use purposeful easing; avoid gratuitous bounce or overshoot in task flows.
- **MUST NOT** autoplay animation with sound, or flash more than 3 times per second.

### Copy
- **MUST** write in the project's configured UI language.
- **MUST** start actions with a verb that names the outcome ("Save changes", "Send message").
- **MUST** make errors say what happened and how to resolve it; never a generic "Something went wrong" alone.
- **SHOULD** keep labels short, consistent and in the user's vocabulary, not the system's.
- **MUST NOT** use modal confirmations for trivial reversible actions; prefer undo.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| `ui.system` | `ui-system` | Hierarchy, design-system quality, palettes, typography, dashboards, landing pages | L2 |
| `ui.audit` | `ui-audit` | Accessibility / UX guideline audit of implemented UI | L2 |
| `ui.refine` | `ui-refine` | Motion design, transitions, micro-interactions, UX critique and polish | L2 |
| `ui.build` | `ui-build` (via `sc-frontend`) | Layout and responsive implementation | L1 |
| `test.browser` | `browser-verify` | Evidence: keyboard pass, screenshots, responsive checks | L2 |
| `ui.library` | `primeng` MCP (PrimeNG); other libraries: `library-docs` | Component a11y and theming tokens | L1 |
| `docs.library` | `library-docs` (→ angular-cli / primeng / context7 MCP) | WCAG, ARIA APG, styling-system docs | Q |
| `contrast.check` | none yet → supply-chain §5 | Automated contrast and color-blindness checks | — |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] `ui-audit` run; no WCAG 2.2 AA failures open
- [ ] Keyboard-only pass and visible focus verified
- [ ] Contrast verified in every theme
- [ ] Loading, empty, error, success, disabled and interaction states specified and implemented
- [ ] Reduced-motion variant for every non-essential animation
- [ ] Copy reviewed: verbs first, actionable errors, consistent terms
- [ ] Tokens only; new tokens added to the source of truth

## Anti-patterns
- Removing focus outlines without a visible replacement.
- Placeholder text used as the only label.
- Hero or above-the-fold icons as raster images when inline vectors improve load.
- Buttons without press feedback.
- Generic errors without recovery information.
- Spinners where a skeleton fits.
- Light text on light backgrounds without a contrast check.
- Motion that ignores reduced-motion preferences.
- Multiple competing primary actions on one view.
- Restyling that silently changes behavior or interactions.

## Hand-offs
- To `sc-frontend`: implementation of specified states, tokens and motion.
- To `sc-product`: flows that change scope or need new requirements.
- To `sc-qa`: automated a11y checks and visual regression baselines.
- To `sc-data`: persistence of user preferences (theme, reduced motion, language).
- To `sc-devex`: design-system documentation and token tooling.

## References
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- ISO 9241-210:2019 — Human-centred design: https://www.iso.org/standard/77520.html
- W3C Design Tokens Community Group format: https://www.designtokens.org
- MDN prefers-reduced-motion: https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion
- Material Design 3: https://m3.material.io
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
