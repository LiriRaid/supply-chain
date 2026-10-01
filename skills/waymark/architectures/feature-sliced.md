# Architecture: Feature-Sliced Design (FSD)

## Quick ref
**Intent:** Frontend structure by scope of responsibility (layers) then by business slice, with each slice exposing a single public API.
**Dependency rule:** A module may import only from layers strictly below it (app > pages > widgets > features > entities > shared). No imports across slices of the same layer. Slices are consumed only through their public API (`index.ts`).
**Detect:** `src/{app,pages,widgets,features,entities,shared}` (processes layer is deprecated); slice folders with `index.ts` and segments `ui/ model/ api/ lib/ config/`.

## Layout
```
src/
  app/       providers, router, global styles, entry; initialization
  pages/     one slice per route/screen; composes widgets and features
  widgets/   large self-sufficient UI blocks (header, conversation panel) composed from features/entities
  features/  user-facing actions with business value (send-message, filter-conversations)
  entities/  business entities (conversation, contact, user): model, ui, api
  shared/    domain-agnostic: ui kit, api client, lib, config, types (organized by segments, no slices)
<layer>/<slice>/
  ui/        components
  model/     state, selectors, types, business logic
  api/       requests, DTOs, mappers
  lib/       slice-internal helpers
  config/    constants, flags
  index.ts   PUBLIC API: the only entry point other slices may import
```
Mappings:
- **React/Next:** FSD as-is; Next `app/` or `pages/` router files re-export from `src/pages/<slice>` to avoid name clash with FSD `pages`.
- **Angular:** same layers; slice = folder with `index.ts` barrel; `app` layer holds `app.config.ts`/routes with `loadComponent`/`loadChildren`; `model/` uses signals stores; path aliases `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`.
- **Vue/Svelte:** same layers; stores in `model/`.
- Note: FSD `features/` means a user action, whereas in `screaming.md` a feature is a whole domain area. Follow the layout detected in the project.

## Dependency rules
| From (layer) | May import | Must not import |
|---|---|---|
| `app` | pages, widgets, features, entities, shared | - |
| `pages` | widgets, features, entities, shared | other pages, `app` |
| `widgets` | features, entities, shared | other widgets, pages, app |
| `features` | entities, shared | other features, widgets, pages, app |
| `entities` | shared | other entities (use `@x` cross-import API or lift to a higher layer), features and above |
| `shared` | itself, third-party | any upper layer |
Imports into a slice must target its `index.ts`, never a deep path (`entities/user/model/store`).

## Placement rules
1. Pure, domain-agnostic (button, http client, date util)? -> `shared`.
2. Describes a business noun (User, Conversation) with its data and view? -> `entities/<noun>`.
3. A verb the user performs (send, filter, assign)? -> `features/<verb-noun>`.
4. Composes several features/entities into a reusable block? -> `widgets/<block>`.
5. A route-level screen? -> `pages/<screen>`, composition only, minimal logic.
6. App-wide providers, router, theme, bootstrap? -> `app`.
7. Two features need to talk? -> compose them in a higher layer (widget/page) or share through an entity; never import sideways.
8. Segment by purpose (`ui`, `model`, `api`), not by file kind (`components`, `hooks`, `types`).

## Conformance checklist
Replace `<layer>/<slice>` with the touched slice.

- [ ] No import from a higher layer — check: `grep -rnE "from '(@|\.\./)+(app|pages|widgets)" src/features src/entities src/shared` returns nothing; likewise `src/shared` importing `entities|features` returns nothing.
- [ ] No same-layer cross-slice import — check: `grep -rnP "from '(@features|\.\./\.\./features)/(?!<slice>)" src/features/<slice>` returns nothing (repeat for entities, widgets, pages).
- [ ] Slices are imported only via public API — check: `grep -rnE "from '.*/(entities|features|widgets|pages)/[^/']+/(ui|model|api|lib|config)/" src` returns nothing outside the owning slice.
- [ ] Every slice has an `index.ts` exporting only its public surface — check: `ls src/<layer>/<slice>/index.ts`.
- [ ] Segments are named by purpose — check: `find src -type d \( -name components -o -name hooks -o -name utils -o -name helpers \)` returns nothing outside `shared`.
- [ ] `shared` contains no business logic or domain terms — check: `grep -rniE "conversation|invoice|order|contact" src/shared` returns nothing domain-specific.
- [ ] `pages` slices stay thin (<= ~150 lines, composition only) — check: `wc -l src/pages/<slice>/ui/*`.
- [ ] Routes lazy-loaded per page — check: `grep -rnE "lazy\(|loadComponent|loadChildren|import\(" src/app` lists each page.
- [ ] Layer violations are caught by tooling — check: lint config includes a boundaries rule (see tooling) and `pnpm lint` passes.
- [ ] No circular dependencies — check: `npx madge --circular src` or `depcruise` reports none.

## Clean Code expectations
- One purpose per slice and per segment; a feature does one user action.
- Names carry business language (`send-message`, `conversation-card`) not technical roles.
- Keep the public API minimal: export what consumers need, hide the rest.
- Avoid premature entities: promote a type to `entities` only when two slices use it.

## Common violations -> fix
| Violation | Fix |
|---|---|
| `features/a` imports `features/b` | Compose both in a widget/page, or move shared data to `entities` |
| Deep import `entities/user/model/store` | Export through `entities/user/index.ts` and import from there |
| `shared/ui` imports `entities/user` | Make the component generic; pass data by props |
| Business logic in `pages` | Move into a feature's `model/` |
| Segments `components/`, `hooks/` | Rename into `ui/`, `model/` |
| Entity needs another entity | Use the `@x` cross-import notation or lift composition upward |

## Enforcement tooling
- `@feature-sliced/steiger` (official FSD linter), `eslint-plugin-boundaries`, `@conarti/eslint-plugin-feature-sliced`, `dependency-cruiser`, `madge --circular`. Angular/Nx: `@nx/enforce-module-boundaries` with tags per layer.

## References
- Feature-Sliced Design docs: https://feature-sliced.design
- Steiger linter: https://github.com/feature-sliced/steiger
- Related: `screaming.md` (domain-first alternative).
