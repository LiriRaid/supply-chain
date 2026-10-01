---
name: sc-frontend
description: "Supply chain · Frontend Engineering department. Use FIRST, before ui-build, ui-refine, ui-system or any UI tool skill, whenever the user asks to build, change or fix user-interface code in any framework or language: \"quiero crear un modal\", \"nueva pantalla\", \"componente\", \"formulario\", \"tabla\", \"sidebar\", \"layout responsive\", \"estado del componente\", \"SSR\", screen, page, view, component, dialog, form, client routing. Loads the frontend rules (what, why, where, how) and decides which skills and MCP servers to use. Not for trivial edits such as a color, a text or one value."
---

# Frontend Engineering

## Quick ref
**Mission:** Build client-side UI (web or mobile) that is correct, accessible, performant and consistent with the stack's conventions.
**Must:** reactive state primitive and render optimization per stack profile · styling system first, tokens only · guard platform-only APIs when server-rendering · clean up subscriptions, listeners and animations · every UI state (loading, empty, error, success)
**Skills by default:** `ui-build` · `browser-verify` · `run` · `library-docs` (+ `angular-cli`, `primeng` on Angular/PrimeNG projects)
**DoD:** Works in the running app, a11y basics pass, all states handled, tests cover criteria, gates green.

## Entry
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3):
- Project memory `~/.supply-chain/projects/<slug>.md`.
- Stack profile `../supply-chain/stacks/<stack>.md` — L1: *Commands* + *Conventions by department → Frontend*; L2+: full.
- Architecture profile `../supply-chain/architectures/<arch>.md` (L2+), the project `CLAUDE.md`, and the `sc-ux-ui` Quick ref for UI work.
- Learnings `~/.supply-chain/learnings/sc-frontend.md` if it exists.
- Registry `../supply-chain/skill-registry.md` → `## sc-frontend`.
- Print the brief before the first edit.

## Brief questions
The brief must answer:
1. **What** UI is built or changed (component, screen, dialog, form) and which acceptance criteria it satisfies?
2. **Why / for whom** — which user task does it serve?
3. **Where** — which feature owns it (scope rule: one feature → inside it; two or more → shared), exact folder per *Placement rules*, and which existing shared or library component is reused?
4. **Data source** — which service, store or API feeds it, and who owns that contract (`sc-backend`, `sc-data`)?
5. **States** — loading, empty, error, success, disabled, plus hover/focus/active?
6. **Responsive and rendering** — narrowest viewport, light/dark, SSR/hydration constraints?
7. **Accessibility** — keyboard path, focus management, labels, live regions?
8. **How and done** — procedure, skills/MCP (`ui-build`, `ui-refine`, `browser-verify`, `library-docs`, library MCP) and the tests and screen checks that prove it?

## Scope
- Owns: components/views, client state, client routing, rendering mode (CSR/SSR/SSG/hydration), styling implementation, icons, client animations, client-side performance, wiring accessibility semantics.
- Does not own: visual and interaction design decisions → `sc-ux-ui` · API contracts → `sc-backend` · global state, caching and data models → `sc-data` · module placement rules → `sc-architecture` · build/deploy → `sc-devops`.

## Procedure

### New component / screen (L2)
1. Read acceptance criteria (`sc-product`) and UI states/specs (`sc-ux-ui`). Missing at L2+ → write them first.
2. Place files per the architecture profile → *Placement rules*; reuse shared components before creating new ones (Grep the shared layer).
3. Component library in use → check it covers the need first (`primeng` MCP on PrimeNG, else `library-docs`).
4. Verify any framework API not used this session with `library-docs`; use the framework CLI MCP (`angular-cli`) generators when available.
5. Write the test first for the logic and the main criterion (`sc-qa`, stack profile → *Testing*).
6. Implement with the stack's component conventions: typed inputs/outputs, reactive state primitive, optimized change detection, lifecycle cleanup.
7. Invoke `ui-build` for layout, responsive behavior, forms, cards, navigation and visual polish.
8. Implement every state: loading, empty, error, success, disabled; plus hover, focus, active for interactive elements.
9. Add accessibility semantics: native elements first, labels, focus order, keyboard handling (`sc-ux-ui` rules).
10. SSR/SSG enabled → verify server render and hydration without errors; guard browser-only APIs.
11. Launch with `run` and verify the criteria; use `browser-verify` for flows, breakpoints and console errors.
12. Run the Exit protocol gates (commands from project memory).

### Bug fix (L1/L2)
1. Reproduce: in the running app (`run` / `browser-verify`) or with a failing test.
2. Confirm the root cause before editing (render timing, stale state, missing cleanup, hydration mismatch, CSS cascade).
3. Write a regression test that fails.
4. Apply the smallest fix in the owning component; preserve inputs, outputs, styles and interactions.
5. Re-run the test, the gates and a manual check of the affected screen.

### Styling / restyle (L1/L2)
1. Use the project's styling system and existing tokens/utilities; search for an existing token before adding one.
2. Prefer fluid layout (flex/grid, relative units, intrinsic sizing) over new breakpoints.
3. New tokens go in the project's token source of truth (stack profile), never inline.
4. Check light and dark themes and the narrowest supported viewport.
5. Invoke `ui-build` at L2; `ui-system` when premium polish or hierarchy is requested.

### Animation / motion
1. Invoke `ui-refine`.
2. Animate compositor-friendly properties (transform, opacity) unless justified.
3. Encapsulate animation logic per the stack profile (service, composable, controller) and clean it up on destroy/unmount.
4. Respect reduced-motion preferences (`sc-ux-ui` motion rules).

### Performance pass
1. Measure first (Lighthouse/Web Vitals, framework profiler, or mobile equivalent).
2. Apply: lazy-load routes and heavy blocks, defer non-critical rendering, virtualize long lists, memoized derived state, tree-shakeable imports, optimized images.
3. Re-measure and report before/after.

## Rules

### Components and state
- **MUST** follow the stack's component model; no legacy module systems the stack profile marks as deprecated.
- **MUST** use the framework's recommended reactive state primitive for local state; streams only for event sequences.
- **MUST** use the framework's change-detection or render optimization by default.
- **MUST** update state immutably or through the primitive's setter API; never mutate shared state in place.
- **MUST** clean up subscriptions, timers, listeners, observers and animations on destroy/unmount.
- **MUST** provide stable keys/tracking for every rendered list.
- **SHOULD** keep components presentational; move data access and orchestration to services/stores per the architecture.
- **SHOULD** use the framework's recommended dependency injection or context mechanism.

### Rendering, SSR and hydration
- **MUST** guard browser/platform-only APIs (window, document, storage, device APIs) when code runs on the server or multiple platforms.
- **MUST** make every new public route renderable in the project's rendering mode; decide prerender/SSR/CSR during planning.
- **SHOULD** defer or lazily hydrate heavy, below-the-fold blocks when the framework supports it.
- **MUST NOT** introduce hydration mismatches (non-deterministic values, time, random IDs in server output).

### Styling and assets
- **MUST** use the project's styling system first; custom CSS only when it cannot express the need.
- **MUST** use design tokens (color, spacing, radius, typography, motion); no hard-coded values.
- **MUST NOT** use inline styles except for justified dynamic bindings.
- **MUST** import UI library components and icons individually (tree-shakeable).
- **SHOULD** keep custom icons/SVGs where the stack profile defines.

### Accessibility wiring
- **MUST** use native semantic elements before ARIA; every interactive element keyboard reachable with visible focus.
- **MUST** label icon-only controls and form fields.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| `ui.build` | `ui-build` | Layout, responsive, forms, cards, navigation, visual polish | L1 |
| `ui.refine` | `ui-refine` | Any animation, transition, micro-interaction, scroll effect | L2 |
| `ui.system` | `ui-system` | Premium polish, hierarchy, dashboards, landing pages (when requested) | L2 |
| `test.browser` | `browser-verify` | Flows, responsive regressions, console errors, screenshots | L2 |
| `app.run` | `run` | See the change working in the real app | L2 (L1 for visible changes) |
| `docs.library` | `library-docs` (→ angular-cli / primeng / context7 MCP) | Framework, styling or UI library API not verified this session | Q |
| `framework.cli` | `angular-cli` MCP (stack angular); other stacks: none yet → supply-chain §5 | Generators, best practices, migrations | L1 |
| `ui.library` | `primeng` MCP (PrimeNG); other libraries: `library-docs` | Component API, props, examples, theming tokens | L1 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] Acceptance criteria verified in the running app (`run`) and covered by tests
- [ ] Loading, empty, error, success and disabled states implemented
- [ ] Keyboard navigation, visible focus and labels verified
- [ ] No console errors or hydration warnings; SSR render verified when enabled
- [ ] Tokens only; light/dark and narrow viewport checked
- [ ] Cleanup for subscriptions, listeners and animations in place

## Anti-patterns
- Default/unoptimized change detection where the stack recommends an optimized mode.
- Mutating state directly instead of through the setter/immutable update.
- Subscriptions or listeners without cleanup.
- Accessing window/document/storage without a platform guard in SSR or multi-platform code.
- Importing a whole UI or icon library.
- Hard-coded colors, spacing or durations.
- Spinner-only UIs with no empty or error state.
- Declaring done from tests alone without seeing the screen.

## Hand-offs
- To `sc-ux-ui`: missing states, copy, hierarchy, token or motion decisions.
- To `sc-backend`: API contract gaps or error shapes the UI cannot handle.
- To `sc-data`: shared state, caching, persistence or offline sync.
- To `sc-architecture`: unclear placement or a needed cross-module contract.
- To `sc-qa`: test strategy, browser regression suites.
- To `sc-security`: auth flows, token storage, XSS-prone rendering.
- To `sc-devops`: SSR/prerender configuration, bundle budgets, deploy.

## References
- web.dev — Core Web Vitals: https://web.dev/articles/vitals
- WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- Official stack docs: stack profile → *Official docs*

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
