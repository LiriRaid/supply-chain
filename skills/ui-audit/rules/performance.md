# Perceived performance (PERF)

### PERF-01 Images reserve their space
`moderate` · practice (CLS) · auto
- Rule: every image and embed has `width` and `height` or a CSS `aspect-ratio`.
- Why: content jumps while loading; users mis-tap.
- Check: TPL `<(img|iframe|video)\b` → inspect for `width`/`height` or an aspect-ratio class.
- Fix: add intrinsic dimensions; use the framework image component (`NgOptimizedImage`, `next/image`).

### PERF-02 The main image loads first; others wait
`moderate` · practice (LCP) · auto
- Rule: the largest above-the-fold image is eager with high priority; below-the-fold images and iframes use `loading="lazy"`.
- Why: a lazy hero delays the first meaningful paint; eager galleries waste bandwidth.
- Check: TPL `loading="lazy"` on hero images; `<img\b` lists without `loading=`; Angular `priority` and Next.js `priority` props.
- Fix: `fetchpriority="high"` / `priority` on the hero; `loading="lazy"` elsewhere.

### PERF-03 Fonts load without hiding or shifting text
`moderate` · practice · auto
- Rule: `font-display: swap` or `optional`; only critical files preloaded; few families and weights; fallback metrics matched.
- Why: invisible text and reflow on font arrival.
- Check: STY `@font-face` → look for `font-display`; `<link[^>]*fonts\.googleapis` without `display=`; count weights loaded.
- Fix: add `font-display`, subset, drop unused weights, use the framework font helper.

### PERF-04 Async content keeps its place
`moderate` · practice (CLS) · manual
- Rule: loading placeholders match the final layout; banners, ads and late content do not push existing content down.
- Why: layout shift causes wrong clicks and lost reading position.
- Check: skeleton components vs final markup; notices inserted at the top after load.
- Fix: reserve space (min-height, skeleton of the same shape); insert late content below the viewport or as overlay.

### PERF-05 Long lists are bounded
`moderate` · practice · manual
- Rule: lists that can exceed ~100 rows are paginated, incrementally loaded or virtualised.
- Why: thousands of DOM nodes freeze scrolling on mid-range phones.
- Check: TPL `@for|\*ngFor|\.map\(|v-for|each ` over collections fed by unbounded API results.
- Fix: server pagination, infinite loading with a visible "load more", or virtual scroll (CDK, TanStack Virtual).

### PERF-06 Heavy UI is deferred
`minor` · practice · auto
- Rule: charts, editors, maps and below-the-fold or interaction-only widgets load on demand.
- Why: initial bundle and hydration cost delay interactivity.
- Check: static imports of heavy libraries (`chart|echarts|monaco|mapbox|leaflet|quill`) in eagerly loaded components; absence of `@defer`, `lazy(`, `import(`.
- Fix: `@defer (on viewport)`, `React.lazy`/`next/dynamic`, route-level code splitting.

### PERF-07 Actions respond within 100 ms
`moderate` · practice · manual
- Rule: any interaction acknowledges within ~100 ms (pressed state, optimistic update or progress); operations over ~1 s show progress; over ~10 s allow cancel or background.
- Why: without feedback users repeat the action or think it failed.
- Check: buttons that call the network without a pending state; long exports and uploads without progress.
- Fix: pending state on the trigger, optimistic UI where safe, progress with cancel for long jobs.
