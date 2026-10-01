# Layout and responsive (LAY)

### LAY-01 Content reflows at 320 CSS px
`serious` · 1.4.10 · auto + manual
- Rule: at 320 px wide (or 1280 px at 400% zoom) content needs no horizontal scrolling, except data tables, maps and diagrams.
- Why: low-vision users zoom in and lose content off-screen.
- Check: STY `(min-)?width:\s*[4-9]\d{2,}px|width:\s*\d{4,}px`; TPL `\b(min-)?w-\[\d{3,}px\]`; then resize to 320 px.
- Fix: fluid widths (`max-width`, `minmax()`, wrap), stack columns, allow tables to scroll inside their own container.

### LAY-02 Zoom is never disabled
`critical` · 1.4.4 · auto
- Rule: the viewport meta allows user scaling.
- Why: blocking pinch-zoom removes the main tool of low-vision mobile users.
- Check: `user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b`.
- Fix: `width=device-width, initial-scale=1` only.

### LAY-03 Text scales to 200%
`moderate` · 1.4.4 · auto
- Rule: font sizes use `rem`/`em`; containers holding text do not have fixed heights that clip when text grows.
- Why: browser text-size settings are ignored or content gets cut.
- Check: STY `font-size:\s*\d+px`; `height:\s*\d+px` together with `overflow:\s*hidden` on text containers.
- Fix: convert to the type tokens in `rem`; use `min-height` instead of `height`.

### LAY-04 Text spacing overrides do not break content
`moderate` · 1.4.12 · manual
- Rule: with line height 1.5, paragraph spacing 2×, letter spacing 0.12 em and word spacing 0.16 em, nothing overlaps or is cut.
- Why: dyslexic users apply these overrides.
- Check: apply the overrides with a bookmarklet or devtools style on the key screens; look for fixed heights and absolute positioning around text.
- Fix: let containers grow; avoid absolute positioning of text blocks.

### LAY-05 Targets are big enough
`serious` · 2.5.8 · auto
- Rule: pointer targets are at least 24 × 24 CSS px (or have that spacing around them); touch-first UIs use 44 × 44.
- Why: tremor, large fingers and small screens cause mis-taps.
- Check: icon buttons with `\b(w|h|size)-[2-5]\b` and no padding; STY `(width|height):\s*(1\d|2[0-3])px` on buttons; inline icon links in dense rows.
- Fix: increase padding or the hit area (pseudo-element), keep the visual icon size.

### LAY-06 Orientation is not locked
`moderate` · 1.3.4 · auto
- Rule: views work in portrait and landscape unless an orientation is essential.
- Why: mounted devices (wheelchairs) cannot rotate.
- Check: `screen\.orientation\.lock|orientation:\s*(portrait|landscape)` in manifests or styles hiding content.
- Fix: remove the lock; adapt the layout instead.

### LAY-07 Fixed bars respect mobile viewports
`minor` · practice · auto
- Rule: full-height layouts use dynamic viewport units; fixed headers, footers and bottom navs leave room for content and respect safe-area insets.
- Why: `100vh` on mobile hides content under browser chrome; notches cover controls.
- Check: `100vh|h-screen\b|min-h-screen\b`; fixed bottom bars without `env\(safe-area-inset`.
- Fix: `100dvh` / `min-h-dvh`; `padding-bottom: env(safe-area-inset-bottom)`.

### LAY-08 Visual order matches DOM order
`moderate` · 1.3.2, 2.4.3 · auto
- Rule: CSS reordering does not change the meaning or the focus sequence.
- Why: keyboard and screen-reader users follow the DOM, not the picture.
- Check: STY/TPL `\border(-\d+|:\s*-?\d)|flex-(row|col)-reverse|-reverse\b|grid-area` → compare with the DOM order.
- Fix: reorder the markup; use reordering only for purely decorative elements.

### LAY-09 Overlays stack predictably
`minor` · practice · manual
- Rule: z-index comes from a small layer scale (base, dropdown, sticky, overlay, modal, toast); overlays render in a top-level container so ancestors with `overflow: hidden` do not clip them.
- Why: menus hidden under headers and clipped popovers break tasks.
- Check: `z-index:\s*\d{3,}|z-\[\d+\]`; dropdowns inside scroll containers.
- Fix: layer tokens; use the library's overlay container or append-to-body option.
