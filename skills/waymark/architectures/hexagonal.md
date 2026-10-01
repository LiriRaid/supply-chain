# Architecture: Hexagonal (Ports & Adapters)

## Quick ref
**Intent:** The business core (domain + use cases) is isolated from I/O; the outside world connects through ports implemented by adapters.
**Dependency rule:** Dependencies point inward: adapters -> ports/application -> domain. Domain and application never import frameworks, ORMs, HTTP clients or adapters.
**Detect:** `domain/` + `adapters/` or `ports/` folders; also `application/`, `adapters/in` + `adapters/out`, `infrastructure/` implementing `*Port` interfaces.

## Layout
```
src/
  domain/          entities, value objects, domain services, domain events, domain errors (pure)
  application/     use cases (one per intent), orchestrates domain via ports
    ports/
      in/          driving ports: use case interfaces called by adapters
      out/         driven ports: interfaces the core needs (repositories, gateways, clock, mailer)
  adapters/
    in/            driving adapters: HTTP controllers, GraphQL, CLI, queue consumers, websockets
    out/           driven adapters: ORM repositories, REST clients, SMTP, Redis, S3
  config/          composition root: wires adapters to ports (DI)
```
Mappings:
- **NestJS:** `src/<ctx>/{domain,application,adapters}`; ports as abstract classes or injection tokens; controllers in `adapters/in/http`; Prisma/TypeORM repos in `adapters/out/persistence`; wiring in the module `providers: [{ provide: OrderRepositoryPort, useClass: PrismaOrderRepository }]`.
- **Spring:** packages `domain`, `application.port.in/out`, `adapter.in.web`, `adapter.out.persistence`; `@Configuration` is the composition root.
- **Go:** `internal/domain`, `internal/app` (use cases + port interfaces), `internal/adapters/{http,postgres}`; interfaces declared where consumed; `cmd/<app>/main.go` wires.
- **Rails:** `app/domain` (plain Ruby POROs), `app/application` (use cases / interactors), `app/adapters/{in,out}` (controllers stay thin in `app/controllers` calling use cases; AR repositories in `app/adapters/out/persistence`). ActiveRecord models are persistence details, not the domain.
- **Python:** packages `domain`, `application`, `adapters`; ports as `typing.Protocol` or ABC; FastAPI/Django views are driving adapters; composition in `main.py`.

## Dependency rules
| From | May import | Must not import |
|---|---|---|
| `domain` | itself, language stdlib | `application`, `adapters`, frameworks, ORM, DTOs |
| `application` (use cases, ports) | `domain`, own ports | `adapters`, framework decorators beyond DI marker, ORM/HTTP types |
| `adapters/in` | `application/ports/in`, DTO mapping | `adapters/out`, `domain` internals bypassing use cases |
| `adapters/out` | `application/ports/out`, `domain` types, vendor SDKs | `adapters/in`, use case implementations |
| composition root | everything | (only place allowed to know all concrete classes) |

## Placement rules
1. Pure business rule or invariant? -> `domain` (entity/value object/domain service).
2. A single user intent ("place order")? -> one use case class in `application`, one input and one output model.
3. Needs something external (DB, email, clock, another service)? -> declare an out-port in `application/ports/out`, implement in `adapters/out`.
4. Triggered externally (HTTP, cron, message)? -> driving adapter in `adapters/in`, mapping request to use-case input; no business logic.
5. Mapping between persistence rows/DTOs and domain objects? -> inside the adapter that owns the format.
6. Framework wiring, env config, DI bindings? -> composition root only.

## Conformance checklist
- [ ] Domain has no framework or I/O imports — check: `grep -rnE "from '@nestjs|import .*typeorm|prisma|express|axios|@angular|django|rails|ActiveRecord" src/domain` returns nothing (adapt to stack).
- [ ] Domain/application never import adapters — check: `grep -rnE "adapters/" src/domain src/application` returns nothing.
- [ ] Adapters in do not import adapters out — check: `grep -rnE "adapters/out" src/adapters/in` returns nothing.
- [ ] Every external dependency of a use case is a port — check: `grep -rnE "constructor\(|@Inject" src/application` shows only `*Port`/interface types.
- [ ] Controllers contain no business logic — check: controller methods only map input, call one use case, map output (review; no repository/ORM calls: `grep -rnE "Repository|prisma\.|\.find\(|\.save\(" src/adapters/in` returns nothing).
- [ ] One use case per intent, named with a verb phrase — check: `ls src/application` shows `PlaceOrder`, `CancelOrder`, not `OrderService`.
- [ ] ORM entities are not returned from use cases or used in domain — check: `grep -rnE "@Entity|@Column|ActiveRecord::Base" src/domain src/application` returns nothing.
- [ ] Concrete bindings exist only in the composition root — check: `grep -rnE "new (Prisma|Typeorm|Http)\w+" src --include=*.ts` hits only config/module wiring and tests.
- [ ] Use cases are unit-testable with in-memory fakes — check: a spec exists in `application` using fake ports, no DB or network.
- [ ] Domain errors are domain types mapped to HTTP/status in the adapter — check: `grep -rnE "HttpException|status\(" src/domain src/application` returns nothing.

## Clean Code expectations
- Single responsibility per layer: domain decides, use case orchestrates, adapter translates.
- Names speak the ubiquitous language (`Invoice.markPaid()`), not technical roles (`InvoiceManager`).
- Ports are small and role-focused (`LoadOrders`, `SaveOrder`), not god interfaces.
- No anemic domain: behavior lives with the data it protects.

## Common violations -> fix
| Violation | Fix |
|---|---|
| Use case injects the ORM client | Define an out-port, implement in `adapters/out/persistence` |
| Entity decorated with ORM annotations used as domain | Split into domain entity and persistence model + mapper |
| Controller calls repository directly | Route through a use case |
| Domain throws `HttpException` | Throw a domain error; map in the driving adapter |
| Adapter reaching into another adapter | Go through a port or the use case |
| One `Service` class with 15 methods | Split into one use case per intent |

## Enforcement tooling
- TS: `dependency-cruiser`, `eslint-plugin-boundaries`, `ts-arch`. Java: ArchUnit (Spring). Go: `go-arch-lint`, `depguard`. Python: `import-linter` contracts. Rails: `packwerk` or custom RuboCop cops.

## References
- Alistair Cockburn, "Hexagonal Architecture" (2005): https://alistair.cockburn.us/hexagonal-architecture/
- Tom Hombergs, "Get Your Hands Dirty on Clean Architecture".
- Related: `clean.md`, `modular-monolith.md`.
