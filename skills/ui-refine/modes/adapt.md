# ui-refine · mode: adapt

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** "no se adapta al móvil", a new viewport, device, input mode or context (print, embedded, kiosk, touch).
- **Steps:** 1. Keep list per existing breakpoint. 2. Capture the target context. 3. Prefer fluid fixes (wrapping, `minmax`, `clamp`, intrinsic sizing, container queries) before new breakpoints. 4. Adjust targets (44/48 px on touch), navigation pattern and density for the context; hover-only affordances need a tap/focus equivalent. 5. Verify reflow at 320 CSS px and 200% zoom.
- **Output:** contexts verified, changes per context, captures.
