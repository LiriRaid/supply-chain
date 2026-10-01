# ui-system · Stack adapters

Loaded on demand: read only the row of the project's stack.

| Stack | Notes |
|---|---|
| Tailwind CSS 4 (any framework) | Tokens in `@theme` inside the main CSS file; semantic roles as CSS variables mapped in `@theme inline`; dark via a custom variant on `[data-theme=dark]` or `.dark`. |
| Angular + PrimeNG | Preset with `definePreset` from `@primeuix/themes`: primitive palette → `semantic.primary`, `semantic.colorScheme.light/dark.surface`; wired in `providePrimeNG`. Check token names with the `primeng` MCP; keep `--p-*` variables and Tailwind roles in sync. |
| React / Next.js | CSS variables in `globals.css` (shadcn/ui uses `--background`, `--foreground`, `--primary`… keep its names); theme class on `<html>` set before hydration. |
| Plain CSS / SCSS, Rails views | Custom properties on `:root` and `[data-theme=dark]`; SCSS maps only generate variables, components read `var(--…)`. Rails: `app/assets/stylesheets` or the tailwindcss-rails entry. |
| Native or other UI toolkits | Map roles onto the toolkit's theme object (color scheme, text theme); see `../supply-chain/stacks/generic.md`. |
