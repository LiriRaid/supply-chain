# Stack: .NET (ASP.NET Core, EF Core)

## Detect
Signals the agent checks (supply-chain §6): `*.sln` / `*.slnx`, `*.csproj`, `*.fsproj`, `global.json`, `Directory.Build.props`. ASP.NET Core is indicated by `Microsoft.NET.Sdk.Web` in a `.csproj` and a `Program.cs` using `WebApplication.CreateBuilder`.

## Commands
Default commands the agent runs in the Exit protocol; verify each once, then record it in project memory. Run from the folder containing the solution (or pass the solution path when several exist).

| Gate | Command | Notes |
|---|---|---|
| typecheck | none | Compilation happens in `dotnet build`; enable `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>` for stricter checks |
| lint | `dotnet format --verify-no-changes` | Verifies formatting and analyzer style rules without modifying files |
| test | `dotnet test --nologo` | Non-watch; add `--no-build` in project memory if build already ran |
| build | `dotnet build --nologo` | Restores and compiles the solution |
| format | `dotnet format` | Applies fixes; not a gate |

Other useful commands (not gates): `dotnet restore`, `dotnet run --project src/Api`, `dotnet watch`, `dotnet ef migrations add <Name>`, `dotnet ef database update`, `dotnet list package --vulnerable --include-transitive`, `dotnet test --collect:"XPlat Code Coverage"`.

Project memory example (Quality gates, verified commands):

| Gate | Command | Verified |
|---|---|---|
| typecheck | none | |
| lint (changed files) | `dotnet format --verify-no-changes --no-restore` | <date> |
| test (full) | `dotnet test --nologo --no-restore` | <date> |
| build | `dotnet build --nologo -warnaserror` | <date> |

## Conventions by department
Only what is specific to .NET. General rules live in the `sc-*` department skills (`sc-backend`, `sc-data`, `sc-security`, `sc-qa`).

### Frontend / Backend
- Minimal APIs or controllers (`[ApiController]`) per project convention; keep endpoints thin and delegate to application services or MediatR-style handlers.
- Dependency injection through the built-in container; constructor injection, register with the correct lifetime (`Scoped` for DbContext, `Singleton` only for stateless/thread-safe services).
- Nullable reference types enabled; no `!` suppression without justification. Use `record` types for DTOs and `required` members where fitting.
- Async all the way: `async Task`, pass `CancellationToken` through endpoints, services and EF calls; never `.Result` or `.Wait()`.
- Configuration with the options pattern (`IOptions<T>`, validated with `ValidateOnStart`); `appsettings.{Environment}.json` for environments.
- Errors: `ProblemDetails` (RFC 9457) via `AddProblemDetails` and an exception-handling middleware; no empty `catch`.
- Logging with `ILogger<T>` and structured templates (`"Order {OrderId} created"`), not string interpolation.
- Follow `.editorconfig` conventions; PascalCase for public members, `_camelCase` for private fields, `I` prefix for interfaces, `Async` suffix on async methods.

### Testing
- xUnit (default) or NUnit; keep one framework per solution. `[Fact]` / `[Theory]` with `[InlineData]` for table-style cases.
- Integration tests with `WebApplicationFactory<Program>` and Testcontainers for PostgreSQL/SQL Server; avoid the EF in-memory provider for behavior that depends on the real database.
- Mock with NSubstitute or Moq at boundaries; assertions with FluentAssertions or Shouldly if already used.
- Test project naming `<Project>.Tests`; arrange-act-assert; no shared mutable state. Every bugfix gets a regression test.

### Data & state
- EF Core with one `DbContext` per bounded context, registered `Scoped`. Configure entities with `IEntityTypeConfiguration<T>` rather than attributes where the model grows.
- Migrations via `dotnet ef migrations add`; committed, immutable after merge, reviewed for destructive operations; apply in CI/CD or a migration bundle, not on app startup in production.
- Avoid N+1: `Include`/`ThenInclude`, projections with `Select`, `AsSplitQuery` for large graphs; use `AsNoTracking()` for read-only queries.
- Index foreign keys and queried columns; paginate with `Skip/Take` or keyset pagination.
- Use parameterized queries (`FromSql` with interpolation is parameterized; `FromSqlRaw` with concatenation is not).

### Security
- Secrets via User Secrets in development and environment/Key Vault in production; never commit `appsettings` with credentials.
- Authentication/authorization with ASP.NET Core Identity or JWT bearer; use `[Authorize]` policies, fallback policy requiring authenticated users, and `[AllowAnonymous]` explicitly.
- CORS with named policies and explicit origins; anti-forgery enabled for cookie-based forms; HTTPS redirection and HSTS in production.
- Validate input (DataAnnotations, FluentValidation); never bind entities directly from requests (over-posting).
- Run `dotnet list package --vulnerable` and keep NuGet lock files/central package management current.

## Tools
| Capability | Provider | Type |
|---|---|---|
| `docs.library` | `context7` (ASP.NET Core, EF Core, xUnit, MediatR) | MCP |
| `app.run` | `run` | Skill |
| `review.diff` | `code-review` | Skill |
| `review.security` | `security-review` | Skill |
| `search.codebase` | `Explore` | Agent |
| `plan.implementation` | `Plan` | Agent |
| static analysis | Roslyn analyzers, `dotnet format`, StyleCop.Analyzers, SonarAnalyzer | NuGet / CLI |

## Architecture fit
- `clean` / onion architecture is the common fit: `Domain` (entities, no dependencies), `Application` (use cases, interfaces), `Infrastructure` (EF Core, external services), `Api` (composition root). Project references enforce the dependency direction.
- `layered` (Api, Services, Data) suits smaller services. Vertical slice (feature folders with endpoint, handler, validator) screams the domain better and pairs well with Minimal APIs.
- Keep EF Core types out of `Domain` and `Application` contracts where clean architecture is declared.

## Anti-patterns
- Blocking on async code (`.Result`, `.Wait()`), or `async void` outside event handlers.
- Returning EF entities from endpoints; binding request bodies directly to entities.
- `DbContext` registered as singleton or shared across threads.
- Missing `CancellationToken` propagation; swallowing exceptions.
- Applying migrations automatically at production startup; editing merged migrations.
- Service locator (`IServiceProvider.GetService`) in business code; static mutable state.
- Disabling nullable warnings project-wide to silence them.
- Logging with string interpolation or logging secrets/PII.

## Official docs
- .NET documentation: https://learn.microsoft.com/dotnet/
- ASP.NET Core: https://learn.microsoft.com/aspnet/core/
- Minimal APIs: https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis
- EF Core: https://learn.microsoft.com/ef/core/
- dotnet CLI: https://learn.microsoft.com/dotnet/core/tools/
- dotnet format: https://learn.microsoft.com/dotnet/core/tools/dotnet-format
- C# coding conventions: https://learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions
- xUnit: https://xunit.net/docs/getting-started/v3/cmdline
- Testing ASP.NET Core: https://learn.microsoft.com/aspnet/core/test/integration-tests
- ASP.NET Core security: https://learn.microsoft.com/aspnet/core/security/
