<!-- supply-chain:begin -->
<!-- Managed by the supply chain installer (INSTALL.md). Edit outside this block; this block is replaced on update. -->
# Working instructions

## Supply chain (always)

Every task goes through the supply chain unless it is **L0 trivial** (a color, a text, a typo, one value).

1. Load the department skill that owns the task **before any other skill**: `sc-frontend`, `sc-backend`, `sc-data`, `sc-security`, `sc-qa`, `sc-devops`, `sc-architecture`, `sc-ux-ui`, `sc-product`, `sc-devex`. If unsure which one, load `supply-chain`.
2. Follow its Entry protocol (project memory → stack profile → architecture profile → learnings → skill registry → brief), use the skills and MCP servers it selects, and close with its Exit protocol (typecheck · lint · tests · build · architecture conformance · learnings).
3. A department never gets skipped because a task "looks small". Size decides the level (L1/L2/L3), not whether the supply chain runs.
4. Agents without a skill tool: "load a skill" means read `<skills-dir>/<name>/SKILL.md` (paths in `~/.supply-chain/agent.md`) and follow it.

## Private layer — read it, keep it current

`~/.supply-chain/` is this user's memory. It starts generic and fills itself as they work (supply-chain skill §7); never ask the user to fill it by hand.

| File | Read | Update automatically when |
|---|---|---|
| `profile.md` | when a project has no memory yet | a new stack, package manager or architecture shows up |
| `preferences.md` | before answering or delivering code | the user corrects how you communicate or deliver |
| `subagents.md` | before searching broadly or delegating | a delegation rule proves wrong or missing |
| `projects.md` | when the task spans projects or names one | a project is worked on for the first time |
| `projects/<slug>.md` | Entry protocol, every task | gates, gotchas, decisions are learned |

## General rules

- **Language:** reply in the user's language (see `preferences.md`); keep code, identifiers and commits in the project's language.
- **Package manager:** use the one the lockfile names (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`, `Gemfile.lock`, `poetry.lock`, `uv.lock`…). Never mix.
- **Preserve behavior:** identify current behavior before changing code; keep visuals, keyboard/hover/focus states, animations, responsive behavior, inputs/outputs and public APIs unless asked.
- **Smallest change:** no new abstractions, services, helpers or wrappers unless asked or the duplication is already harmful. Do not replace the project's patterns, components or libraries without an explicit request. Fix first; propose refactors separately.
- **Reusable code:** when changing a shared component or module, check all its consumers.
- **Search before reading:** search for the symbol first; read only the relevant range; delegate broad exploration (`subagents.md`).
- **Never claim done** with failing or unrun gates; report real output.
- **Ask before** destructive, outward-facing or irreversible actions (deleting data, pushing, publishing, installing).
<!-- supply-chain:end -->
