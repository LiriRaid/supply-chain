# Architecture: Layered (MVC / N-tier)

## Quick ref
**Intent:** Organize code by technical role in strata, each with one responsibility, so changes stay local to a layer.
**Dependency rule:** Calls go downward only: controllers/routes -> services -> repositories -> models/DB. A lower layer never imports a higher one; layers are not skipped for business logic.
**Detect:** `controllers/` + `services/` (+ `repositories/`, `models/`) at the root or under a module; Rails `app/models` + `app/controllers` (+ `app/services`) without `domain/` or `adapters/` folders; Django `views.py`/`models.py`; Spring `controller/service/repository`; Express `routes/controllers/services`.

## Layout
```
src/
  controllers/ (routes, views)  HTTP in/out: parse, validate shape, call a service, serialize
  services/                      business logic and orchestration, transactions
  repositories/ (dao)            data access; hides ORM/queries
  models/ (entities)             data structures + persistence mapping
  dto/ serializers/ validators/  boundary shapes
  middleware/ config/ lib/       cross-cutting
```
Mappings:
- **Rails:** `app/controllers` (thin), `app/models` (ActiveRecord: associations, validations, scopes, domain behavior), `app/services` (service objects for multi-model workflows, `call` method), `app/serializers`, `app/jobs`, `app/queries` (query objects). Optional: `app/policies`, `app/forms`.
- **Django:** `views` -> `services.py` -> `selectors.py`/managers -> `models.py`; serializers (DRF) at the edge.
- **Spring:** `@RestController` -> `@Service` -> `@Repository` -> `@Entity`.
- **Express/NestJS (simple):** routes/controllers -> services -> repositories (Prisma/TypeORM) ; NestJS module groups one controller, service, repository per feature.

## Dependency rules
| From | May import | Must not import |
|---|---|---|
| controller | services, DTO/serializers, validators | repositories, ORM client, other controllers |
| service | repositories, models, other services (acyclic), clients | controllers, request/response objects, HTTP framework types |
| repository | models, ORM/DB driver | services, controllers |
| model | other models, own validations | services, controllers, request objects |
Cross-cutting (logging, config, auth middleware) is usable by all layers.

## Placement rules
1. Parsing params, auth check, choosing status code, rendering JSON? -> controller.
2. Rule about one record (validation, derived attribute, state transition)? -> model (rich model in Rails/Django: "fat model, thin controller").
3. Workflow spanning several models, external APIs, jobs or a transaction? -> service object (single public method, verb-named: `Orders::Place`, `PlaceOrderService`).
4. Complex reusable query? -> repository / query object / scope, not the controller.
5. Same logic needed in 2 controllers? -> push it down into a service or model, never copy it.
6. When the app grows past ~10 services touching the same models, group by domain (`app/models/billing`, `modules/billing`) - see `screaming.md` / `modular-monolith.md`.

## Conformance checklist
- [ ] Controllers are thin (<= 15 lines per action, no queries) — check: `grep -rnE "\.where\(|\.find_by|\.joins\(|\.includes\(|prisma\.|getRepository|createQueryBuilder" app/controllers src/controllers` returns nothing.
- [ ] Controllers do not hold business rules — check: no `if`/`case` on domain state in actions; review `wc -l` per action.
- [ ] Services do not touch request/response — check: `grep -rnE "params\[|request\.|response\.|@Req\(|@Res\(|req\.body|res\.status" app/services src/services` returns nothing.
- [ ] No upward imports — check: `grep -rnE "controllers/|from '\.\./controllers" app/services app/models src/services src/repositories` returns nothing.
- [ ] Repositories/models contain no business workflows — check: `grep -rnE "Service|Mailer|deliver_|send\(" src/repositories app/models` returns nothing unexpected.
- [ ] Services are acyclic — check: `depcruise --validate` (or Zeitwerk eager-load + no circular `require`) reports no cycles.
- [ ] Transactions live in services, not controllers — check: `grep -rnE "transaction|\$transaction|@Transactional" controllers` returns nothing.
- [ ] Service objects have one public entry and a verb name — check: `grep -rnE "class \w+(Service)" app/services src/services` and confirm single `call`/`execute`.
- [ ] N+1 and unbounded queries handled in the data layer — check: `includes`/`select_related`/eager loading present on list endpoints.
- [ ] Specs mirror layers: request/controller spec, service spec, model spec — check: `ls spec` or `*.spec.ts` beside each touched file.
- [ ] Names reveal the domain, not the pattern (`RefundOrder`, not `OrderHelper`/`Manager`/`Utils`) — review.

## Clean Code expectations
- Single responsibility per layer and per class; a service is not a dumping ground, split by use case.
- Short methods, early returns, explicit return values; errors as typed exceptions mapped at the controller.
- Avoid "God model" growth: extract concerns/query objects when a model exceeds ~300 lines.
- Do not wrap trivial passthrough layers (a service that only forwards one call) unless the project already does.

## Common violations -> fix
| Violation | Fix |
|---|---|
| Controller queries the DB and branches on business state | Move query to repository/scope, logic to service/model |
| Service reads `params`/`req` | Pass plain arguments or a DTO |
| Model sends emails/calls APIs in callbacks | Move to a service or job; keep callbacks to local invariants |
| Circular service calls | Extract the shared piece into a third service or a model method |
| Same logic pasted in two controllers | Extract to service/model |
| Fat service with many unrelated methods | One service per use case |

## Enforcement tooling
- TS: `dependency-cruiser`, `eslint-plugin-boundaries`. Java: ArchUnit `layeredArchitecture()`. Python: `import-linter` layers contract. Rails: RuboCop (`rubocop-rails`, `rubocop-rspec`, custom cops), `packwerk` when packs appear, `rails_best_practices`. Django: `import-linter`.

## References
- Martin Fowler, "PresentationDomainDataLayering": https://martinfowler.com/bliki/PresentationDomainDataLayering.html
- Rails Guides - MVC and service objects; Spring layered conventions.
- Related: `clean.md`, `hexagonal.md`, `modular-monolith.md`.
