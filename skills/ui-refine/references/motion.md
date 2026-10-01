# Motion reference

Use the project's motion tokens when they exist. These values are defaults for projects without them; record any adopted values in project memory `## Design system`.

## Purpose first
| Purpose | Typical use | Keep it |
|---|---|---|
| Feedback | press, toggle, save confirmation | fast and small |
| Orientation | where a panel came from, where an item went | directional, consistent axis |
| Continuity | list reorder, expand/collapse, shared element | geometry preserved |
| Emphasis | first-run hint, new item highlight | rare, once |

No purpose, no animation.

## Durations
| Kind | Range |
|---|---|
| Hover, press, focus feedback | 80–150 ms |
| Small UI changes (toggle, tooltip, dropdown) | 150–220 ms |
| Panels, dialogs, drawers | 220–320 ms |
| Page or large view transitions | 300–450 ms (shorter on mobile) |

Exits run at roughly two thirds to three quarters of the entrance time. Staggers of 30–60 ms per item, capped so the whole sequence stays under ~500 ms.

## Easing
- Entrances and most transitions: a decelerating curve, e.g. `cubic-bezier(0.22, 1, 0.36, 1)` (strong ease-out).
- Exits: an accelerating curve, e.g. `cubic-bezier(0.55, 0, 1, 0.45)`.
- On-screen movement between two positions: a symmetric ease-in-out, e.g. `cubic-bezier(0.65, 0, 0.35, 1)`.
- Avoid linear for UI movement (fine for spinners and progress). No bounce or elastic overshoot in task flows.

## Performance
- Animate `transform` and `opacity`. Width, height, top/left, margin and box-shadow trigger layout or paint; use transform-based alternatives (scale, translate, FLIP) or animate a pseudo-element's opacity.
- Apply `will-change` just before a heavy animation and remove it after.
- Prefer CSS for simple state transitions; use a JS library for sequencing, scroll-linked or interruptible motion.
- Scroll effects: `IntersectionObserver` or the library's scroll trigger, never raw scroll listeners without throttling.

## Reduced motion
- Under `prefers-reduced-motion: reduce`: remove movement, parallax, auto-play and large scale changes; keep instant state changes or a short opacity fade (≤150 ms).
- Essential motion (a progress indicator) may remain but must not loop decoratively.
- Content must never depend on the animation finishing to be visible or usable.

## Cleanup
- Kill timelines, scroll triggers and observers on destroy/unmount.
- Interrupted animations must land in a valid end state (no half-faded elements after fast navigation).
- Browser-only animation code runs after first render in SSR apps.
