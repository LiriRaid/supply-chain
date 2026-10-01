# Supply Chain

**A department-based supply chain for coding agents.** Claude Code, Codex, Cursor, Gemini CLI, OpenCode and any agent that reads [Agent Skills](https://agentskills.io) (`SKILL.md`).

It is not an orchestrator and it spawns no agent pipelines. It is a set of skills that makes the agent work like a software company. Every non-trivial task goes through the **department** that owns it. The department decides:

- **what** gets built, **why** and for whom;
- **where** it lives in the architecture;
- **how** it is done, and **which skills and MCP servers** to use.

The task then closes with a Definition of Done (typecheck, lint, tests, build, architecture conformance). Finally the agent **learns** from the result.

Stack- and language-agnostic: department rules are generic. Stack and architecture specifics live in profiles.

## Install

Tell your agent:

> **Install the supply chain from https://github.com/LiriRaid/supply-chain following its INSTALL.md**
>
> *(en español: "Instálame el supply chain desde https://github.com/LiriRaid/supply-chain siguiendo su INSTALL.md")*

There is no installer script. [`INSTALL.md`](INSTALL.md) is written **for the agent**, and the agent runs it step by step:

1. Detects which agent it is and where that agent keeps skills and instructions ([`adapters/`](adapters)).
2. Clones the repo and backs up anything already installed.
3. Offers to remove the third-party skills this one replaces.
4. Copies the skills and creates your private layer `~/.supply-chain/`.
5. Writes a managed block of general working rules into the agent's instructions file (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`…). The rest of that file stays as it is.
6. Proposes MCP servers (`context7`; stack-specific ones only for stacks you use) and runs `sync.mjs`.
7. Lists every file it created or modified, asks you to restart, and gives you a smoke test.

The same sentence with "update" or "uninstall" runs the other flows. Node.js 18+ is needed only for `sync.mjs`.

## Built to save tokens

Nothing is preloaded "just in case". Loading is layered:

| Layer | Loaded | Size |
|---|---|---|
| Instructions block in `CLAUDE.md` / `AGENTS.md` | always | ~4.5 k chars: levels, routing, compact Entry/Exit, learning, memory |
| Department `sc-*/SKILL.md` | when a task arrives | ~6–8 k chars: rules, brief questions, tools to use, DoD |
| Department `procedures.md` | only the section the task needs | one procedure |
| Core `supply-chain/references/*`, stack and architecture profiles | only in the situations they list (first time in a project, L2+, learning, missing skill) | on demand |
| Project memory + *Project map* | every task | replaces re-exploring the project each session |

A small L1 task loads the block plus one department and one procedure. Memory (project map, verified gate commands, engram) avoids re-discovering the same things every session.

## How it triggers

Three layers keep the agent on track, without an orchestrator: each skill's `description` (the trigger, with the phrases people actually type), the instructions block (Rule 0: every request runs recall → department → skills → verify → learn; questions run in read-only consult mode), and a tiny per-prompt **Rule 0 reminder hook** (`scripts/rule0-hook.mjs`, installed by default where the agent supports hooks). The hook runs locally, adds ~70 tokens per prompt and never blocks anything. Every reply starts with `Supply chain → L<n> · <dept>`, so you can see at a glance that the routine ran.

```
"quiero crear un modal"      → sc-frontend → brief → ui-build → browser-verify → gates → learn
"nuevo endpoint de pagos"    → sc-backend (+ sc-security, sc-qa)
"refactoriza a hexagonal"    → sc-architecture (L3: plan + ADR)
"cambia el color del botón"  → L0: done directly, no department
```

| Level | Example | What runs |
|---|---|---|
| L0 | a color, a text, a typo | nothing, done directly |
| L1 | bug in one known file | short Entry · department Quick ref · gates without build |
| L2 | new screen, endpoint, integration | full Entry · department rules and skills · gates + build + review |
| L3 | refactor, migration, new module | L2 + `sc-architecture` + plan before coding + ADR |

## What's inside

```
skills/
  supply-chain/        core: triage, Entry/Exit protocols, skill registry, learning loop
    SKILL.md (triage, departments, what to read when) · skill-map.json · skill-registry.md (generated)
    references/        protocol, project-detection, learning, skills (find / install / create), maintenance
    scripts/sync.mjs
    stacks/            angular, react, node, nestjs, rails, python, go, java, dotnet, generic
    architectures/     screaming, feature-sliced, hexagonal, clean, layered, modular-monolith
    templates/         department, stack, architecture, tool skill, project skill, project memory,
                       instructions.md (block for CLAUDE.md / AGENTS.md), private-layer/
  sc-product  sc-architecture  sc-frontend  sc-ux-ui  sc-backend
  sc-data  sc-security  sc-qa  sc-devops  sc-devex          ← 10 departments (SKILL.md + procedures.md)
  ui-build  ui-refine  ui-system  ui-audit  browser-verify  library-docs   ← own tool skills
adapters/              per-agent paths and MCP registration
INSTALL.md             install / update / uninstall, written for the agent
scripts/export.mjs     copy your installed (improved) skills back into the repo
.claude-plugin/        optional Claude Code plugin manifest
```

### Departments

| Skill | Owns |
|---|---|
| `sc-product` | requirements, scope, acceptance criteria |
| `sc-architecture` | structure, layers, boundaries, patterns, ADRs |
| `sc-frontend` | UI code in any framework |
| `sc-ux-ui` | visual design, accessibility, motion, design system |
| `sc-backend` | APIs, services, jobs, realtime, integrations |
| `sc-data` | schema, migrations, queries, caching, client state |
| `sc-security` | authn/authz, secrets, OWASP, dependencies |
| `sc-qa` | tests, verification, review, Definition of Done |
| `sc-devops` | build, CI/CD, git, environments, deploy |
| `sc-devex` | agent tooling, this supply chain, docs |

### Missing skills are created, not skipped

When a department needs a capability no installed skill provides, the agent installs a known one (asking first) or **creates a new skill** with its trigger description, registers it in `skill-map.json`, adds it to the department's Tools table and uses it. General skills go to the agent's skills folder; project-specific ones into the project.

### Tool skills that grow

`ui-build`, `ui-refine`, `ui-system`, `ui-audit`, `browser-verify` and `library-docs` are original skills. Each one is owned by a department and starts with a precondition that loads that department first. They grow as you work through `patterns/`, `rules/`, `facts/` and `## Learned notes`.

`library-docs` routes documentation lookups to the right MCP server: `angular-cli` for Angular, `primeng` for PrimeNG and `context7` for everything else.

## It adapts to you

Nothing personal ships in this repository: no stack, no preferences, no projects. Your private layer `~/.supply-chain/` starts generic and fills itself as you work:

| File | Fills itself when… |
|---|---|
| `profile.md` | a project of a new stack, package manager or architecture is detected |
| `projects.md` + `projects/<slug>.md` | you work in a project for the first time; then gates, gotchas and decisions as they are learned |
| `preferences.md` | you correct how the agent answers or delivers code |
| `subagents.md` | a search or delegation rule proves wrong or missing |
| `agent.md` | the installer records where your agent keeps skills and instructions |

The same layer serves every agent, so switching from Claude Code to Codex keeps your memory.

## The learning loop

After every L1+ task the agent keeps only what was **new and non-obvious** and writes it to exactly one place:

| The lesson is about… | It goes to |
|---|---|
| this project | `~/.supply-chain/projects/<slug>.md` |
| a stack | `stacks/<stack>.md` |
| a tool skill | its `## Learned notes` |
| a department, in any stack | its `## Learned rules` |
| unsure / seen once | `~/.supply-chain/learnings/sc-<dept>.md` (staging) |

When a list grows long, the agent folds it into the skill body, so the skills evolve. When a project procedure has repeated twice, the agent generates a **project skill** inside that project.

## Contributing back

Your installed skills get better as you use them. To publish those improvements:

```bash
node scripts/export.mjs ~/.claude/skills --strip-learned
git diff
```

`--strip-learned` drops personal learned entries; leave it off when the lessons are general. The private layer is never exported.

## Extend

- **Stack**: copy `templates/stack.template.md` → `stacks/<slug>.md`, add its detection signal to `supply-chain/SKILL.md` §6.
- **Architecture**: copy `templates/architecture.template.md`.
- **Department**: copy `templates/department.template.md` → `skills/sc-<name>/SKILL.md`, add it to the core table and to `sync.mjs`.
- **Agent**: add `adapters/<agent>.md` with its paths and MCP registration.

## License

MIT. The tool skills are original work inspired by the approach of community skills; credits are in `skill-map.json` → `inspiredBy`. External skills you vendor later with `sync.mjs --vendor` keep their upstream license in `NOTICE.md`.
