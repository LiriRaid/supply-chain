# ui-refine · Stack adapters

Loaded on demand: read only the row of the project's stack.

| Stack | Notes |
|---|---|
| CSS / Tailwind | Tokens as CSS custom properties or Tailwind `@theme`; motion tokens for durations and easings. Use `motion-safe:` / `motion-reduce:` variants or a `@media (prefers-reduced-motion: reduce)` block. Container queries for component-level adapt. |
| Angular | Prefer CSS transitions and `animate.enter` / `animate.leave` (v20.2+) for simple enter/leave; the legacy animations package only where already used. GSAP: timelines live in a feature service, created in `afterNextRender`, killed via `DestroyRef.onDestroy` (`ctx.revert()` with `gsap.context`), behind SSR guards, gated by `matchMedia('(prefers-reduced-motion: reduce)')`. PrimeNG: restyle through the preset and pass-through, not by overriding internals. |
| React | CSS transitions first; Motion (framer-motion) when the project has it: `AnimatePresence` for exits, `useReducedMotion` or `MotionConfig reducedMotion="user"`. Effects that start animations must return cleanup. Next.js: animated components are client leaves. |
| Native (generic) | Use the platform animation API (SwiftUI `withAnimation`, Compose `animate*AsState`, Reanimated, Flutter implicit animations); honor the OS reduce-motion setting; respect safe areas and dynamic type in adapt and harden. |
