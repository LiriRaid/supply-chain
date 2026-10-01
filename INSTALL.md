# INSTALL — instructions for the agent

> **You are a coding agent (Claude Code, Codex, Cursor, Gemini CLI, OpenCode or similar) and the user asked you to install, update or uninstall this supply chain.** Follow this document step by step. No installer script is needed: you do the work with your own file and shell tools.
>
> Talk to the user in their language. Ask before every step marked **[ask]**, with your choice window if the agent has one (Claude Code: `AskUserQuestion`, options as buttons, recommended first), else in text. Never touch credentials, sessions or files not listed here.

Repository: `https://github.com/LiriRaid/supply-chain`

---

## 0. Pick the operation

| The user said… | Do |
|---|---|
| "instálame / install the supply chain" | §1 (incl. §1.1 confirm) → §8 |
| "actualiza / update the supply chain" | §9 |
| "desinstala / uninstall the supply chain" | §10 |

## 1. Detect the agent and its paths

Identify which agent **you** are, and **every other agent installed on this machine** (config folders such as `~/.claude`, `~/.codex`, `~/.cursor`, `~/.gemini`, `~/.config/opencode`, or the agent's CLI on the PATH). The supply chain can be installed in all of them at once; they share one private layer, so work started in one agent can be resumed in another. For each agent, open `adapters/<agent>.md` from the repository (`claude-code`, `codex`, `cursor`, `gemini-cli`, `opencode`, or `generic` if none fits). It gives:

- `<skills-dir>` — user-level skills folder (e.g. `~/.claude/skills`)
- `<project-skills-dir>` — project-level skills folder (e.g. `.claude/skills`)
- `<instructions-file>` — global instructions file (e.g. `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`)
- how to register MCP servers

If the adapter marks a path as *verify*, check it against your own documentation or the filesystem before using it. Tell the user in one line per agent what you detected:

```
Agente: Claude Code · skills: ~/.claude/skills · instrucciones: ~/.claude/CLAUDE.md · capa privada: ~/.supply-chain
También encontré: Codex (~/.codex) · Cursor (~/.cursor)
```

**1.1 Plan and confirm [ask].** Before downloading or touching anything, show the user the plan and wait for an explicit yes:

```
Voy a instalar el supply chain así:
1. Skills (17)            → ~/.claude/skills/            (respaldo previo si ya existe algo)
2. Instrucciones generales → ~/.claude/CLAUDE.md          (bloque marcado arriba; el resto no se toca)
3. Capa privada            → ~/.supply-chain/             (fuera de .claude; sirve para cualquier agente y se completa sola)
4. Hook Rule 0         → ~/.claude/settings.json      (recordatorio por mensaje, ~70 tokens; no bloquea nada)
5. Agentes: Claude Code (este) + ¿también Codex, Cursor…? (los que encontré; misma memoria compartida)
6. Te preguntaré antes de: quitar skills de terceros, mover contenido de tu archivo de instrucciones y registrar MCP.
¿Continúo?
```

Use the real paths from the adapter. **Several agents chosen** → run §3–§7 once per agent with its own adapter (skills, instructions block, hook if supported, MCP in its own config), and §6.1 (private layer) only once. If the user says no or changes something (another folder, skip a step), adapt and show the plan again.

## 2. Get the files

Clone into a temporary folder (do not clone inside `<skills-dir>`):

```bash
git clone --depth 1 https://github.com/LiriRaid/supply-chain "<tmp>/supply-chain"
```

No git? Download `https://github.com/LiriRaid/supply-chain/archive/refs/heads/main.zip` and extract it. If the user gave you a local path to the repository, use that instead.

Requirement check: `node --version` must be 18 or newer (only `sync.mjs` needs it). If Node is missing, tell the user and continue; skip §7 and say so in the report.

## 3. Back up **[ask if anything exists]**

Create `~/.supply-chain-backups/<YYYY-MM-DD-HHmm>/` and copy into it whatever already exists of:

- `<skills-dir>/supply-chain`, `<skills-dir>/sc-*`, and the tool skills listed in §5
- `<instructions-file>`
- `~/.supply-chain/` and any legacy private layer (`~/.claude/supply-chain.local/`)

Report the backup path. If nothing exists, say "instalación limpia" and continue.

## 4. Replaced third-party skills **[ask]**

This supply chain ships its own tool skills that replace these community skills. If any of them is installed in `<skills-dir>` (or as a link from `~/.agents/skills`), list what you found and ask before removing:

| Installed skill | Replaced by |
|---|---|
| `frontend-design` | `ui-build` |
| `impeccable` | `ui-refine` |
| `ui-ux-pro-max` | `ui-system` |
| `web-design-guidelines` | `ui-audit` |
| `webapp-testing` | `browser-verify` |
| `context7-mcp` (skill, not the MCP server) | `library-docs` |

Remove only the confirmed ones. Remove a link, not the folder it points to, unless the user confirms nothing else uses it. **Before removing a real folder, copy it to the §3 backup.** If `~/.agents/.skill-lock.json` exists, back it up and delete the entries of the removed skills (and entries whose folder no longer exists, reporting them).

## 5. Copy the skills

Copy every folder in the repository's `skills/` into `<skills-dir>`, replacing existing folders with the same name:

```
supply-chain  sc-product  sc-architecture  sc-frontend  sc-ux-ui  sc-backend
sc-data  sc-security  sc-qa  sc-devops  sc-devex
ui-build  ui-refine  ui-system  ui-audit  browser-verify  library-docs
```

Copy real files (no symlinks). If this is a reinstall and the user's installed copies have entries under `## Learned rules` / `## Learned notes`, or files in `patterns/`, `rules/`, `facts/` that the repository does not have, keep those entries: merge them into the new files instead of overwriting.

## 6. Private layer and instructions

Keep a list of **every file you create or modify** from here on; §8 reports it.

**6.1 Private layer.** Create `~/.supply-chain/` from `<skills-dir>/supply-chain/templates/private-layer/`:

| File | If missing | If it exists |
|---|---|---|
| `README.md`, `profile.md`, `preferences.md`, `subagents.md`, `projects.md` | copy the template | keep it; never overwrite |
| `agent.md` | copy and fill with the paths from §1 | add or update this agent's row only |
| `learnings/`, `projects/` | create | keep |

These files start generic on purpose. **Do not ask the user to fill them**: the supply chain completes them automatically while they work (stacks and projects on first detection, preferences from corrections, see `supply-chain` §6–§7).

- **Migration (legacy layer):** if `~/.claude/supply-chain.local/` exists, merge it into `~/.supply-chain/` (never overwrite a newer file) and offer to delete the old folder **[ask]**.
- **The user's own layer:** if they name one (a private repository, a zip, a folder), copy it into `~/.supply-chain/` instead of the templates.

**6.2 Instructions block.** Insert `<skills-dir>/supply-chain/templates/instructions.md` (everything from `<!-- supply-chain:begin -->` to `<!-- supply-chain:end -->`) into `<instructions-file>`. It holds the general working rules and the mandatory use of the supply chain; it contains no stack or personal data.

- File missing → create it with the block.
- Block already present → replace it in place.
- File exists without the block → add the block **at the top** and leave the rest of the file untouched. Then read the rest of the file and list for the user the parts that are now covered by the block or the private layer (an older supply chain section, rules about subagents, delivery preferences, project descriptions, links to files such as `Agents.md` or `user-preferences.md`). Offer **[ask]**: move each part into the matching private-layer file (`subagents.md`, `preferences.md` → *Learned preferences*, `projects.md`, `profile.md`) and remove it from the instructions file. Never delete content the user did not approve.
- Agents whose instructions are not a file (e.g. Cursor user rules): show the block and ask the user to paste it.

## 7. MCP servers and sync

**7.1 MCP [ask].** The supply chain works without MCP servers; `library-docs` uses them for version-accurate documentation. Register only what the user accepts, with the method in the adapter, and skip servers already registered.

| Server | Propose when | Command / source |
|---|---|---|
| `context7` | always (docs for any library) | `https://mcp.context7.com/mcp` (HTTP) |
| `engram` | recommended: persistent memory across sessions (the instructions block uses it to search before re-reading and to save decisions) | `https://github.com/Gentleman-Programming/engram` — if the binary is missing, offer to install it following its README **[ask]**; register it with the adapter's command |
| stack-specific servers | only when the user works with that stack | entries in `skill-map.json` → `mcp` with a `stack` field |

The stack-specific entries shipped today are **examples** for Angular (`angular-cli`: `npx -y @angular/cli mcp`, `primeng`: `npx -y @primeng/mcp`). On a fresh machine the stack is usually unknown: skip them, and let `sc-devex` propose the right server later, when a project of that stack is detected (`supply-chain` §5).

**7.2 Rule 0 hook (installed by default).** The instructions block can be ignored in long sessions; a per-prompt reminder keeps the supply chain on every request. Once a day it also checks the repository's `VERSION` (1.5 s timeout, silent offline) and, only when a newer version exists, tells the agent to offer the update (§9) at most once a day; commits without a version change never trigger it. It runs locally (0 tokens to execute) and adds ~70 tokens of context per prompt; it never blocks or changes the prompt. Include it in the §1.1 plan.

- **Claude Code:** merge into `~/.claude/settings.json` (keep every existing key and hook; do not duplicate if a hook with `rule0-hook.mjs` already exists):

```json
{ "hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command", "command": "node \"<skills-dir>/supply-chain/scripts/rule0-hook.mjs\"" } ] } ] } }
```

  Use the absolute path with forward slashes. Verify: `echo {} | node "<skills-dir>/supply-chain/scripts/rule0-hook.mjs"` prints JSON with `additionalContext`.
- **Other agents:** if the adapter documents a per-prompt hook, register the same script there; otherwise skip it (the instructions block still applies) and say so in the report.
- Report it under *Archivos modificados* (`settings.json — hook Rule 0 agregado`).

**7.3 Sync.** Run:

```bash
node "<skills-dir>/supply-chain/scripts/sync.mjs"
```

It indexes installed skills and MCP servers into `skill-registry.md`, applies the department precondition to tool skills and creates the private layer folders. Show its output. Entries marked `auto: true` or under *Unassigned* are third-party skills it found; report them, do not fix them silently.

## 8. Verify and report

1. Confirm these exist: `<skills-dir>/supply-chain/SKILL.md`, `<skills-dir>/sc-frontend/SKILL.md`, `<skills-dir>/ui-build/SKILL.md`, `~/.supply-chain/agent.md`, `~/.supply-chain/preferences.md`, and the block in `<instructions-file>`.
2. Tell the user that skills load at session start: **they must restart the agent** (new session).
3. Smoke test for the new session: *"quiero crear un modal de confirmación"* → the agent must load `sc-frontend`, print the supply chain brief, then use `ui-build`.
4. Report, listing **every file created or modified** (from §6 on), so the user knows what changed:

```
## Supply chain instalado
- Agentes / rutas: … (uno por línea)
- Versión: <skills-dir>/supply-chain/VERSION
- Respaldo: ~/.supply-chain-backups/<fecha>/
- Skills: 17 copiadas · de terceros eliminadas: …
- Archivos modificados según INSTALL.md:
  - <instructions-file> — bloque agregado arriba / reemplazado (resto intacto)
  - ~/.supply-chain/agent.md — creado / fila agregada
  - ~/.supply-chain/{profile,preferences,subagents,projects}.md — creados (se completan solos al trabajar)
  - …
- Movido a la capa privada con tu permiso: …
- MCP: registrados … · omitidos …
- Sync: … · Pendiente: reiniciar el agente y probar la frase de humo
```

## 9. Update

1. **Compare versions.** Read the installed `<skills-dir>/supply-chain/VERSION` (missing = older than 0.3.0) and the repository's. Same version → say it is up to date and stop unless the user insists. Otherwise show the user the `CHANGELOG.md` entries between both versions and wait for a yes **[ask]**.
2. Get the files (§2) and back up (§3) — always, because installed skills may have learned content. Update every agent where the supply chain is installed (§1), unless the user names one.
3. For each skill folder: copy new and changed files, delete files the repository removed (only inside the 17 supply chain skills), but **merge** `## Learned rules`, `## Learned notes`, `patterns/`, `rules/` and `facts/`: keep the user's entries, add the repository's.
4. `~/.supply-chain/`: only create missing files or folders from the templates; never edit existing ones. Existing `projects/<slug>.md` files gain new template sections (e.g. *Work in progress*) the next time a task runs there; do not rewrite them now.
   `skill-map.json`: take every entry from the repository, then add back the installed entries the repository does not have (skills and MCP servers the user created or mapped, project skills).
5. Replace the instructions block (§6.2), make sure the Rule 0 hook is registered (§7.2) and run sync (§7.3).
6. Report with the same list of modified files as §8, plus `Versión: <old> → <new>`.

## 10. Uninstall **[ask]**

1. Back up (§3).
2. Remove from `<skills-dir>`: `supply-chain`, `sc-*` and the six tool skills from §5.
3. Remove the block between the `supply-chain` markers from `<instructions-file>`; leave the rest. Remove the hook entry that runs `rule0-hook.mjs` from the agent settings.
4. Ask whether to keep `~/.supply-chain/` (it is the user's memory; default: keep).
5. MCP servers: list the ones the install registered and ask before removing any.
