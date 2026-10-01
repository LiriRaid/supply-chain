# Architecture: Clean Architecture

## Quick ref
**Intent:** Business rules are independent of frameworks, UI, database and external agencies, arranged in concentric circles.
**Dependency rule:** Source code dependencies point only inward: frameworks & drivers -> interface adapters -> use cases -> entities. Inner circles know nothing about outer ones.
**Detect:** `domain/` (or `entities/`) + `application/` (or `usecases/`) + `infrastructure/` (or `interface-adapters/`, `presentation/`, `frameworks/`).

## Layout
```
src/
  domain/ (entities/)        enterprise rules: entities, value objects, domain errors
  application/ (usecases/)   application rules: use cases, input/output boundaries, repository/gateway interfaces
  interface-adapters/        controllers, presenters, view models, repository implementations, mappers/DTOs
  infrastructure/ (frameworks/)  web framework, ORM config, DB drivers, SDKs, DI container, main
```
Mappings:
- **NestJS:** `domain/`, `application/use-cases` + `application/ports`, `presentation/http` (controllers, DTOs), `infrastructure/persistence` (Prisma/TypeORM), `infrastructure/config`; `*.module.ts` is the wiring.
- **Spring:** `domain`, `application` (usecase + port), `interfaces.web`, `infrastructure.persistence`.
- **Angular:** `domain/` (models, pure rules), `application/` (facades/use-case services, abstract gateways), `infrastructure/` (HttpClient implementations), `presentation/` (components); gateways provided via DI tokens.
- **Rails:** `app/domain` (POROs), `app/use_cases`, `app/controllers` + `app/presenters` + `app/serializers` (interface adapters), `app/infrastructure` (AR repositories, clients); ActiveRecord is an outer-circle detail.
- **Python/Go:** same four packages; interfaces in `application`, implementations in `infrastructure`.

## Relation to Hexagonal and Onion
Clean, Hexagonal and Onion share one principle: the core does not depend on I/O. Hexagonal names the boundary (ports and adapters, driving vs driven); Onion stresses domain model at the center with domain services around it; Clean adds explicit use-case and interface-adapter rings plus the Dependency Rule. A hexagonal project that has `domain` + `application` + `adapters` satisfies Clean if the rule holds. When a project mixes names, follow the folders found; do not rename.

## Dependency rules
| From | May import | Must not import |
|---|---|---|
| `domain` | itself | every other layer, any framework |
| `application` | `domain` | `interface-adapters`, `infrastructure`, ORM/HTTP types |
| `interface-adapters` | `application`, `domain` | `infrastructure` (except via interfaces) |
| `infrastructure` | all inner layers, vendor SDKs | nothing restricted; it is the outermost ring |
Data crossing a boundary is a simple struct/DTO in the shape the inner circle prefers, never an ORM row or framework request object.

## Placement rules
1. Rule that holds regardless of the application (invariant, calculation)? -> `domain`.
2. Rule specific to this application's workflow? -> a use case in `application`.
3. Need to persist or call something outside? -> interface in `application`, implementation in `infrastructure` (or adapters).
4. Converting HTTP/UI input to use-case input and output to view model? -> controller/presenter in `interface-adapters`.
5. Framework config, DB connection, DI wiring, entrypoint? -> `infrastructure`.
6. Unsure which ring? -> the more inner ring that does not require importing outward.

## Conformance checklist
- [ ] Domain imports nothing outward — check: `grep -rnE "application/|infrastructure/|interface-adapters/|presentation/" src/domain` returns nothing.
- [ ] Domain is framework-free — check: `grep -rnE "@nestjs|@angular|typeorm|prisma|express|axios|ActiveRecord|@Entity|@Column" src/domain` returns nothing.
- [ ] Application does not import outer rings — check: `grep -rnE "infrastructure/|interface-adapters/|presentation/" src/application` returns nothing.
- [ ] Use cases depend on interfaces only — check: `grep -rnE "import .*(Prisma|Typeorm|Http\w*Repository|Axios)" src/application` returns nothing.
- [ ] Each use case has a single public entry (`execute`/`handle`) and a verb name — check: `grep -rnE "class \w+(UseCase|Interactor)" src/application` and review.
- [ ] Controllers only translate and delegate — check: `grep -rnE "\.save\(|\.find\w*\(|prisma\." src/interface-adapters src/presentation` returns nothing.
- [ ] No ORM entity crosses a boundary — check: `grep -rnE "return .*(Entity|Model)\b" src/application` shows domain types only.
- [ ] Concrete implementations are bound in one composition root — check: `grep -rnE "useClass|provide:" src` hits only module/config files.
- [ ] Use cases are tested without framework or DB — check: specs in `application` instantiate use cases with fakes only.
- [ ] Layering cycles absent — check: run `depcruise src --validate` (or stack equivalent) with zero errors.

## Clean Code expectations
- Single responsibility per layer and per use case; functions short, one level of abstraction.
- Names express intent and the domain (`ApproveRefund`), not mechanics (`RefundHandlerImpl`).
- Entities encapsulate behavior; avoid anemic data bags.
- Comments explain why; no dead code; no flag arguments crossing boundaries.

## Common violations -> fix
| Violation | Fix |
|---|---|
| Use case imports Prisma/HttpClient | Declare an interface in `application`, implement in `infrastructure` |
| Entity uses framework decorators | Separate persistence model; map in the repository |
| Controller contains business branching | Move the rule to a use case or entity |
| Use case returns an HTTP response/status | Return an output model; presenter/controller maps it |
| Shared `utils` imported by domain from outer layer | Move the helper to the domain or duplicate the tiny logic |
| Request DTO passed straight into entities | Map to use-case input model at the boundary |

## Enforcement tooling
- TS: `dependency-cruiser`, `eslint-plugin-boundaries`, `ts-arch`, `@nx/enforce-module-boundaries`. Java: ArchUnit (`onionArchitecture()` / `layeredArchitecture()`). Python: `import-linter` layers contract. Rails: `packwerk` or RuboCop custom cops. Go: `depguard`, `go-arch-lint`.

## References
- Robert C. Martin, "The Clean Architecture" (2012): https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Jeffrey Palermo, "The Onion Architecture" (2008).
- Related: `hexagonal.md`, `layered.md`.
