# browser-verify · mode: states

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** new or restyled components, screens with async data, responsive or theming work.
- **Steps:** 1. Loading: throttle or delay the request if the provider allows it, otherwise catch it on first render and say so. 2. Empty: use a filter, account or fixture with no data. 3. Error: point to a failing endpoint only through the app's own dev mechanism (mock flag, stopped backend); never tamper with shared environments. 4. Disabled and focus: tab through the controls, confirm visible focus and that disabled controls do not act. 5. Viewports 375, 768, 1280: screenshot each; check no horizontal scroll, no clipped or overlapping text, reachable primary action. 6. Light and dark: switch the color scheme (emulation or the app's own toggle) and screenshot both.
- **Output:** a state × viewport/theme grid with verdicts and screenshot references.
