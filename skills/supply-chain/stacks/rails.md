# Stack: Ruby on Rails (API mode and full-stack)

## Detect
Signals the agent checks (supply-chain `references/project-detection.md`): `Gemfile` plus `Gemfile.lock` containing `rails`, and `config/application.rb`. API mode is `config.api_only = true`. Package manager is always Bundler (`bundle`); never pnpm/npm/yarn here, even if a `package.json` exists for assets.

## Commands
Default commands the agent runs in the Exit protocol; verify each once, then record it in project memory. Run everything through `bundle exec`. `{files}` = changed files.

| Gate | Command | Notes |
|---|---|---|
| typecheck | none | If Sorbet is present (`sorbet/` dir or `sorbet` in Gemfile.lock) `bundle exec srb tc` is possible, but this is a note only, not a default gate |
| lint | `bundle exec rubocop {files}` | Only if `rubocop` is in `Gemfile.lock`; changed `.rb` files only |
| test | `bundle exec rspec` | If `spec/` exists; otherwise `bin/rails test` (Minitest) |
| build | `bundle exec rails zeitwerk:check` | Verifies autoloading/constant naming; fast, no server needed |
| format | `bundle exec rubocop -a {files}` | Not a gate |

Other useful commands (not gates): `bin/rails db:migrate`, `bin/rails db:rollback`, `bundle exec brakeman -q`, `bundle exec bundler-audit check --update`, `bundle exec rails s`.

Project memory example (Quality gates, verified commands):

| Gate | Command | Verified |
|---|---|---|
| typecheck | none | |
| lint (changed files) | `bundle exec rubocop {files}` | <date> |
| test (full) | `bundle exec rspec --fail-fast` | <date> |
| build | `bundle exec rails zeitwerk:check && bundle exec brakeman -q --no-pager` | <date> |

Windows-native note (optional): if Ruby runs natively on Windows (Ruby 3.x with MSYS2/UCRT64), run commands from a shell where the UCRT64 toolchain is on `PATH` so native gems (pg, nokogiri, bcrypt) compile; prefer forward slashes in paths and `bundle exec` over bare binstubs if `bin/rails` shebangs fail. Redis and AnyCable-Go may need WSL or a container.

## Conventions by department
Only what is specific to Rails. General rules live in the `sc-*` department skills (`sc-backend`, `sc-data`, `sc-security`, `sc-qa`).

### Backend
- Thin controllers; business logic in services, POROs or interactors under `app/services/`. Models keep validations, associations and scopes only.
- REST under a versioned namespace (`/api/v1/`), consistent JSON shape, correct HTTP codes, uniform errors: `{ error: { code, message, details } }`.
- Strong params on every controller action (`params.require(...).permit(...)`); never `permit!`.
- Serializers (ActiveModel::Serializers, Blueprinter, Alba or jbuilder per project) own the API shape; do not call `as_json` ad hoc in controllers.
- Zeitwerk: file path must match the constant (`app/services/foo/bar_service.rb` defines `Foo::BarService`). Run `zeitwerk:check` after renames.
- Background work with ActiveJob (Sidekiq or the project's adapter): jobs are idempotent, take IDs not objects, and retry deliberately.
- Realtime: ActionCable/AnyCable channels in `app/channels/` with explicit authorization in `subscribed` (reject unauthorized). Broadcast from jobs when the work is asynchronous; no heavy work inline in channels. Redis is the backend; stub it in tests.
- Never `rescue Exception`; rescue specific classes and re-raise or log with context.
- Methods short (about 20 lines), one responsibility, no dead or commented-out code.

### Testing
- Tests first. RSpec when `spec/` exists, Minitest otherwise (follow the project convention).
- Request specs for endpoints (`spec/requests/api/...`), not only unit specs. Deterministic FactoryBot factories; no shared mutable state.
- Every bugfix gets a regression test.
- Stub external HTTP (WebMock/VCR) and Redis/AnyCable broadcasts; never hit real services.
- Use `travel_to` for time-dependent logic.

### Data & state
- Migrations are immutable after merge; add a new one to fix a mistake. Always reversible (`change` with reversible operations, or explicit `up`/`down`).
- `snake_case` tables and columns; explicit indexes on foreign keys and queried fields; `null: false` and DB-level constraints where the model validates.
- No N+1: use `includes`/`preload`/`eager_load`; add the `bullet` gem in development/test to catch regressions.
- Paginate any potentially large list; no implicit mutations in GET actions.
- No raw SQL when ActiveRecord covers the case; otherwise bind parameters or `sanitize_sql`.
- PostgreSQL/Supabase: enable Row Level Security on tables holding user data and write explicit policies; the Rails app role must not bypass RLS unintentionally. Check `structure.sql`/`schema.rb` diffs after migrating.
- Cache keys prefixed by feature, explicit TTLs, and a defined invalidation strategy.

### Security
- No secrets in code: `Rails.application.credentials` with `master.key` kept out of git, or `.env` ignored by git. If a secret is committed, rotate it.
- CSRF active on stateful (cookie/session) endpoints; token-authenticated API mode may skip it deliberately.
- CORS (`rack-cors`) with explicit origins; no `*` in production.
- Authorization with Pundit or CanCanCan on every protected action (`authorize`, `policy_scope`; add `verify_authorized` after-action). AuthN is not AuthZ.
- Run `brakeman` and `bundler-audit` before release; block CRITICAL advisories until upgraded.
- Filter sensitive params (`config.filter_parameters`); no PII, tokens or passwords in logs.

## Tools
| Capability | Provider | Type |
|---|---|---|
| `docs.library` | `context7` (Rails, AnyCable, Sidekiq, Supabase, PostgreSQL) | MCP |
| `app.run` | `run` | Skill |
| `review.diff` | `code-review` | Skill |
| `review.security` | `security-review` | Skill |
| `search.codebase` | `Explore` | Agent |
| `plan.implementation` | `Plan` | Agent |
| `memory.recall` / `memory.save` | `engram` | MCP |
| static analysis | `brakeman`, `bundler-audit`, `rubocop` (with `rubocop-rails`, `rubocop-rspec`), `bullet` | CLI / gems |

## Architecture fit
- `layered` (controllers, services, models, serializers) is the default for Rails APIs; keep dependencies pointing inward: controllers call services, services call models, never the reverse.
- For larger domains, map bounded contexts to namespaced folders or engines (`app/services/billing/`, `app/models/billing/`) rather than a generic `lib/` dump.
- Screaming-style folder naming applies to services and policies: name by domain action (`Conversations::AssignService`), not `Helper`/`Manager`.

## Anti-patterns
- Business logic in controllers or callbacks that call external systems.
- N+1 queries; unbounded list endpoints.
- `rescue Exception`, or swallowing errors silently.
- Editing a merged migration; irreversible migrations without a documented reason.
- `permit!`, missing authorization, or relying on the frontend for access control.
- Channels without authorization in `subscribed`; heavy work inline in channels.
- Mixing package managers (pnpm in a Rails repo).
- Bugfix without a regression test.

## Official docs
- Rails guides: https://guides.rubyonrails.org
- Rails API-only apps: https://guides.rubyonrails.org/api_app.html
- Rails security: https://guides.rubyonrails.org/security.html
- RSpec Rails: https://rspec.info/features/6-0/rspec-rails/
- RuboCop: https://docs.rubocop.org
- Brakeman: https://brakemanscanner.org
- AnyCable: https://docs.anycable.io
- Sidekiq: https://github.com/sidekiq/sidekiq/wiki
- Pundit: https://github.com/varvet/pundit
- PostgreSQL: https://www.postgresql.org/docs/
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
