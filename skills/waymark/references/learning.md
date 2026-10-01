# Learning loop

Part of the `waymark` core skill. Paths are relative to the core skill folder (`<skills-dir>/waymark/`). Read only when the instructions file or a department points here.

Run at the end of every L1+ task (Exit → Learn). **Work in progress:** rewrite only your task's entry; keep the pending items of other tasks (several tasks can be open in one project).

After each L1+ task, collect what was **non-obvious and new**: something you had to discover, a correction from the user, a command or flag that was needed, a library quirk, a mistake you made. Discard anything already stated anywhere in Waymark.

**1. Novelty check (mandatory before writing anything).** Grep the candidate concept in: the department `SKILL.md`, the stack profile, the tool skill, the project memory and the learnings file. Already covered → write nothing. Covered but wrong or outdated → fix it in place and say so.

**2. Place it where it belongs** (exactly one destination):

| The lesson is about… | Write it to |
|---|---|
| this machine or environment (OS, shell, missing tools, how to edit files) | `~/.waymark/profile.md` → *Environment* |
| a problem that took more than one attempt | `~/.waymark/projects/<slug>.md` → *Solved problems* (symptom, cause, fix, dead ends) + `mem_save` |
| this project only (paths, conventions, gotchas, commands) | `~/.waymark/projects/<slug>.md` |
| a project rule that must apply to **every** task there and the team should share | `<project>/<project-instructions-file>` — ask first (see `project-detection.md`) |
| a stack/framework, valid in any project of that stack | `stacks/<stack>.md` → matching *Conventions* section |
| an architecture, valid in any project that uses it | `architectures/<arch>.md` → *Placement rules* or *Conformance checklist* |
| a library fact verified in official docs | `library-docs/facts/<library>.md` (per version) |
| how to use a tool skill (ui-build, ui-refine, …) | that skill's `## Learned notes` |
| a general rule of the department, valid in any stack | the department's `## Learned rules` |
| how the user wants answers or code delivered (a correction) | `~/.waymark/preferences.md` → *Learned preferences* |
| searching or delegating to subagents | `~/.waymark/subagents.md` → *Learned rules* |
| not sure yet / seen once | `~/.waymark/learnings/dept-<dept>.md` (staging) |

Format: `- [YYYY-MM-DD] <lesson> — <why> (source: <project>)`.

**3. Promotion.** A staged learning seen a second time (any project) is promoted to its final destination from the table and removed from staging. A user correction is promoted immediately.

**4. Consolidation (the skills evolve).** When a `## Learned notes` / `## Learned rules` list passes ~10 items, fold them into the body of the skill (the Procedure, Rules or Anti-patterns they refine), keep the meaning, and clear the list. Report it in the closing report.

**5. Project skills.** When the same project-specific procedure has been done twice (project memory → *Repeated procedures*), or the user asks, generate a skill **inside the project**: `<project>/<project-skills-dir>/<slug>-<topic>/SKILL.md` from `templates/project-skill.template.md`, with the trigger phrases the user actually used. Register it in project memory and run `node scripts/sync.mjs`. Ask before writing into the repository; offer `.gitignore` if it should not be committed.

**6.** If an `engram` (or other memory) MCP is available, also `mem_save` architecture decisions and bug root causes.

Mention in the closing report every file written by this loop.
