# Accessibility (A11Y)

### A11Y-01 Images carry a text alternative
`critical` · 1.1.1 · auto
- Rule: informative images have an `alt` describing their purpose; decorative images have `alt=""`.
- Why: screen-reader users otherwise hear a file name or nothing.
- Check: TPL `<img\b|<Image\b|image_tag|NgOptimizedImage|ngSrc` → inspect each hit for `alt`.
- Fix: describe the function ("Company logo, go to home"), not the pixels; `alt=""` for decoration.

### A11Y-02 Icon-only controls have an accessible name
`critical` · 4.1.2 · auto
- Rule: a button or link whose visible content is only an icon exposes a name via `aria-label`, `aria-labelledby` or visually hidden text.
- Why: it is announced as "button" with no purpose.
- Check: TPL multiline `<(button|a)\b[^>]*>\s*<(svg|i|img|lucide|[a-z-]*icon)` ; PrimeNG `<p-button[^>]*icon=` without `label`/`ariaLabel`.
- Fix: add a name in the UI language that states the action ("Close dialog"); keep the tooltip if any.

### A11Y-03 Text meets contrast
`serious` · 1.4.3 · auto + manual
- Rule: text ≥ 4.5:1 against its background; large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1; in every theme.
- Why: low vision, glare and cheap screens make faint text unreadable.
- Check: measure the token pairs (`../ui-system/references/palette-method.md`); STY/TPL `opacity:\s*0?\.[0-5]|opacity-[1-5]0\b|text-(gray|slate|zinc|neutral)-[2-4]00\b` for faint text candidates.
- Fix: move the color along its scale, or use the `text-muted` role that already passes.

### A11Y-04 UI components and states meet non-text contrast
`serious` · 1.4.11 · manual
- Rule: input borders, checkbox outlines, toggles, focus indicators and meaningful icons ≥ 3:1 against adjacent colors.
- Why: users cannot find fields or see the state of a control.
- Check: list `border-input`, focus and selected-state tokens; measure per theme.
- Fix: use a stronger border role for interactive boundaries; decorative dividers may stay light.

### A11Y-05 Color is never the only signal
`serious` · 1.4.1 · manual
- Rule: status, errors, required fields, selection, chart series and inline links have a second cue (text, icon, underline, pattern).
- Why: color-vision differences and monochrome displays lose the meaning.
- Check: review badges, validation styles and links inside paragraphs; TPL `text-(red|green)-|color:\s*(red|green)` as candidates.
- Fix: add an icon or word; underline links in running text.

### A11Y-06 Page has a language and a descriptive title
`moderate` · 3.1.1, 2.4.2 · auto
- Rule: `<html lang>` matches the UI language; each route sets a unique title.
- Why: wrong pronunciation by screen readers; tabs and history become indistinguishable.
- Check: `<html\b` in the index or layout file; Angular routes `title:`; Next.js `metadata` / `generateMetadata`; Rails `content_for :title`.
- Fix: set `lang`; add a title per route ("Contacts · App name").

### A11Y-07 Headings and landmarks describe the structure
`moderate` · 1.3.1, 2.4.6 · auto + manual
- Rule: one `h1` per view, no skipped levels, and `header`, `nav`, `main`, `footer` (or roles) present once each where they apply.
- Why: screen-reader users navigate by headings and landmarks.
- Check: TPL `<h[1-6]\b` per view, `<main\b`; styled `div`s used as headings (`class="[^"]*title`).
- Fix: use real heading elements at the right level; style them with tokens.

### A11Y-08 Native elements before ARIA; ARIA is valid
`moderate` · 4.1.2 · auto
- Rule: prefer `button`, `a`, `input`, `select`, `details`; any `role` comes with its required states and keyboard support; no ARIA contradicting the element.
- Why: incomplete ARIA is worse than none: it promises behavior that is missing.
- Check: TPL `role="(button|link|checkbox|tab|menu|menuitem|dialog|switch)"`, `aria-hidden="true"` on focusable elements.
- Fix: swap to the native element, or complete the pattern following the ARIA authoring practices.

### A11Y-09 Status messages are announced
`serious` · 4.1.3 · auto + manual
- Rule: toasts, async results ("3 results"), saving states and inline errors appear in a live region (`role="status"` polite, `role="alert"` assertive only for urgent errors).
- Why: non-visual users never learn that something happened.
- Check: find toast/notification and result-count components; TPL `aria-live|role="(status|alert)"|LiveAnnouncer`.
- Fix: render messages into a persistent live region; do not move focus just to announce.

### A11Y-10 Data tables expose their headers
`moderate` · 1.3.1 · auto
- Rule: tabular data uses `table` with `th` (and `scope`) and a caption or accessible name; layout never uses tables; div-based grids implement the grid roles fully.
- Why: cells are read without their column meaning.
- Check: TPL `<table\b` → inspect for `<th`; `role="grid"|role="table"` on divs.
- Fix: add header cells and a caption; use the library table's header API.
