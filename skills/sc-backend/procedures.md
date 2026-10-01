# sc-backend · Procedures

Loaded on demand from `SKILL.md` → *Procedures*. Read only the section the task needs.

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

## Anti-patterns
- Business logic in handlers or ORM callbacks with hidden side effects.
- "The frontend already validates" as a reason to skip server validation or authorization.
- Unbounded `findAll` behind a list endpoint.
- Enqueuing a job inside a transaction that may roll back.
- Retrying non-idempotent operations.
- Broadcasting full records to channels without filtering by permission.
- Catch-all exception handlers that return 200.
- No regression test after a bug fix.

## References
- SWEBOK v4 — Software Construction, Software Design
- ISO/IEC 25010:2023 — product quality model
- RFC 9110 (HTTP Semantics), RFC 9457 (Problem Details for HTTP APIs)
- OWASP API Security Top 10 (2023)
- Stack-specific docs: `../supply-chain/stacks/<stack>.md` → *References*
