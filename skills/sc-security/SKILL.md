---
name: sc-security
description: "Supply chain · Security / DevSecOps department. Use FIRST for authentication, authorization, secrets, input validation and dependency risk: \"login\", \"permisos\", \"roles\", \"JWT\", \"proteger una ruta\", \"CORS\", \"CSRF\", \"variables de entorno\", \"API key\", \"vulnerabilidad\", \"auditoría de dependencias\", RLS, OWASP, encryption. Also the supporting department whenever a feature touches user data or auth. Loads the security rules and decides which skills and MCP servers to use."
---

# Security / DevSecOps

## Quick ref
**Mission:** Prevent exploitable defects and secret leaks in every change, and make security checks part of the normal flow.
**Must:** zero secrets in code or logs · authorize on the server for every protected resource · validate input at every boundary · run the stack's dependency audit · threat-model at L3
**Skills by default:** security-review · code-review · library-docs · Explore
**DoD:** gates green · `security-review` clean or findings resolved · no secret in diff · authz tests for 401/403 · audit has no high/critical

## Entry
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3): project memory `~/.supply-chain/projects/<slug>.md` · stack profile `../supply-chain/stacks/<stack>.md` (L1: *Commands* (audit) + *Security*; L2+: full) · architecture profile `../supply-chain/architectures/<arch>.md` (L2+) · learnings `~/.supply-chain/learnings/sc-security.md` · registry `../supply-chain/skill-registry.md` section `## sc-security` · brief. At L2+ also read the auth middleware/guards and config files touched by the change.

## Brief questions
The brief must answer before the first edit:
1. **What** — which asset is protected (route, query, channel, file, secret, dependency) and which trust boundaries the change crosses.
2. **Why / for whom** — which actors (anonymous, user, admin, tenant, third party) and which threat or requirement drives it.
3. **Where** — where authn, authz, validation and secrets live per the architecture profile and stack profile; which existing guard/policy is reused.
4. **Identity & access** — how identity is established, token/session lifetime and storage, deny-by-default rule, ownership/tenant check.
5. **Input & output** — validation allowlist per entry point, output encoding context, size/rate limits.
6. **Secrets & data** — which secrets are involved and where they are read from; PII touched; logging exclusions.
7. **Dependencies & config** — new packages, install scripts, CORS/CSRF/CSP/header changes.
8. **How / done** — procedure below, skills and MCP chosen, and the tests proving 401/403/cross-tenant, plus threat model at L3.

## Scope
- Owns: authn/authz design, secrets handling, input/output safety, CORS/CSRF/CSP, security headers, dependency and supply-chain risk, security logging, threat modeling, agent tool permissions.
- Does not own (security reviews, they implement): endpoint implementation → `sc-backend` · schema and data policy implementation → `sc-data` · CI and infra hardening → `sc-devops` · UI → `sc-frontend`.

## Procedure

### Security review of a change (L2+ with security impact)
1. List the trust boundaries the diff crosses: client→server, server→DB, server→third party, inbound webhook, file system.
2. Per boundary check: input validation, authn, authz, output encoding, error handling, logging.
3. Run `security-review` on the pending changes. Verify each finding technically; do not accept or dismiss blindly.
4. Grep the diff for secrets (keys, tokens, passwords, connection strings, private keys).
5. Fix or hand off findings; record accepted risks in the closing report.

### New or changed auth flow
1. Use the framework's vetted auth mechanism from the stack profile; never hand-roll crypto or session handling.
2. Passwords: slow adaptive hash (argon2id, bcrypt, scrypt). Tokens: short-lived access, rotated refresh, server-side revocation.
3. Browser tokens in HttpOnly, Secure, SameSite cookies, not in browser storage.
4. Authorize per request on the server: deny by default, check ownership/tenant, not just "logged in".
5. Tests: unauthenticated (401), wrong user/tenant (403), expired/revoked token, privilege escalation attempt.
6. Rate-limit login, reset and token endpoints; respond identically for unknown user and wrong password.

### Secrets handling
1. Read secrets from environment variables or the stack's encrypted secret store (stack profile).
2. Secret files (`.env`, key files, local config) in `.gitignore`; commit only an example file with placeholders.
3. If a secret was committed or logged: rotate it first, then purge history. Tell the user immediately.

### Dependency audit
1. Run the stack's audit command (stack profile → *Commands*).
2. Block on critical/high with a known fix: upgrade or patch. No-fix findings: document exposure and mitigation.
3. New dependency: check maintenance, adoption, license, install scripts. Never approve install/build scripts without reading them.
4. Commit lockfiles; pin versions per the stack convention.

### Threat model (L3, or new external surface)
1. Describe the data flow in 5–10 lines: actors, entry points, data stores, trust boundaries.
2. Apply STRIDE per entry point: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.
3. Per credible threat: threat, impact (low/med/high), mitigation, owner department.
4. Turn high-impact mitigations into acceptance criteria and tests before coding.
5. Include the table in the plan and the closing report.

### Security bug fix
1. Reproduce with a failing test demonstrating the exploit (no real secrets or production data).
2. Fix the root cause at the boundary, not only the reported payload.
3. Search for the same pattern across the codebase (`Explore`).
4. Keep the test as a regression guard.

## Rules
Mapped to OWASP Top 10 (2021) and ASVS chapters.
- **MUST** enforce authorization server-side on every protected route, query and realtime subscription; deny by default (A01 · V4/V8).
- **MUST** scope user/tenant data by row-level authorization: database policies or a mandatory query scope (A01).
- **MUST** use TLS for all external traffic and vetted crypto libraries; no custom crypto, no weak password hashes (A02 · V6/V9).
- **MUST** validate input at every boundary with allowlists and parameterized queries; never pass input to eval, shell or template compilation (A03 · V5).
- **MUST** encode output for its context; no raw HTML injection APIs or sanitizer bypasses with untrusted data (A03 · V5).
- **MUST** rate-limit authentication and expensive endpoints and cap request/upload sizes (A04 · V11).
- **MUST** configure CORS with an explicit origin allowlist in production; no wildcard with credentials (A05 · V14).
- **MUST** enable CSRF protection on cookie-authenticated state-changing requests (A05 · V13).
- **SHOULD** set a Content-Security-Policy and security headers (HSTS, X-Content-Type-Options, frame-ancestors) in production (A05 · V14).
- **MUST** keep dependencies audited and patched; no high/critical with an available fix at release (A06 · V14).
- **MUST** use proven session/token handling; tokens in HttpOnly cookies; rotate on privilege change; enforce expiry (A07 · V2/V3).
- **MUST** verify integrity of webhooks (signatures) and of CI artifacts (A08 · V10).
- **MUST** log security events (login, failed authz, admin actions) with request IDs; never log secrets, tokens, passwords or PII (A09 · V7).
- **MUST** restrict outbound requests built from user input (allowlist hosts, block internal ranges) (A10 · V12).
- **MUST** return generic error messages to clients; stack traces only in server logs.
- **MUST NOT** commit secrets, private keys or credential files.
- **MUST NOT** rely on client-side checks for security decisions.
- **MUST NOT** widen agent tool permissions to destructive commands (force push, hard reset, recursive delete, privilege escalation); confirm destructive actions with the user.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| docs.library | `library-docs` (→ angular-cli / primeng / context7 MCP) | Framework security APIs (auth, CSRF, CSP, sanitization) not verified this session | Q |
| memory | `engram` (MCP) | `mem_save` security decisions and vulnerability root causes | L1 |
| search.codebase | `Explore` (agent) | Find every instance of a vulnerable pattern | L1 |
| config.claude | `update-config` | Adjust agent permissions (allow/deny lists) | L1 |
| review.security | `security-review` | Changes touch auth, input, secrets, config, dependencies, uploads, webhooks (L3 always) | L2 |
| review.diff | `code-review` | Correctness bugs that are also security bugs | L2 |
| plan.implementation | `Plan` (agent) | Threat model and mitigation plan | L3 |
| secret.scan / dependency.audit tooling | none yet → supply-chain §5 | Automated secret scanning or SCA beyond the stack audit command | L2 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] `security-review` run; findings fixed or accepted with reason
- [ ] No secret, token, key or PII in the diff, fixtures or logs
- [ ] Authz tests cover 401, 403 and cross-tenant access for new protected resources
- [ ] Stack audit command shows no high/critical with an available fix
- [ ] CORS/CSRF/CSP config reviewed if touched
- [ ] Threat model table present (L3)

## Anti-patterns
- "The frontend already hides the button" as authorization.
- Tokens in browser storage without justification.
- Sanitizer bypass or raw HTML with user content.
- Catch-all handlers that swallow auth or validation failures.
- Wildcard CORS with credentials.
- Logging full request bodies or headers.
- Rotating a leaked secret "later".
- Approving dependency install scripts without reading them.
- Allowlisting destructive commands for the agent to save prompts.

## Hand-offs
- To `sc-backend`: implement validation, authz checks, rate limits, webhook verification.
- To `sc-data`: row-level policies, PII columns, encryption, retention.
- To `sc-frontend`: output encoding, token storage, CSP compatibility.
- To `sc-devops`: secret store, CI secret scanning, security headers at the edge, dependency update automation.
- To `sc-devex`: agent permission changes.
- To `sc-qa`: security regression tests.
- To `sc-architecture`: trust boundary changes from the threat model.

## References
- OWASP Top 10 (2021) — owasp.org/Top10
- OWASP API Security Top 10 (2023)
- OWASP ASVS — owasp.org/www-project-application-security-verification-standard
- OWASP Cheat Sheet Series — cheatsheetseries.owasp.org
- NIST SSDF SP 800-218 · ISO/IEC 27001:2022
- STRIDE threat modeling (Microsoft)
- Framework security guides: `../supply-chain/stacks/<stack>.md` → *References*

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
