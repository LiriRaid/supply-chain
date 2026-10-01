# INSTALL — instructions for the agent

> **You are a coding agent (Claude Code, Codex, Cursor, Gemini CLI, OpenCode or similar) and the user asked you to install, update or uninstall this supply chain.** Follow this document step by step. No installer script is needed: you do the work with your own file and shell tools.
>
> Talk to the user in their language. Ask before every step marked **[ask]**. Never touch credentials, sessions or files not listed here.

Repository: `https://github.com/LiriRaid/supply-chain`

---

## 0. Pick the operation

| The user said… | Do |
|---|---|
| "instálame / install the supply chain" | §1 (incl. §1.1 confirm) → §8 |
| "actualiza / update the supply chain" | §9 |
| "desinstala / uninstall the supply chain" | §10 |

## 1. Detect the agent and its paths

Identify which agent **you** are, then open `adapters/<agent>.md` from the repository (`claude-code`, `codex`, `cursor`, `gemini-cli`, `opencode`, or `generic` if none fits). It gives:

- `<skills-dir>` — user-level skills folder (e.g. `~/.claude/skills`)
- `<project-skills-dir>` — project-level skills folder (e.g. `.claude/skills`)
- `<instructions-file>` — global instructions file (e.g. `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`)
- how to register MCP servers

If the adapter marks a path as *verify*, check it against your own documentation or the filesystem before using it. Tell the user in one line what you detected:

```
Agente: Claude Code · skills: ~/.claude/skills · instrucciones: ~/.claude/CLAUDE.md · capa privada: ~/.supply-chain
```

**1.1 Plan and confirm [ask].** Before downloading or touching anything, show the user the plan and wait for an explicit yes:

```
Voy a instalar el supply chain así:
1. Skills (17)            → ~/.claude/skills/            (respaldo previo si ya existe algo)
2. Instrucciones generales → ~/.claude/CLAUDE.md          (bloque marcado arriba; el resto no se toca)
3. Capa privada            → ~/.supply-chain/             (fuera de .claude; sirve para cualquier agente y se completa sola)
4. Te preguntaré antes de: quitar skills de terceros, mover contenido de tu archivo de instrucciones y registrar MCP.
¿Continúo?
```

Use the real paths from the adapter. If the user says no or changes something (another folder, skip a step), adapt and show the plan again.

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

Remove only the confirmed ones. Remove a link, not the folder it points to, unless the user confirms nothing else uses it.

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

**7.2 Sync.** Run:

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
- Agente / rutas: …
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

1. Get the files (§2) and back up (§3) — always, because installed skills may have learned content.
2. For each skill folder: copy new and changed files, but **merge** `## Learned rules`, `## Learned notes`, `patterns/`, `rules/` and `facts/`: keep the user's entries, add the repository's.
3. `~/.supply-chain/`: only create missing files or folders from the templates; never edit existing ones.
4. Replace the instructions block (§6.2) and run sync (§7.2).
5. Report with the same list of modified files as §8.

## 10. Uninstall **[ask]**

1. Back up (§3).
2. Remove from `<skills-dir>`: `supply-chain`, `sc-*` and the six tool skills from §5.
3. Remove the block between the `supply-chain` markers from `<instructions-file>`; leave the rest.
4. Ask whether to keep `~/.supply-chain/` (it is the user's memory; default: keep).
5. MCP servers: list the ones the install registered and ask before removing any.
