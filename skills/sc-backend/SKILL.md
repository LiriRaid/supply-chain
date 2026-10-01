---
name: sc-backend
description: "Supply chain · Backend Engineering department. Use FIRST whenever the user asks to build or change server-side code in any language or framework: \"crear un endpoint\", \"nueva API\", \"webhook\", \"servicio\", \"job en background\", \"cola\", \"canal en tiempo real\", \"websocket\", \"integración con un proveedor\", controller, service, REST, GraphQL, worker, cron, realtime. Loads the backend rules (what, why, where, how) and decides which skills and MCP servers to use. Not for trivial edits."
---

# Backend Engineering

## Quick ref
**Mission:** Ship server logic and APIs that are correct, validated at the boundary, observable and backward compatible.
**Must:** validate input at the boundary · thin handlers, logic in services · paginate lists, no N+1 · uniform error envelope · request/integration test per endpoint
**Skills by default:** library-docs · code-review · run · Explore · engram (MCP)
**DoD:** gates green · request test per endpoint · contract unchanged or versioned · no N+1 · jobs idempotent · no secret in diff

## Entry
Run the *Supply chain protocol → Entry* from the instructions file (already in context; do not load the `supply-chain` skill for it). Department-specific reads:
- Learnings: `~/.supply-chain/learnings/sc-backend.md` if it exists.
- Stack profile: L1 *Commands* + *Backend*, L2+ full.
- Tools: the **Tools** table below. Open `../supply-chain/skill-registry.md` only if a capability there has no installed provider.

## Brief questions
The brief must answer before the first edit:
1. **What** — which endpoint/job/channel/integration, and its contract: method + path (or event/topic), request schema, response schema, status and error codes.
2. **Why / for whom** — which consumer (frontend screen, third party, internal job) and which acceptance criterion it satisfies.
3. **Where** — handler, service, validator and test locations per the architecture profile; which existing resource it mirrors.
4. **Authn / authz** — who may call it, how identity is established, which ownership/tenant check applies.
5. **Consistency** — transaction boundary, idempotency (key, upsert, state check), behavior on retry or duplicate delivery.
6. **Compatibility** — additive or breaking; versioning strategy; consumers to inform.
7. **Observability & limits** — logs with request ID, timeouts on outbound calls, pagination max, rate limits.
8. **How / done** — procedure below, skills and MCP chosen, and which tests prove it done.

## Scope
- Owns: API design and contracts, request handlers, services/use cases, background jobs, webhooks, realtime channels, server-side validation, error handling, integrations with external APIs.
- Does not own: schema, indexes, caching strategy → `sc-data` · authn/authz policy, secrets, threat model → `sc-security` · deploy, infra, CI → `sc-devops` · module boundaries → `sc-architecture` · test strategy → `sc-qa`.

## Procedures
Detailed steps live in `procedures.md` (same folder). **Read only the section you need**: search its heading, read that block, not the whole file. Anti-patterns and references are at the end of that file.

- New endpoint
- New background job
- Realtime channel / websocket
- Webhook receiver
- Schema change (backend side)
- Bug fix
- Refactor

## Rules
- **MUST** validate and type every external input (body, query, params, headers, webhook payloads) at the boundary with an allowlist.
- **MUST** keep handlers thin: parse, authorize, delegate, respond.
- **MUST** return a uniform error envelope (e.g. `{ "error": { "code", "message", "details" } }`) with correct HTTP status codes.
- **MUST** paginate any list that can grow, with a server-enforced maximum page size.
- **MUST** avoid N+1 queries; eager-load or batch.
- **MUST** wrap multi-write operations in a transaction; keep external calls outside it.
- **MUST** make jobs, webhook handlers and retryable POSTs idempotent.
- **MUST** set timeouts on every outbound HTTP/DB/queue call.
- **MUST** version breaking contract changes (path or header); only additive changes within a version.
- **MUST** enforce authorization on the server for every protected resource and channel.
- **SHOULD** follow REST semantics: GET safe and idempotent, PUT/DELETE idempotent, POST for creation.
- **SHOULD** return `201` with location on create, `204` on empty success, `409` on conflict, `429` on rate limit.
- **SHOULD** log with correlation/request IDs and structured fields; no PII.
- **SHOULD** move slow work (>~200 ms, external calls, fan-out) out of the request cycle.
- **SHOULD** keep functions short and single-purpose; no God services.
- **MUST NOT** mutate state in GET handlers.
- **MUST NOT** swallow exceptions with catch-alls; catch specific errors or re-raise.
- **MUST NOT** build SQL or shell commands by concatenating input.
- **MUST NOT** hardcode secrets, URLs or credentials; read from configuration.
- **MUST NOT** change a published response shape without versioning.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| docs.library | `library-docs` (→ the docs MCP servers the user has) | Any framework/ORM/queue API not verified this session; always for new APIs at L2+ | Q |
| memory | `engram` (MCP) | `mem_search` before re-reading a resource; `mem_save` after a non-obvious decision | L1 |
| search.codebase | `Explore` (agent) | Pattern lookup across >3 locations | L1 |
| claude.api | `claude-api` | Code that calls the Claude / Anthropic API | L1 |
| app.run | `run` | Endpoint touches external I/O, realtime or jobs | L2 |
| review.diff | `code-review` | Before declaring done | L2 |
| plan.implementation | `Plan` (agent) | New module, cross-cutting change | L3 |
| contract.testing / API spec lint | none yet → supply-chain `references/skills.md` | OpenAPI/GraphQL schema validation | L2 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` (instructions file → Exit; L2+ full: `../supply-chain/references/protocol.md`) (gates, architecture conformance, review, learnings)
- [ ] Every new/changed endpoint has a request/integration test (success + 4xx paths)
- [ ] Input validated at the boundary; unknown fields rejected
- [ ] Contract unchanged, additive or versioned; consumers informed (`sc-frontend`)
- [ ] No N+1 on list endpoints; lists paginated
- [ ] Jobs/webhooks idempotent and tested for retry
- [ ] Errors use the uniform envelope; no stack traces to clients
- [ ] No secret, token or PII in diff or logs

## Hand-offs
- To `sc-data`: new table/column/index, query performance, caching, migration design.
- To `sc-security`: new auth flow, public endpoint, file upload, PII, payments, webhooks, CORS change.
- To `sc-frontend`: contract change, new error codes, realtime payload change.
- To `sc-qa`: test strategy for complex flows, flaky tests.
- To `sc-devops`: new env var, queue/worker process, scheduled job, infra dependency.
- To `sc-architecture`: new module or boundary, cross-module dependency.
- To `sc-product`: unclear acceptance criteria or scope.

## Learned rules

_Grows with use (supply-chain `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
