# library-docs · mode: lookup

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** an API, option, signature or behavior must be confirmed before coding.
- **Steps:**
  1. **Detect the version.** Prefer the lockfile's resolved version over the manifest range: `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` (or `<pm> list <pkg> --depth 0`), `Gemfile.lock` (`bundle info <gem>`), `uv.lock` / `poetry.lock` / `requirements*.txt`, `go.mod`, `pom.xml` / `build.gradle`, `*.csproj`, `Cargo.lock`, `composer.lock`. Angular: `list_projects` also reports it.
  2. **Check known facts.** Read `facts/<library>.md` if it exists; a fact whose version range covers the installed version answers the question without a call.
  3. **Route** with the *Provider routing* table in `../SKILL.md`.
  4. **Query.** context7: `resolve-library-id` with the library name and the question; pick the official package, prefer an ID that matches the installed major; then `query-docs` with that ID and one precise concept ("signal inputs with transform", not "Angular inputs"). Dedicated MCPs: pass the exact component or topic and the version when the tool accepts it.
  5. **Apply.** Write the code to the documented shape for that version. If the docs contradict the code base, the code base may be on an older pattern: follow the project's version, flag the gap.
  6. **Learn** (see *Fact library*).
- **Output:** the answer, the version it applies to, the source, and the code or configuration that follows from it.
