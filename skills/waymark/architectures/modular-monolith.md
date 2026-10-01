# Architecture: Modular Monolith

## Quick ref
**Intent:** One deployable unit composed of cohesive, loosely coupled domain modules, each owning its logic and data and exposing an explicit public API.
**Dependency rule:** Modules interact only through each other's public API (facade/index/interface) or internal events. No deep imports into another module, no cross-module DB access (tables, joins, foreign keys, ORM models).
**Detect:** `modules/<name>/` with a public `index.ts`/`api` file and internal folders; Rails `packs/<name>/` with `package.yml` (packwerk); Java/Kotlin `module-info` or package-private modules; Python `src/<pkg>/<module>/__init__.py` with import-linter contracts.

## Layout
```
src/
  modules/
    <module>/
      index.ts (public API)   facade, public DTOs, event types: the ONLY importable surface
      application/            use cases
      domain/                 entities, rules
      infrastructure/         repositories, clients (private)
      <module>.module.ts      wiring
      migrations/ or schema   tables owned by this module only
  shared-kernel/              tiny, stable, truly common types (ids, money, result)
  platform/ (core)            cross-cutting: config, logging, auth plumbing, event bus
  app/ main                   composition: imports modules, boots the process
```
Mappings:
- **NestJS:** each module exports only a facade provider (`exports: [BillingFacade]`); other modules import `BillingModule` and use the facade; internal providers are not exported; events via `@nestjs/event-emitter` or an outbox.
- **Rails:** packwerk packs under `packs/<name>/app/...`, `package.yml` with `enforce_dependencies: true` and `enforce_privacy: true`; public API in `app/public/`; constants outside `public` are private.
- **Spring:** Spring Modulith (`@ApplicationModule`, package-private internals, `ApplicationModuleListener` events); verify with `ApplicationModules.of(App.class).verify()`.
- **Python/Django:** one app/package per module, `api.py` as public surface, `import-linter` forbids deep imports; no cross-app model foreign keys across modules (use ids).
- **Angular/TS frontends:** libraries per domain (Nx libs with tags) and `index.ts` barrels; see `screaming.md`.

## Dependency rules
| From | May import | Must not import |
|---|---|---|
| module A | its own internals, module B's public API, `shared-kernel`, `platform` | B's internals, B's tables/ORM models/repositories |
| `shared-kernel` | nothing from modules | any module |
| `platform` | third-party, `shared-kernel` | modules |
| `app` | all modules (composition) | - |
Module dependency graph must be acyclic. If A and B need each other, introduce events or extract a third module.

## Placement rules
1. New business capability with its own vocabulary and data? -> new module.
2. Code used only by one module? -> inside it, private by default.
3. Another module needs data or behavior? -> add a method to this module's public API (facade) returning DTOs, not entities.
4. Reaction to something that happened elsewhere? -> subscribe to an internal domain event rather than calling directly.
5. Needing a join across modules? -> query each module via API and compose, or maintain a read model; never join foreign tables.
6. Truly universal value types? -> `shared-kernel`, kept tiny and stable. Everything else is not shared.
7. Table ownership: each table belongs to exactly one module; others reference by id only.
8. Plan seams so a module can be extracted into a service later: no shared transactions across modules without an explicit decision.

## Conformance checklist
Replace `<module>` with the touched module.

- [ ] Each module has a public API file — check: `ls src/modules/<module>/index.ts` (or `package.yml`, `api.py`).
- [ ] No deep imports into another module — check: `grep -rnP "from '.*modules/(?!<module>/)[^/']+/[^']+'" src/modules/<module>` returns nothing (only `modules/x` root imports allowed).
- [ ] No cross-module DB access — check: `grep -rnE "FROM|JOIN" <module sql/queries>` references only own tables; no foreign ORM model imports from other modules (`grep -rnE "modules/(?!<module>)\w+/(infrastructure|entities)" ...`).
- [ ] No cross-module foreign keys in migrations — check: `grep -rn "references\|foreign_key\|REFERENCES" <module>/migrations` targets only own tables.
- [ ] Public API exposes DTOs/interfaces, not ORM entities — check: `grep -nE "export .*Entity|ActiveRecord|@Entity" src/modules/<module>/index.ts` returns nothing.
- [ ] Module graph is acyclic — check: `depcruise src --validate` / `madge --circular src` / `bundle exec packwerk check` / `lint-imports` exits 0.
- [ ] Cross-module reactions go through events — check: `grep -rn "emit(\|publish(\|EventEmitter" src/modules/<module>` shows events defined in the module's public API.
- [ ] `shared-kernel` has no business logic and no module imports — check: `grep -rn "modules/" src/shared-kernel` returns nothing.
- [ ] Module registers itself, `app` only composes — check: `grep -rn "new .*Repository" src/app` returns nothing.
- [ ] Boundaries tool configured and passing in CI — check: config file exists (`.dependency-cruiser.cjs`, `packwerk.yml`, `.importlinter`, ArchUnit test) and runs in `lint`.
- [ ] Module has tests at its public API level — check: spec files targeting the facade exist.

## Clean Code expectations
- High cohesion inside a module, low coupling between modules; one bounded context per module.
- Module and API names use the domain's ubiquitous language (`Billing`, `Inbox`), never technical buckets (`Common`, `Utils`).
- Public API small, intention-revealing, versionable; internals refactor freely.
- Inside a module, pick `hexagonal.md`, `clean.md` or `layered.md` and stay consistent.

## Common violations -> fix
| Violation | Fix |
|---|---|
| Module A imports `modules/b/infrastructure/b.repository` | Call B's facade or consume B's event |
| SQL join across two modules' tables | Fetch via API and compose, or build a read model |
| FK constraint from A's table to B's table | Store B's id only, validate through B's API |
| Shared `common/` growing business code | Move to the owning module; keep only value types in `shared-kernel` |
| Circular dependency A <-> B | Replace one direction with an event or extract a third module |
| Facade returns ORM entities | Return plain DTOs/interfaces |

## Enforcement tooling
- TS/Nest: `dependency-cruiser`, `eslint-plugin-boundaries`, `@nx/enforce-module-boundaries`, `madge`. Rails: `packwerk` (+ `packwerk-extensions` for privacy), Spring: Spring Modulith verify, ArchUnit. Python: `import-linter` (forbidden/independence contracts). Go: `depguard`, `internal/` packages.

## References
- Simon Brown, "Modular Monoliths" talk; Kamil Grzybek, "Modular Monolith with DDD": https://github.com/kgrzybek/modular-monolith-with-ddd
- Packwerk: https://github.com/Shopify/packwerk; Spring Modulith: https://docs.spring.io/spring-modulith
- Related: `screaming.md`, `hexagonal.md`.
