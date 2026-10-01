# Stack: Java (Spring Boot; Kotlin note)

## Detect
Signals the agent checks (supply-chain §6): `pom.xml` (Maven) or `build.gradle` / `build.gradle.kts` / `settings.gradle*` (Gradle). Spring Boot is indicated by `spring-boot-starter-*` dependencies or the Spring Boot plugin. Prefer the wrapper (`./gradlew`, `./mvnw`) when present.

## Commands
Default commands the agent runs in the Exit protocol; verify each once, then record it in project memory. Pick Maven or Gradle from the build file found.

| Gate | Maven | Gradle | Notes |
|---|---|---|---|
| typecheck | none | none | Compilation happens as part of test/build |
| lint | none by default | `./gradlew check -x test` | Runs Checkstyle/Spotless/static analysis wired into `check` without tests; Maven users record their own command in project memory |
| test | `mvn -q test` | `./gradlew test` | Non-watch |
| build | `mvn -q -DskipTests package` | `./gradlew build -x test` | Produces the jar |
| format | `mvn spotless:apply` | `./gradlew spotlessApply` | Not a gate |

Other useful commands (not gates): `mvn -q verify` (adds integration tests), `mvn dependency:tree`, `./gradlew dependencies`, `./gradlew bootRun`, `mvn spring-boot:run`, `mvn org.owasp:dependency-check-maven:check`.

Project memory example (Maven with Spotless and Checkstyle; Quality gates, verified commands):

| Gate | Command | Verified |
|---|---|---|
| typecheck | none | |
| lint (changed files) | `mvn -q spotless:check checkstyle:check` | <date> |
| test (full) | `mvn -q test` | <date> |
| build | `mvn -q -DskipTests package` | <date> |

Gradle variant: lint `./gradlew spotlessCheck checkstyleMain`, test `./gradlew test`, build `./gradlew build -x test`.

## Conventions by department
Only what is specific to Java. General rules live in the `sc-*` department skills (`sc-backend`, `sc-data`, `sc-security`, `sc-qa`).

### Frontend / Backend
- Layering in Spring Boot: `controller` (HTTP only) -> `service` (use cases, transactions) -> `repository` (Spring Data). Controllers never touch repositories directly.
- Constructor injection only (single constructor, no `@Autowired` on fields); mark dependencies `final`.
- Expose DTOs (Java `record`s) at the API boundary, never JPA entities. Map with MapStruct or explicit mappers.
- Validate with Bean Validation (`@Valid`, `@NotNull`, `@Size`) at controllers; centralize error responses with `@RestControllerAdvice` returning a uniform error body and correct HTTP codes.
- Configuration via `application.yml` and `@ConfigurationProperties`; profiles for environments; no hardcoded URLs or secrets.
- Use `Optional` for return values only, not fields or parameters. Prefer immutability, records, and `var` sparingly.
- Keep methods short and single-purpose; no `catch (Exception e) {}` or swallowed exceptions.
- Kotlin note: for Kotlin projects the same Gradle/Maven gates apply; add `ktlint` or `detekt` (`./gradlew ktlintCheck detekt`) as lint, use data classes for DTOs, and the Spring Kotlin plugins (`kotlin-spring`, `kotlin-jpa`) so classes are open for proxies.

### Testing
- JUnit 5 (`@Test`, `@ParameterizedTest`, `@Nested`) with AssertJ assertions and Mockito for collaborators.
- Slice tests for speed: `@WebMvcTest` (controllers), `@DataJpaTest` (repositories), `@JsonTest`; full `@SpringBootTest` only for integration paths.
- Use Testcontainers for PostgreSQL and other real dependencies in integration tests instead of H2 when behavior must match production.
- Name tests by behavior; arrange-act-assert; no shared mutable state. Every bugfix gets a regression test.
- Unit tests end in `Test` (Surefire), integration tests in `IT` (Failsafe) when separated.

### Data & state
- Schema changes via Flyway or Liquibase; migration files immutable after merge, versioned and reversible where the tool supports it. Do not rely on `spring.jpa.hibernate.ddl-auto=update` outside local development.
- Avoid N+1: `@EntityGraph`, `JOIN FETCH`, or projections; set `spring.jpa.open-in-view=false`.
- `@Transactional` on service methods (not controllers); read-only transactions for queries.
- Index foreign keys and queried columns; paginate with `Pageable`.
- Parameterized queries only (`@Query` with named parameters); never concatenate SQL.

### Security
- Spring Security with explicit authorization rules (`SecurityFilterChain`, `@PreAuthorize`); deny by default. Keep CSRF enabled for session-based apps; configure CORS with explicit origins.
- Secrets from environment, Vault or the platform secrets store; never in `application.yml` committed to git.
- Do not expose Actuator endpoints publicly beyond `health`/`info`; secure the rest.
- Run OWASP Dependency-Check or `mvn versions:display-dependency-updates`/Dependabot for vulnerable dependencies.
- No sensitive data in logs; do not log full request bodies.

## Tools
| Capability | Provider | Type |
|---|---|---|
| `docs.library` | `context7` (Spring Boot, Spring Data, Hibernate, JUnit, Testcontainers) | MCP |
| `app.run` | `run` | Skill |
| `review.diff` | `code-review` | Skill |
| `review.security` | `security-review` | Skill |
| `search.codebase` | `Explore` | Agent |
| `plan.implementation` | `Plan` | Agent |
| static analysis | Checkstyle, Spotless, SpotBugs, PMD, OWASP Dependency-Check | Maven/Gradle plugins |

## Architecture fit
- `layered` (controller, service, repository) is the Spring default and the usual fit; keep dependencies one-directional.
- `hexagonal` works well for larger services: `domain` (pure Java), `application` (use cases, ports), `adapter.in.web` / `adapter.out.persistence`. Enforce with ArchUnit tests.
- Package-by-feature (`com.acme.orders`, `com.acme.billing`) is preferred over package-by-layer for screaming structure; each feature holds its own controller, service and repository.

## Anti-patterns
- Returning JPA entities from controllers; leaking lazy-loading issues into JSON.
- Field injection with `@Autowired`; circular dependencies.
- Business logic in controllers or entities' lifecycle callbacks.
- `ddl-auto=update` in production; editing merged Flyway migrations.
- `catch (Exception e)` that hides failures; checked exceptions wrapped in nothing.
- Open-in-view left on; N+1 from lazy collections in loops.
- Full `@SpringBootTest` for every test; H2 hiding PostgreSQL-specific behavior.
- Mixing Maven and Gradle commands in the same project.

## Official docs
- Spring Boot reference: https://docs.spring.io/spring-boot/reference/
- Spring Framework: https://docs.spring.io/spring-framework/reference/
- Spring Data JPA: https://docs.spring.io/spring-data/jpa/reference/
- Spring Security: https://docs.spring.io/spring-security/reference/
- JUnit 5: https://junit.org/junit5/docs/current/user-guide/
- Maven: https://maven.apache.org/guides/
- Gradle: https://docs.gradle.org
- Spotless: https://github.com/diffplug/spotless
- Checkstyle: https://checkstyle.org
- Testcontainers: https://java.testcontainers.org
- Flyway: https://documentation.red-gate.com/flyway
- Kotlin with Spring: https://docs.spring.io/spring-framework/reference/languages/kotlin.html
