---
name: dept-data
description: "Waymark · Data Engineering & State department. Use FIRST for schema, migrations, queries, indexes, caching, data models and client-side state in any stack: \"migración\", \"nueva tabla\", \"columna\", \"índice\", \"consulta lenta\", \"N+1\", \"cache\", \"Redis\", \"modelo\", \"store\", \"estado global\", \"persistencia\", database, SQL, ORM, seed. Loads the data rules and decides which skills and MCP servers to use. Not for trivial edits."
---

# Data Engineering & State Management

## Quick ref
**Mission:** Keep data correct, consistent and fast, from the database schema to the client-side store.
**Must:** migrations reversible and zero-downtime · index foreign keys and filtered columns · every cache has a key scheme, TTL and invalidation · single source of truth for client state · no secrets in client storage
**Skills by default:** library-docs · code-review · Explore · engram (MCP)
**DoD:** gates green · migration rollback tested · query plan checked · cache invalidation defined · state derived, not duplicated

## Entry
Run the *Waymark protocol → Entry* from the instructions file (already in context; do not load the `waymark` skill for it). Department-specific reads:
- Learnings: `~/.waymark/learnings/dept-data.md` if it exists.
- Stack profile: L1 *Commands* + *Data/State*, L2+ full.
- Tools: the **Tools** table below. Open `../waymark/skill-registry.md` only if a capability there has no installed provider.

## Brief questions
The brief must answer before the first edit:
1. **What** — which table/column/index/query/cache/store changes, and the exact shape (types, nullability, constraints, keys).
2. **Why / for whom** — which feature or measured problem (latency, N+1, inconsistency) it serves; for caches, the measurement that justifies it.
3. **Where** — migration, model, repository, cache and store locations per the architecture profile; who owns the data (one feature or shared).
4. **Change class** — additive or destructive; if destructive, the expand/contract steps and release in which each runs.
5. **Integrity & access** — constraints in the database, tenant/owner scoping, row-level policy, PII columns.
6. **Performance** — indexes needed, expected row counts, EXPLAIN plan, pagination strategy, lock risk on large tables.
7. **Consistency** — cache key scheme, TTL, invalidation trigger; client state owner, derived values, stale-event handling.
8. **How / done** — procedure below, skills and MCP chosen, rollback proof and tests (zero/one/many rows, hit/miss/invalidation).

## Scope
- Owns: schema design, migrations, indexes, constraints, query performance, row-level access rules as data policy, server caches, client state stores, derived state, client persistence, data models and types, seeds and fixtures.
- Does not own: endpoints and handlers → `dept-backend` · UI components → `dept-frontend` · authn/authz policy, secrets → `dept-security` · backups, DB provisioning → `dept-devops` · module boundaries → `dept-architecture`.

## Procedures
Detailed steps live in `procedures.md` (same folder). **Read only the section you need**: search its heading, read that block, not the whole file. Anti-patterns and references are at the end of that file.

- Schema migration
- New query or repository method
- Server cache
- Client state store
- Client persistence
- Bug fix (data or state)
- Refactor

## Rules
- **MUST** make every migration reversible, or document why it is irreversible and how to restore.
- **MUST** keep migrations zero-downtime: old code must run against the new schema during deploy.
- **MUST** index foreign keys and frequently filtered/sorted columns; add unique constraints for business uniqueness.
- **MUST** enforce integrity in the database (constraints) in addition to application validation.
- **MUST** use parameterized queries; no string-built SQL with input.
- **MUST** scope every query on multi-tenant or user-owned data by tenant/owner, via row-level policies or a mandatory query scope.
- **MUST** give every cache entry a namespaced key, explicit TTL and an invalidation trigger.
- **MUST** keep one source of truth per piece of client state; derive, do not duplicate.
- **SHOULD** follow the stack's naming convention (e.g. `snake_case` columns) and singular/plural consistently.
- **SHOULD** prefer the simplest reactive primitive; use stream libraries only for real event streams (sockets, debounced input, cancellation).
- **SHOULD** use soft delete or archival only when a requirement asks for it.
- **SHOULD** measure (EXPLAIN, profiler) before optimizing.
- **MUST NOT** edit or delete a migration already applied in a shared environment.
- **MUST NOT** store tokens, secrets or PII in browser storage.
- **MUST NOT** use loose types (`any`-like) in models; use precise types and narrow unknown input.
- **MUST NOT** run long data backfills inside a schema migration on large tables; use a batched job.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| docs.library | `library-docs` (→ the docs MCP servers the user has) | ORM, migration DSL, DB engine, cache client, store/reactivity API not verified this session | Q |
| memory | `engram` (MCP) | `mem_search` before re-reading schema; `mem_save` after a data-model decision | L1 |
| search.codebase | `Explore` (agent) | Find all readers/writers of a table, cache key or store (mandatory for destructive changes) | L1 |
| review.diff | `code-review` | Before declaring done | L2 |
| plan.implementation | `Plan` (agent) | Destructive migration, new store architecture | L3 |
| db.inspect (live schema, EXPLAIN) | none yet → waymark `references/skills.md` | Inspect the real database or query plan | L2 |

## Definition of Done
- [ ] Exit protocol of `waymark` (instructions file → Exit; L2+ full: `../waymark/references/protocol.md`) (gates, architecture conformance, review, learnings)
- [ ] Migration applied, rolled back and re-applied locally
- [ ] Destructive change split into expand/contract steps
- [ ] Indexes on new foreign keys and filtered columns; EXPLAIN checked for new heavy queries
- [ ] Row-level access defined for user/tenant data
- [ ] Cache: key scheme, TTL and invalidation documented in code
- [ ] Client state: single source of truth, derived values computed, loading/error/empty handled
- [ ] No token, secret or PII in client storage or in the diff

## Hand-offs
- To `dept-backend`: endpoint changes required by the schema; job for backfills.
- To `dept-security`: row-level policies, PII columns, encryption at rest, data retention.
- To `dept-frontend`: store API or model type changes consumed by UI.
- To `dept-devops`: migration ordering in deploy, backups before destructive change, cache infra.
- To `dept-architecture`: where models/stores live, cross-feature shared state.
- To `dept-qa`: data fixtures, migration test strategy.

## Learned rules

_Grows with use (waymark `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
