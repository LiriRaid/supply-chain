<!-- supply-chain:begin -->
<!-- Managed by the supply chain installer (INSTALL.md). Edit outside this block; this block is replaced on update. -->
# Rule 0 — supply chain on every request

**Every new request restarts this routine**, in short or long sessions, after a context summary, whatever the size. Only L0 skips it (a color, a text, a typo or one value the user named exactly). "Looks small" is L1, not L0. In doubt, run it.

**Questions run it too, in consult mode (Q):** recall → route to the department of the topic → answer read-only, grounded in the code (`file:line`) or docs (`library-docs`), never from guesswork; say what you could not verify. No gates; reply starts `Supply chain → Q · <dept>`; save the answer to memory if it took real investigation.

1. **Recall** — memory first: `~/.supply-chain/projects/<slug>.md` (+ `mem_search` if engram is available). Has this been solved before? Reuse it.
2. **Route** — load the owner department skill (index below) **before any other skill or edit**; read its Rules and Tools, and only the procedure section you need.
3. **Use skills** — the ones the department's Tools table names, through their triggers. Missing → create it (`supply-chain/references/skills.md`, ask global or project).
4. **Verify** — gates with the project's commands; never claim done with red or unrun gates.
5. **Learn** — save what was new (`supply-chain/references/learning.md`; engram `mem_save`).

**Your reply always starts** with `Supply chain → L<n> · <dept> (+support) · skills: <…>` and, for changes, **ends** with `## Cierre` (gates, skills used or created, what was learned). A per-prompt hook may repeat this rule as a reminder. If you are about to answer without that first line, stop and run step 1.

## Index — what loads what (nothing else is preloaded)

| Request about | Department | Default skills / MCP |
|---|---|---|
| UI code: component, screen, modal, form, styles | `sc-frontend` | ui-build · browser-verify · library-docs |
| look & feel, accessibility, motion, tokens | `sc-ux-ui` | ui-refine · ui-system · ui-audit |
| API, service, job, webhook, realtime | `sc-backend` | library-docs · code-review |
| schema, migration, query, cache, state | `sc-data` | library-docs · code-review |
| auth, permissions, secrets, vulnerabilities | `sc-security` | security-review · code-review |
| tests, bugs, review, "no funciona" | `sc-qa` | browser-verify · code-review |
| build, CI, git, deploy | `sc-devops` | run · code-review |
| structure, refactor, patterns, new module | `sc-architecture` | Plan · Explore · ADR |
| idea → scope, criteria, plan | `sc-product` | Plan · memory |
| skills, agent config, docs, this supply chain | `sc-devex` | skill-creator · references/skills.md |
| unsure / first time in a project | `supply-chain` | references/project-detection.md |

Levels: **L1** 1–2 known files → department + one procedure · **L2** feature or >2 files → + `supply-chain/references/protocol.md` + review · **L3** refactor/migration/new project → + `sc-architecture`, plan first, ADR. Docs for any library API not verified this session → `library-docs`. Never invent skill, tool or API names. `supply-chain/…` paths live in `<skills-dir>` (`~/.supply-chain/agent.md`).

## Self-filling memory `~/.supply-chain/` (never ask the user to fill it)

`projects/<slug>.md` project map, verified commands, gotchas, decisions (missing → `references/project-detection.md`) · `projects.md` index · `profile.md` stacks seen · `preferences.md` how to answer (read first; add a line when the user corrects you) · `subagents.md` search/delegation · `learnings/` staging. A project `CLAUDE.md` / `AGENTS.md`, if present, wins for that project; propose one (ask) when the project needs rules on every task.

## General rules

Reply in the user's language; code and commits in the project's. Package manager from the lockfile. Preserve current behavior (visuals, focus/hover, animations, responsive, public APIs). Smallest change; no new abstractions or library swaps unless asked; check consumers of shared code. Before editing, locate the exact target (element, file, selector, style actually applied) and confirm it when ambiguous. Search before reading. Ask before destructive or outward-facing actions.
<!-- supply-chain:end -->
