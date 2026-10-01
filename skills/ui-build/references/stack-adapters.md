# ui-build · Stack adapters

Loaded on demand: read only the row of the project's stack.

| Stack | Notes |
|---|---|
| Angular | Standalone + OnPush, `input()`/`output()`/`model()`, signals for state, `@if`/`@for (track id)`/`@defer`. Tailwind 4 utilities on `@theme` tokens; PrimeNG components imported individually and themed through the preset (verify props with the `primeng` MCP); Lucide icons from the project's icon provider. Guard browser APIs for SSR. Place per *Architecture fit* (`features/<f>/components/`). |
| React | Function components, derive during render, stable keys. Next.js: Server Component by default, `"use client"` only on the interactive leaf. Use the project's UI kit (shadcn/ui, Radix, MUI) and form library; CSS variables or Tailwind theme for tokens. |
| Vue / Svelte (generic) | Single-file components; props in, events out; `ref`/`computed` or Svelte runes for state. Scoped styles consuming CSS custom properties; keep the library kit (Vuetify, PrimeVue, Skeleton) as the base. |
| Native mobile (generic) | Platform components first (SwiftUI, Jetpack Compose, React Native, Flutter); a theme object holds tokens. Respect safe areas, dynamic type, 44/48 pt targets, platform navigation and back behavior, and the OS reduced-motion setting. |
