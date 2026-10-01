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
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3): project memory `~/.supply-chain/projects/<slug>.md` · stack profile `../supply-chain/stacks/<stack>.md` (L1: *Commands* + *Backend*; L2+: full) · architecture profile `../supply-chain/architectures/<arch>.md` (L2+) · learnings `~/.supply-chain/learnings/sc-backend.md` · registry `../supply-chain/skill-registry.md` section `## sc-backend` · brief. At L2+ also read the existing handler/service for the nearest resource and copy its pattern.

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

## Procedure

### New endpoint
1. Write the contract first: method, path, request/response schema, status codes, error codes, auth requirement. Missing acceptance criteria → `sc-product`.
2. Locate where handlers, services and validators live per the architecture profile. Mirror the nearest existing resource.
3. Write a failing request/integration test: success, validation error (400/422), unauthenticated (401), unauthorized (403), not found (404).
4. Define the input schema/validator at the boundary with the mechanism named in the stack profile. Allowlist fields; reject unknown ones.
5. Implement the handler: parse, authorize, call one service, map result to response. No business logic in the handler.
6. Implement the service: business rules, transaction boundary, domain errors.
7. List endpoints: pagination (cursor or limit/offset with a max), stable ordering, eager-loaded associations. Check the query log for N+1.
8. Map domain errors to the uniform error envelope. Never leak stack traces.
9. If it touches external I/O, launch the app (`run`) and hit the endpoint once.
10. Public endpoint, PII, files or payments → `sc-security`.

### New background job
1. Decide why it is async: latency, retries, fan-out or scheduling. If none apply, keep it synchronous.
2. Payload: IDs and primitives only, never full objects or secrets.
3. Make it idempotent: idempotency key, upsert or state check, so a retry produces the same result.
4. Retries with backoff and a max attempt count; define and log the dead-letter / failure path.
5. Enqueue after the transaction commits, never inside it.
6. Test: runs once, runs twice (same result), fails and retries. Use the queue adapter and test helpers from the stack profile.

### Realtime channel / websocket
1. Authenticate the connection (token or session) before accepting it.
2. Authorize every subscription against the requested resource (tenant, owner, membership). Reject by default.
3. Broadcast from services or jobs, not inline in handlers. Payloads contain only what the subscriber may see.
4. Test: authorized subscribe, unauthorized subscribe rejected, payload shape. Stub the pub/sub backend per the stack profile.

### Webhook receiver
1. Verify the signature (HMAC or provider mechanism) before parsing the body; reject on mismatch.
2. Respond 2xx quickly; push processing to a job.
3. Deduplicate by provider event ID.
4. Test valid signature, invalid signature, duplicate delivery.

### Schema change (backend side)
1. Hand the schema design to `sc-data` and follow its *Schema migration* procedure.
2. Keep handlers/services working with both old and new schema during rollout (expand, migrate, contract).

### Bug fix
1. Reproduce with a failing test at the lowest level that shows the bug (request test for contract bugs, unit test for logic).
2. State the root cause in one line before editing.
3. Apply the smallest fix; keep the regression test.
4. Search for the same pattern elsewhere (`Explore` if >3 locations).

### Refactor
1. Confirm request/integration tests cover the behavior; add characterization tests if not.
2. Change structure only; responses, status codes and side effects stay identical.
3. L3: `Plan` agent first, follow `sc-architecture` dependency rules.

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
| docs.library | `library-docs` (→ angular-cli / primeng / context7 MCP) | Any framework/ORM/queue API not verified this session; always for new APIs at L2+ | Q |
| memory | `engram` (MCP) | `mem_search` before re-reading a resource; `mem_save` after a non-obvious decision | L1 |
| search.codebase | `Explore` (agent) | Pattern lookup across >3 locations | L1 |
| claude.api | `claude-api` | Code that calls the Claude / Anthropic API | L1 |
| app.run | `run` | Endpoint touches external I/O, realtime or jobs | L2 |
| review.diff | `code-review` | Before declaring done | L2 |
| plan.implementation | `Plan` (agent) | New module, cross-cutting change | L3 |
| contract.testing / API spec lint | none yet → supply-chain §5 | OpenAPI/GraphQL schema validation | L2 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] Every new/changed endpoint has a request/integration test (success + 4xx paths)
- [ ] Input validated at the boundary; unknown fields rejected
- [ ] Contract unchanged, additive or versioned; consumers informed (`sc-frontend`)
- [ ] No N+1 on list endpoints; lists paginated
- [ ] Jobs/webhooks idempotent and tested for retry
- [ ] Errors use the uniform envelope; no stack traces to clients
- [ ] No secret, token or PII in diff or logs

## Anti-patterns
- Business logic in handlers or ORM callbacks with hidden side effects.
- "The frontend already validates" as a reason to skip server validation or authorization.
- Unbounded `findAll` behind a list endpoint.
- Enqueuing a job inside a transaction that may roll back.
- Retrying non-idempotent operations.
- Broadcasting full records to channels without filtering by permission.
- Catch-all exception handlers that return 200.
- No regression test after a bug fix.

## Hand-offs
- To `sc-data`: new table/column/index, query performance, caching, migration design.
- To `sc-security`: new auth flow, public endpoint, file upload, PII, payments, webhooks, CORS change.
- To `sc-frontend`: contract change, new error codes, realtime payload change.
- To `sc-qa`: test strategy for complex flows, flaky tests.
- To `sc-devops`: new env var, queue/worker process, scheduled job, infra dependency.
- To `sc-architecture`: new module or boundary, cross-module dependency.
- To `sc-product`: unclear acceptance criteria or scope.

## References
- SWEBOK v4 — Software Construction, Software Design
- ISO/IEC 25010:2023 — product quality model
- RFC 9110 (HTTP Semantics), RFC 9457 (Problem Details for HTTP APIs)
- OWASP API Security Top 10 (2023)
- Stack-specific docs: `../supply-chain/stacks/<stack>.md` → *References*

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
