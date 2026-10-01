# ui-refine · mode: animate

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** "agrega animaciones", "transiciones", "microinteracciones", or a state change that is hard to follow.
- **Steps:** 1. Keep list, including existing motion. 2. Name the purpose of each animation: feedback, orientation, continuity or emphasis; drop any without one. 3. Pick duration and easing from `references/motion.md`; exits faster than entrances. 4. Animate `transform` and `opacity`; avoid layout properties; no `will-change` left on permanently. 5. Provide a `prefers-reduced-motion` variant (none or a short fade). 6. Encapsulate per the stack adapter and clean up timelines, observers and listeners on destroy. 7. Check for jank on a throttled CPU and that no content is hidden if JS or the animation fails.
- **Output:** motion spec (element, trigger, purpose, duration, easing, reduced variant), files changed.
