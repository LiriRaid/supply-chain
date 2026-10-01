# Motion (MOT)

### MOT-01 Non-essential motion respects reduced-motion
`serious` · 2.3.3 (AAA, required by dept-ux-ui) · auto
- Rule: every non-essential animation and any transition over 300 ms is removed or reduced to a fade under `prefers-reduced-motion: reduce`.
- Why: vestibular disorders turn movement into nausea and dizziness.
- Check: STY/TS `@keyframes|animation:|transition:|gsap\.|animate\(|motion\.`, Tailwind `animate-` → confirm a reduced-motion query, `motion-safe:` variant or `matchMedia` guard.
- Fix: wrap in `@media (prefers-reduced-motion: no-preference)`; check `matchMedia` before scripted timelines.

### MOT-02 Nothing flashes more than three times per second
`critical` · 2.3.1 · manual
- Rule: no content flashes more than 3 times in any second, especially large or saturated red areas.
- Why: risk of seizures.
- Check: blinking alerts, strobe effects, rapid loops (`animation-duration` < 333 ms with `infinite`).
- Fix: slow it down, shrink the area, or replace with a static state change.

### MOT-03 Moving content can be paused
`serious` · 2.2.2 · auto
- Rule: carousels, marquees, auto-advancing slides and looping background video that last over 5 s have a visible pause/stop; auto-updating feeds can be paused or controlled.
- Why: moving content distracts and cannot be read at one's own pace.
- Check: `autoplay|setInterval\(|\binfinite\b|<video\b[^>]*autoplay|carousel|swiper|marquee`.
- Fix: add a pause control, stop on hover and focus, and do not autoplay under reduced motion.

### MOT-04 Animate compositor-friendly properties
`moderate` · practice · auto
- Rule: animate `transform` and `opacity`; avoid animating `width`, `height`, `top`, `left`, `margin` or `box-shadow` on large areas; avoid `transition: all`.
- Why: layout-triggering animation janks on mid-range devices.
- Check: STY `transition:\s*all|transition-all\b|transition:[^;]*(width|height|top|left|margin)`; GSAP tweens on layout properties.
- Fix: use transforms (scale, translate) or a FLIP technique; list explicit transition properties.

### MOT-05 Content does not wait for motion
`moderate` · practice · manual
- Rule: content is readable and operable before entrance animations finish; nothing starts at `opacity: 0` waiting for script (fails with SSR, slow JS or reduced motion).
- Why: users see blank areas or click elements still moving.
- Check: STY/TPL `opacity:\s*0|opacity-0\b` on content blocks animated in by script.
- Fix: render in the final state and animate from it, or set the initial state in CSS only under `no-preference`.

### MOT-06 No vestibular triggers in task flows
`moderate` · practice · manual
- Rule: no parallax, scroll-jacking, large zooms or spinning on screens where users work; landing-page effects need a reduced-motion variant.
- Why: large-scale motion tied to scrolling is the strongest vestibular trigger.
- Check: `ScrollTrigger|scrub|parallax|scroll-behavior|wheel` listeners that prevent default.
- Fix: remove from task flows; keep native scrolling; offer a static variant.
