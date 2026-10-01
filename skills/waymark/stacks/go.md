# Stack: Go

## Detect
Signals the agent checks (waymark `references/project-detection.md`): `go.mod` at the project root (module path and Go version). `go.work` indicates a multi-module workspace; run commands per module.

## Commands
Default commands the agent runs in the Exit protocol; verify each once, then record it in project memory.

| Gate | Command | Notes |
|---|---|---|
| typecheck | `go vet ./...` | Compiles and runs vet checks; the closest thing to a typecheck gate |
| lint | `golangci-lint run` | Only if `.golangci.yml` (or `.yaml`/`.toml`) exists; runs on the whole module (use `--new-from-rev=HEAD` to limit to the diff) |
| test | `go test ./...` | Non-watch; add `-race` in project memory when CGO is available |
| build | `go build ./...` | Compiles all packages without producing binaries for libraries |
| format | `gofmt -w {files}` or `goimports -w {files}` | Not a gate |

Other useful commands (not gates): `go mod tidy`, `go mod verify`, `go test -run TestName ./pkg/...`, `go test -cover ./...`, `govulncheck ./...`, `go run ./cmd/<app>`.

Project memory example (Quality gates, verified commands):

| Gate | Command | Verified |
|---|---|---|
| typecheck | `go vet ./...` | <date> |
| lint (changed files) | `golangci-lint run --new-from-rev=HEAD` | <date> |
| test (full) | `go test -race -count=1 ./...` | <date> |
| build | `go build ./...` | <date> |

## Conventions by department
Only what is specific to Go. General rules live in the `dept-*` department skills (`dept-backend`, `dept-data`, `dept-security`, `dept-qa`).

### Frontend / Backend
- Standard layout: `cmd/<app>/main.go` for entry points, `internal/` for private packages, `pkg/` only for code intended for external import. Keep `main` thin.
- Package names are short, lowercase, singular, no underscores; name by what the package provides, not `util`/`common`/`helpers`.
- Accept interfaces, return structs. Define interfaces where they are consumed, keep them small.
- Errors are values: return `error` as the last result, wrap with `fmt.Errorf("doing x: %w", err)`, compare with `errors.Is`/`errors.As`. Never ignore an error silently; no `panic` for control flow.
- Pass `context.Context` as the first parameter to anything that does I/O or can block; honor cancellation and deadlines.
- Concurrency: every goroutine has a clear owner and exit path; use `errgroup`, channels or `sync` primitives deliberately; avoid shared mutable state.
- Exported identifiers carry doc comments starting with the identifier name. Run `gofmt`; code that is not gofmt-clean is a bug.
- Dependency injection through constructors (`NewX(deps) *X`), no package-level mutable globals or `init()` side effects.

### Testing
- Table-driven tests with named subtests:
  `tests := []struct{ name string; in X; want Y }{...}` then `for _, tc := range tests { t.Run(tc.name, func(t *testing.T) { ... }) }`.
- Use `t.Helper()` in helpers, `t.Cleanup` for teardown, `t.TempDir()` for files, `t.Parallel()` where safe.
- Test files `*_test.go` beside the code; use the `pkg_test` package for black-box tests.
- Fake at interfaces rather than using heavy mocking frameworks; `httptest` for HTTP handlers and clients.
- Compare with `cmp.Diff` (go-cmp) or `testify` if already a dependency; do not add one just for this.
- Run `go test -race ./...` before releases; benchmarks with `testing.B` for hot paths. Every bugfix gets a regression test.

### Data & state
- Use `database/sql` with `pgx`/`sqlx` or `sqlc`; always parameterized queries, never string-concatenated SQL.
- Close rows and statements (`defer rows.Close()`), check `rows.Err()`, and use `QueryContext`/`ExecContext`.
- Migrations with `golang-migrate`, `goose` or Atlas; files immutable after merge, with up and down.
- Transactions scoped to one use case; pass `*sql.Tx` or a querier interface to repositories.

### Security
- Secrets from environment or a secrets manager, never committed; validate configuration at startup.
- Validate and bound all external input (sizes, lengths); set `http.Server` timeouts (`ReadHeaderTimeout`, etc.) and request body limits.
- Use `crypto/rand`, not `math/rand`, for tokens; `html/template`, not `text/template`, for HTML.
- Run `govulncheck ./...` and `go mod verify`; keep `go.sum` committed.
- Do not log secrets or PII; structured logging with `log/slog`.

## Tools
| Capability | Provider | Type |
|---|---|---|
| `docs.library` | `context7` (standard library and third-party modules) | MCP |
| `app.run` | `run` | Skill |
| `review.diff` | `code-review` | Skill |
| `review.security` | `security-review` | Skill |
| `search.codebase` | `Explore` | Agent |
| `plan.implementation` | `Plan` | Agent |
| static analysis | `go vet`, `golangci-lint`, `staticcheck`, `govulncheck` | CLI |

## Architecture fit
- `hexagonal` / clean layering suits Go: `internal/domain` (pure types and rules), `internal/app` or `service` (use cases), `internal/adapters/{http,postgres,...}` (I/O). Dependencies point toward the domain; interfaces live in the consuming layer.
- For small services a flat `layered` layout (`handler`, `service`, `store`) is enough; do not introduce ports and adapters prematurely.
- Package-by-feature (`internal/orders`, `internal/billing`) screams the domain better than package-by-layer.

## Anti-patterns
- Ignoring errors (`_ = f()`), or `panic` for expected failures.
- Goroutine leaks: no cancellation path, unbounded spawning, unsynchronized map access.
- Missing `context.Context` propagation; `context.Background()` deep inside request handling.
- Giant interfaces defined next to the implementation; premature abstraction.
- Package-level mutable state, `init()` side effects.
- Packages named `util`, `common`, `base`; stuttering names (`user.UserService`).
- Building SQL by string concatenation; using `http.DefaultClient` without timeouts.
- Skipping `go mod tidy`, committing stale `go.sum`.

## Official docs
- Go documentation: https://go.dev/doc/
- Effective Go: https://go.dev/doc/effective_go
- Code Review Comments: https://go.dev/wiki/CodeReviewComments
- Standard library: https://pkg.go.dev/std
- Modules reference: https://go.dev/ref/mod
- Table-driven tests: https://go.dev/wiki/TableDrivenTests
- golangci-lint: https://golangci-lint.run
- govulncheck: https://go.dev/doc/security/vuln/
- sqlc: https://docs.sqlc.dev
