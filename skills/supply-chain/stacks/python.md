# Stack: Python (Django, FastAPI, Flask)

## Detect
Signals the agent checks (supply-chain §6): `pyproject.toml`, `requirements.txt`, `setup.py`/`setup.cfg`, `Pipfile`, `uv.lock` or `poetry.lock`. Framework hints: `manage.py` (Django), `fastapi` dependency (FastAPI), `flask` dependency (Flask).

## Commands
Default commands the agent runs in the Exit protocol; verify each once, then record it in project memory. `{files}` = changed files.

Runner prefix: `uv run ` if `uv.lock` exists, `poetry run ` if `poetry.lock` exists, otherwise none (use the active virtualenv).

| Gate | Command | Notes |
|---|---|---|
| typecheck | `<prefix>mypy .` | Only if mypy is configured (`mypy.ini`, or `[tool.mypy]` in `pyproject.toml`). Pyright is a valid alternative but not a default |
| lint | `<prefix>ruff check {files}` | Only if ruff is configured (`ruff.toml`, `.ruff.toml`, or `[tool.ruff]`) |
| test | `<prefix>pytest -q` | Only if pytest is present; non-watch |
| build | none | Libraries may add `uv build` / `poetry build` in project memory |
| format | `<prefix>ruff format {files}` | Not a gate |

Other useful commands (not gates): `uv sync`, `poetry install`, `python manage.py check`, `python manage.py makemigrations --check`, `uvicorn app.main:app --reload`, `flask --app app run`, `pip-audit`.

Project memory example (Quality gates, verified commands):

| Gate | Command | Verified |
|---|---|---|
| typecheck | `uv run mypy src` | <date> |
| lint (changed files) | `uv run ruff check {files}` | <date> |
| test (full) | `uv run pytest -q -x` | <date> |
| build | `uv run python manage.py check` | <date> |

## Conventions by department
Only what is specific to Python. General rules live in the `sc-*` department skills (`sc-backend`, `sc-data`, `sc-security`, `sc-qa`).

### Frontend / Backend
- Use the project's package manager consistently: `uv` or `poetry` when a lockfile exists; never mix `pip install` into a managed environment. Commit the lockfile.
- Target the Python version pinned in `pyproject.toml` (`requires-python`); use type hints on all public functions.
- Django: fat models are acceptable only for data rules; put orchestration in service modules. Use `select_related`/`prefetch_related` to avoid N+1. Settings split by environment, secrets from environment variables.
- FastAPI: Pydantic models for request/response schemas, `Depends` for injection (db session, current user), `async def` only when the whole call chain is non-blocking. Routers per domain.
- Flask: application factory pattern, blueprints per domain, config objects, no module-level global state.
- Keep modules importable without side effects; no work at import time.
- Prefer `pathlib`, `dataclasses`/Pydantic models, and context managers for resources. No bare `except:`; catch specific exceptions.

### Testing
- pytest with fixtures in `conftest.py`; function-style tests, parametrize with `@pytest.mark.parametrize`.
- Django: `pytest-django` with `@pytest.mark.django_db`; FastAPI: `TestClient`/`httpx.AsyncClient`; Flask: `app.test_client()`.
- Mock only external boundaries (HTTP, clock, queues); use `freezegun`/`time-machine` for time.
- Every bugfix gets a regression test. Keep tests deterministic and independent of order.

### Data & state
- Migrations: Django `makemigrations` committed and never edited after merge; Alembic (FastAPI/Flask with SQLAlchemy) with reviewed autogenerate output and working `downgrade`.
- Use transactions explicitly for multi-step writes (`transaction.atomic`, SQLAlchemy `session.begin()`).
- Index foreign keys and queried columns; paginate list endpoints.
- SQLAlchemy 2.x style (`select()`), sessions scoped per request; avoid lazy-load N+1 with `selectinload`/`joinedload`.
- Never build SQL with f-strings; use ORM or bound parameters.

### Security
- Secrets from environment or a secrets manager; `.env` ignored by git. `DEBUG=False` and explicit `ALLOWED_HOSTS` in production (Django).
- Django: keep CSRF middleware enabled for session endpoints; configure CORS (`django-cors-headers`, FastAPI `CORSMiddleware`) with explicit origins, no `*` in production.
- Validate all input at the boundary (Pydantic, Django forms/serializers). Authorization checked per endpoint, not only authentication.
- No `eval`/`exec`/`pickle.loads` on untrusted input; use `yaml.safe_load`, `subprocess` with argument lists (no `shell=True`).
- Run `pip-audit` (or `uv pip audit`) and `bandit` before release.

## Tools
| Capability | Provider | Type |
|---|---|---|
| `docs.library` | `context7` (Django, FastAPI, Flask, SQLAlchemy, Pydantic, pytest, ruff) | MCP |
| `app.run` | `run` | Skill |
| `review.diff` | `code-review` | Skill |
| `review.security` | `security-review` | Skill |
| `search.codebase` | `Explore` | Agent |
| `plan.implementation` | `Plan` | Agent |
| static analysis | `ruff`, `mypy`/`pyright`, `bandit`, `pip-audit` | CLI |

## Architecture fit
- `layered` is the common default: routers/views, services, repositories/models, schemas. Dependencies point inward; views never talk to the DB driver directly.
- Django apps map to bounded contexts (one app per domain, named after the domain, not `core`/`utils`). FastAPI: `app/<domain>/{router,service,schemas,models}.py` fits a screaming layout.
- Hexagonal fits well for FastAPI services: ports as `Protocol` classes, adapters injected via `Depends`.

## Anti-patterns
- Mutable default arguments; bare `except:`; `except Exception: pass`.
- Blocking calls (requests, sync DB) inside `async def` handlers.
- Business logic in views/route handlers or in Django signals with side effects.
- N+1 queries; unbounded list endpoints.
- Editing merged migrations; `makemigrations` output committed without review.
- Mixing `pip install` with `uv`/`poetry` managed environments.
- Tests that depend on execution order, network, or wall-clock time.
- `shell=True`, `pickle` or `eval` with external data; hardcoded secrets.

## Official docs
- Python: https://docs.python.org/3/
- Django: https://docs.djangoproject.com
- FastAPI: https://fastapi.tiangolo.com
- Flask: https://flask.palletsprojects.com
- uv: https://docs.astral.sh/uv/
- Poetry: https://python-poetry.org/docs/
- pytest: https://docs.pytest.org
- Ruff: https://docs.astral.sh/ruff/
- mypy: https://mypy.readthedocs.io
- Pyright: https://microsoft.github.io/pyright/
- SQLAlchemy: https://docs.sqlalchemy.org
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
