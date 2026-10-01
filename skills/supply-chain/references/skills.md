# Skills: find, install or create

Part of the `supply-chain` core skill. Paths are relative to the core skill folder (`<skills-dir>/supply-chain/`). Read when a department's **Tools** table has no installed provider for what the task needs, or the user asks for a new skill.

## 1. Find

1. The department's **Tools** table → the session's skill list → `skill-registry.md` (search the capability, not the whole file).
2. Installed under another name or department → use it and fix its row in `skill-map.json` (department, capability), then run sync.

## 2. Install a known external skill [ask]

When `skill-registry.md` lists a provider as `missing` with a `source`:

1. One line: *"Para `<capability>` el registro recomienda `<skill>` (`<source>`). ¿La instalo?"* Never install without an explicit yes.
2. `npx skills add <source>` (run `npx skills --help` if the syntax differs), then `node scripts/sync.mjs --vendor <name>` so it becomes an owned real copy, and continue.

## 3. Create the skill (autogeneration)

No provider exists, and the capability is **reusable** (it will serve future tasks in this or other projects): create it, do not just work around it. One-off needs: do the work directly and note it in the closing report.

| The capability is… | Create it in | Ask first? |
|---|---|---|
| general (any project of a stack, or any stack) | `<skills-dir>/<name>/` — owned tool skill | no; tell the user in one line |
| specific to one project | `<project>/<project-skills-dir>/<slug>-<topic>/` — project skill | yes (it writes into their repository); offer `.gitignore` |

Steps:
1. **Template.** Copy `templates/tool-skill.template.md` (general) or `templates/project-skill.template.md` (project). Use `skill-creator` if the session has it.
2. **Name.** kebab-case, says what it does (`pdf-invoices`, `rails-service-objects`), no collisions with the registry.
3. **Trigger (`description`).** One line, double-quoted: what it is → `Use when …` → the phrases the user actually typed for this need, in their language plus key English terms → `Not for …`. Concrete words only; generic words cause false triggers.
4. **Precondition.** It belongs to a department: add `patch: "<sc-dept>"` in its `skill-map.json` entry; sync injects the "load the department first" block.
5. **Body.** Follow the template sections: when to use, inputs, procedure with real commands verified in this session, rules, verification, `## Learned notes`. Keep `SKILL.md` ≤ ~8,000 characters; long material goes to `references/` read on demand.
6. **Register.** Add the entry to `skill-map.json` → `skills` (`type`, `departments`, `capability`, `when`, `level`, `owned: true`, `patch`). Add a row to the owning department's **Tools** table in its installed `SKILL.md`. Project skills: also project memory → *Project skills*.
7. **Sync.** `node scripts/sync.mjs`; confirm it is listed and has no `auto: true`.
8. **Use it now** for the current task; it loads automatically in the next session.
9. **Report:** *"Creé la skill `<name>` (trigger: …) en `<path>`."*
10. **Memory:** if a memory MCP (e.g. engram) is available, `mem_save` that the skill exists and why.

## 4. Project skills from repetition

When project memory → *Repeated procedures* counts the same procedure twice, generate a project skill with section 3 (project row), using the phrases the user used both times.
