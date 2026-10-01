# ui-audit · Stack adapters

Loaded on demand: read only the row of the project's stack.

| Stack | Notes |
|---|---|
| Angular | `*.html` and inline `template:`; `[attr.aria-*]`; `routerLinkActive` + `ariaCurrentWhenActive`; CDK a11y (`cdkTrapFocus`, `LiveAnnouncer`). PrimeNG: icon-only `p-button` needs `ariaLabel`; dialogs already trap focus (confirm via the `primeng` MCP). |
| React / Next.js | `htmlFor`, `alt` on `img`/`next/image`; `eslint-plugin-jsx-a11y` output counts as candidates; route changes need focus handling. |
| Vue / Svelte | `@click` / `on:click` handlers; Svelte compiler a11y warnings are candidates. |
| Rails views | `image_tag` without `alt:`, `link_to "#"`, `f.label` for every field; Turbo Frame and Stream updates need focus and live-region checks. |
| Plain HTML / CSS | Patterns apply as written. |
