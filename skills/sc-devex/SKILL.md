---
name: sc-devex
description: "Supply chain · Developer Experience department. Use FIRST for Claude Code tooling and for maintaining this supply chain: \"crea una skill\", \"genera una skill para este proyecto\", \"agrega un MCP\", \"CLAUDE.md\", \"settings de Claude\", \"actualiza el registro de skills\", \"instala una skill\", \"agrega un stack o arquitectura al supply chain\", README, project documentation, memory, agents, prompts. Loads the tooling rules and decides which skills and MCP servers to use."
---

# Developer Experience & Documentation

## Quick ref
**Mission:** Maintain the skills-based supply chain and its tooling so every session triggers the right department and tools with minimal context.
**Must:** tool names live only in `skill-map.json` (registry is generated) · run `sync.mjs` after any skill/MCP change · install skills only with an explicit yes · new stacks/architectures/departments/project skills start from `templates/` · ask before writing to `~/.claude` or a repository from a project task
**Skills by default:** `skill-creator` · `update-config` · `init` · agent `claude-code-guide` · `library-docs` · MCP `engram`
**DoD:** templates followed, sizes within limits, registry regenerated, trigger descriptions concrete, no contradictory instructions.

## Entry
Run the Entry protocol of the `supply-chain` skill (`../supply-chain/SKILL.md` §3) — project memory, stack profile, architecture profile (L2+), learnings (`~/.supply-chain/learnings/sc-devex.md`), registry section `## sc-devex` in `../supply-chain/skill-registry.md`, brief. When the task is the supply chain itself, the "project" is `~/.claude/supply-chain/`.

## Brief questions
1. **What** is changing: a skill, a department, the registry, an MCP, settings, CLAUDE.md, docs, memory?
2. **Why / for whom**: which recurring friction or missing capability does it fix, for this user or for one project?
3. **Where** does it live: core (`skills/supply-chain`), a department (`skills/sc-*`), the private layer (`~/.supply-chain/`), a project (`<project>/<project-skills-dir>/`) or global settings?
4. **How** will it trigger — which exact user phrases, in which language?
5. Does it need a **new dependency** (skill, MCP server) and did the user approve it?
6. Does it **contradict** anything in CLAUDE.md, the core protocol or another department?
7. **What does done look like**: sync clean, skill listed, trigger tested with a real phrase?

## Scope
- Owns: the supply-chain plugin (core, departments, `skill-map.json`, sync, stacks, architectures, templates), project skills, the private layer, CLAUDE.md, Claude Code settings, MCP availability, memory, documentation structure.
- Does not own: product code conventions → `sc-frontend`, `sc-backend` · CI pipelines → `sc-devops` · secret policy → `sc-security` · architecture content decisions → `sc-architecture`.

## Procedure

### Layout of the supply chain
- `<skills-dir>/supply-chain/` — core (live copy, real folders, portable): `SKILL.md` (protocol), `skill-map.json`, generated `skill-registry.md`, `scripts/sync.mjs`, `stacks/`, `architectures/`, `templates/`.
- `<skills-dir>/sc-<dept>/SKILL.md` — one skill per department (`templates/department.template.md`).
- `<skills-dir>/<tool>/` — owned tool skills (`"owned": true` in skill-map, provenance in `NOTICE.md`, evolve via `## Learned notes`).
- Source repository (clone of the published repo): `skills/`, `adapters/`, `INSTALL.md`, `scripts/export.mjs` (copies the live skills back into the repo to publish improvements).
- `~/.supply-chain/` — private layer, self-filling (templates in `../supply-chain/templates/private-layer/`): `agent.md`, `profile.md`, `preferences.md`, `subagents.md`, `projects.md`, `learnings/`, `projects/`. Never shared or published.
- `<project>/<project-skills-dir>/<slug>-<topic>/` — project skills. `<skills-dir>` / `<project-skills-dir>` per agent: `~/.supply-chain/agent.md`.
- As a plugin, names are prefixed (`supply-chain:sc-qa`); use the form the session lists.
- Enforcement is by description triggers and the core protocol only.

### Write a trigger description (any skill)
1. Single line, double-quoted, inner quotes escaped as `\"`.
2. Start with what it is (`Supply chain · <Dept> department.`), then `Use FIRST` + what it precedes when it must run before tool skills.
3. List concrete phrases the user actually types, in the user's language (Spanish here) plus key English terms.
4. Say what it is not for when confusion is likely (e.g. L0 edits).
5. Avoid generic words ("code", "help"): they cause false triggers or misses.
6. Test: a fresh prompt with one listed phrase must load the skill; an unrelated prompt must not.

### Registry: skill-map.json + sync
1. Edit only `../supply-chain/skill-map.json` (`skills` or `mcp`): `type`, `departments`, `capability`, `when`, `level`, `source`, optional `patch` (department whose precondition is injected), optional `stack`.
2. Run `node ../supply-chain/scripts/sync.mjs` (`--dry-run` preview, `--unpatch` remove patches). It re-indexes user, plugin and project skills plus MCP servers, auto-assigns new skills (`auto: true`), re-applies the precondition block to tool skills and regenerates `skill-registry.md`.
3. Review every `auto: true` entry and `Unassigned` row; fix department, capability and level, rerun sync.
4. After every `npx skills add`, run `sync.mjs --vendor <name>` so the new skill becomes an owned real copy in `<skills-dir>` (no links, portable).
5. Never edit `skill-registry.md` by hand; never reference a name absent from the registry or the session listing.

### Install a missing skill or MCP
1. Follow `supply-chain` §5: propose in one line with name and source; wait for an explicit yes.
2. Skill: `npx skills add <source>` (check `npx skills --help` if syntax differs). MCP: configure via `update-config` or `claude mcp add`, verifying with `claude-code-guide`.
3. Add or fix its entry in `skill-map.json`, run sync, confirm the status reads `installed` / `configured`.

### Generate a project skill
1. Trigger: a procedure counted twice in project memory (*Repeated procedures*), or the user asks.
2. Copy `../supply-chain/templates/project-skill.template.md` (`skill-creator` for wording): description = the user's real phrases; procedure = real paths and verified gates.
3. Ask before writing `<project>/<project-skills-dir>/<slug>-<topic>/SKILL.md`; offer to `.gitignore` it.
4. Register it in project memory → *Project skills*, run sync (it appears under `## Project skills`).

### Private layer maintenance
1. Learnings: one line each, `- [YYYY-MM-DD] [project] <lesson> — <why>`; only non-obvious, reusable facts.
2. Past ~150 lines: merge duplicates, drop lessons already in department rules, promote stable ones into the department skill or stack profile.
3. Project memory: keep `templates/project-memory.template.md` sections; update gates, gotchas, decisions as learned.

### Add a stack, architecture or department
1. Copy the matching file in `../supply-chain/templates/`; keep the exact section order.
2. Stack: concrete *Detect* signals; *Commands* for every gate, run once for real; add the signal to `supply-chain` §6.
3. Architecture: From / May import / Must not import table; conformance items verifiable by Grep.
4. Department: Quick ref ≤ 6 lines, Brief questions, stack-agnostic rules, DoD starting with the Exit protocol, file ≤ 11,000 characters; add it to `supply-chain` §2 and the `depts` list and keywords in `sync.mjs`.

### CLAUDE.md hygiene
1. Short (target < 3,000 chars): stack summary, package manager, project-specific rules, and one line pointing to the `supply-chain` skill.
2. No "skip", "ignore", "optional for small tasks" wording that contradicts the levels; levels decide what is mandatory.
3. Do not duplicate department, stack or registry content; no tool names absent from the registry.
4. One configuration root per workspace; no nested agent config folders in subdirectories. Use `init` for a new project CLAUDE.md.

### Settings, MCP and memory
1. Settings, permissions, env vars: `update-config`; behavior questions: `claude-code-guide`.
2. Load deferred tools via tool search first; reuse global MCP servers, no per-project copies.
3. `engram`: `mem_search` before re-reading context; `mem_save` non-obvious decisions with what, why, where.

### Documentation (Diátaxis)
1. One type per page (tutorial, how-to, reference, explanation); link between them.
2. Document intent and decisions, not drifting code; match the project's doc language; keep README current.

## Rules
- **MUST** keep `skill-map.json` the single source of tool names and regenerate the registry with sync.
- **MUST** start every new profile, department or project skill from `templates/`.
- **MUST** install skills or MCP servers only after an explicit yes.
- **MUST** ask before modifying the agent config folder or a repository from within a project task.
- **MUST** keep the `supply-chain` core skill as the single protocol; others reference it, never redefine levels.
- **SHOULD** keep department skills ≤ 11,000 characters and CLAUDE.md < 3,000.
- **MUST NOT** write contradictory instructions across CLAUDE.md, the core skill and departments.
- **MUST NOT** put stack-specific commands in department skills; they belong in `stacks/`.

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|
| skills.author | `skill-creator` | Create or improve a skill, including project skills | L1 |
| config.claude | `update-config` | settings.json, permissions, env vars, MCP config | L1 |
| docs.project | `init` | Create a project CLAUDE.md | L1 |
| claude.docs | `claude-code-guide` agent | Skills, plugins, MCP, settings or SDK behavior not verified this session | Q |
| claude.api | `claude-api` | Tooling that calls the Claude API | L1 |
| docs.library | `library-docs` (→ angular-cli / primeng / context7 MCP) | Docs for tooling libraries (script runners, doc generators) | Q |
| memory | MCP `engram` | Session context, decisions, root causes | L1 |
| search.codebase | `Explore` agent | Auditing names or contradictions across files | L1 |
| skills.discovery | none yet → supply-chain §5 | Finding new skills (`npx skills find`) | L1 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` §4 (gates, architecture conformance, review, learnings)
- [ ] Changed files follow their template's section order and size limits
- [ ] `sync.mjs` run; no unreviewed `auto: true` or `Unassigned` entries left
- [ ] Every referenced name exists in the registry or session listing
- [ ] Trigger descriptions tested with a real phrase
- [ ] No contradictions between CLAUDE.md, core skill and departments
- [ ] Docs classified by Diátaxis type

## Anti-patterns
- Editing `skill-registry.md` by hand, or leaving a newly installed skill as a link instead of vendoring it.
- Vague descriptions that never or always trigger.
- CLAUDE.md growing into a second protocol or a copy of departments.
- Installing skills or writing project skills into a repo without asking.
- Learnings that duplicate department rules or grow unconsolidated.

## Hand-offs
- To `sc-architecture`: a new architecture profile needs design decisions.
- To `sc-qa`: gate definitions or the Definition of Done change.
- To `sc-devops`: tooling that must also run in CI.
- To `sc-security`: settings or MCP touching permissions, secrets or network.
- To `sc-product`: supply chain roadmap or scope.
- To any `sc-*`: its content needs domain review.

## References
- Claude Code docs: https://docs.claude.com/en/docs/claude-code
- Diátaxis: https://diataxis.fr

## Learned rules

_Grows with use (supply-chain §7). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
