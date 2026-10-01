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
Run the *Supply chain protocol → Entry* from the instructions file (already in context; do not load the `supply-chain` skill for it). Department-specific reads:
- Learnings: `~/.supply-chain/learnings/sc-devex.md` if it exists.
- When the task is the supply chain itself, the "project" is the supply chain source repository (or `<skills-dir>/supply-chain/`).
- Tools: the **Tools** table below. Open `../supply-chain/skill-registry.md` only if a capability there has no installed provider.

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

## Procedures
Detailed steps live in `procedures.md` (same folder). **Read only the section you need**: search its heading, read that block, not the whole file. Anti-patterns and references are at the end of that file.

- Layout of the supply chain
- Write a trigger description (any skill)
- Registry: skill-map.json + sync
- Install a missing skill or MCP
- Generate a project skill
- Private layer maintenance
- Add a stack, architecture or department
- CLAUDE.md hygiene
- Settings, MCP and memory
- Documentation (Diátaxis)

## Rules
- **MUST** keep `skill-map.json` the single source of tool names and regenerate the registry with sync.
- **MUST** start every new profile, department or project skill from `templates/`.
- **MUST** install skills or MCP servers only after an explicit yes.
- **MUST** ask before modifying the agent config folder or a repository from within a project task.
- **MUST** keep the `supply-chain` core skill as the single protocol; others reference it, never redefine levels.
- **SHOULD** keep department `SKILL.md` ≤ ~8,000 characters (procedures in `procedures.md`), tool skills ≤ ~11,000, and the instructions block ≤ ~5,000.
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
| skills.discovery | none yet → supply-chain `references/skills.md` | Finding new skills (`npx skills find`) | L1 |

## Definition of Done
- [ ] Exit protocol of `supply-chain` (instructions file → Exit; L2+ full: `../supply-chain/references/protocol.md`) (gates, architecture conformance, review, learnings)
- [ ] Changed files follow their template's section order and size limits
- [ ] `sync.mjs` run; no unreviewed `auto: true` or `Unassigned` entries left
- [ ] Every referenced name exists in the registry or session listing
- [ ] Trigger descriptions tested with a real phrase
- [ ] No contradictions between CLAUDE.md, core skill and departments
- [ ] Docs classified by Diátaxis type

## Hand-offs
- To `sc-architecture`: a new architecture profile needs design decisions.
- To `sc-qa`: gate definitions or the Definition of Done change.
- To `sc-devops`: tooling that must also run in CI.
- To `sc-security`: settings or MCP touching permissions, secrets or network.
- To `sc-product`: supply chain roadmap or scope.
- To any `sc-*`: its content needs domain review.

## Learned rules

_Grows with use (supply-chain `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
