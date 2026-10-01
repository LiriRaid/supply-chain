# Entry and Exit protocol (full)

Part of the `supply-chain` core skill. Paths are relative to the core skill folder (`<skills-dir>/supply-chain/`). Read only when the instructions file or a department points here.

The compact version lives in the instructions file and is enough for L1. Read this file at L2+ or when unsure.

## Entry

1. **Project memory.** Identify the project root (nearest folder with a manifest: `package.json`, `Gemfile`, `pyproject.toml`, `go.mod`, `pom.xml`, `*.csproj`, `Cargo.toml`, `composer.json`, `pubspec.yaml`). Read `~/.supply-chain/projects/<project-slug>.md`. If it does not exist, read `~/.supply-chain/profile.md` (the user's defaults), run `references/project-detection.md` and create the memory from `templates/project-memory.template.md`. If the memory exists but has no *Project map*, run the minimal project scan of `references/project-detection.md` once and add it. Any private-layer file missing (`profile.md`, `preferences.md`, `subagents.md`, `projects.md`, `agent.md`) → create it from `templates/private-layer/` without asking.
2. **Stack profile.** Read `stacks/<stack>.md` (L1: *Commands* + your department's section; L2+: full). Unknown stack → `stacks/generic.md`.
3. **Architecture profile** (L2+). Read `architectures/<architecture>.md`. Unknown → derive it from the project and generate the profile (`references/project-detection.md`); ask only if the code is ambiguous. Record it in project memory.
4. **Learnings.** Read `~/.supply-chain/learnings/<department>.md` if it exists.
5. **Tools.** Read `skill-registry.md` → your department section. Pick the skills/MCP whose *When* matches the task and whose *Level* ≤ current level. Missing provider → `references/skills.md`.
6. **Brief.** Print before the first edit:

```
Supply chain → L2 · sc-frontend (+ sc-ux-ui, sc-qa) · stack angular · arch screaming
Qué: modal de confirmación para eliminar contacto
Para qué / quién: evitar borrados accidentales del agente
Dónde: features/contacts/components/delete-contact-dialog/ (scope rule: un solo feature)
Reutiliza: shared/components/app-modal (base de todos los modales del proyecto)
Cómo: procedure "New component" · skills: ui-build → browser-verify · docs: library-docs → angular-cli (Angular CDK dialog), primeng (Dialog)
```

## Exit (Definition of Done)

1. **Quality gates** — run them yourself with the commands from project memory (or the stack profile): typecheck · lint (changed files) · tests (related at L1/L2, full at L3) · build (L2+). Report real output. If a failure is pre-existing, prove it (`git stash` → rerun → `git stash pop`) and say so. Never claim done with red gates.
2. **Architecture conformance** (L2+) — run the *Conformance checklist* of the architecture profile against the changed files. Report ✔/✘ with `file:line`.
3. **Review** (L2+) — `code-review` skill on the diff. L3 — also `simplify` and, if security-relevant, `security-review`.
4. **Department DoD** — tick the department's Definition of Done.
5. **Learn** — `references/learning.md`; rewrite project memory → *Work in progress* (or mark it idle).
6. **Closing report**:

```

## When stuck (two-strike rule)

The second failed attempt on the same problem means guessing has started. Stop varying the fix and switch method:
1. **Observe, do not assume.** Get the real state: computed styles and the rule that wins (browser devtools / `browser-verify`), the actual runtime value, the full error and stack, the real request/response, the version installed.
2. **Re-read the source of truth.** Official docs for the exact API and version (`library-docs`), and the code that actually runs (not the file you think runs: check imports, overrides, themes, generated files).
3. **Hypotheses.** List 2–3 possible causes; test first the check that rules out the most of them with the least effort. One change at a time.
4. **Ask once, precisely.** Still unclear → one concrete question to the user (which element / screen / input, a screenshot of the inspector, the exact steps), not a list of guesses.
5. **Record it.** When solved, project memory → *Solved problems*: symptom, root cause, fix, what did not work and why, cost.
