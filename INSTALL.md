# INSTALL — instructions for the agent

> **You are a coding agent (Claude Code, Codex, Cursor, Gemini CLI, OpenCode or similar) and the user asked you to install, update or uninstall this supply chain.** Follow this document step by step. No installer script is needed: you do the work with your own file and shell tools.
>
> Talk to the user in their language. Ask before every step marked **[ask]**. Never touch credentials, sessions or files not listed here.

Repository: `https://github.com/LiriRaid/supply-chain`

---

## 0. Pick the operation

| The user said… | Do |
|---|---|
| "instálame / install the supply chain" | §1 → §8 |
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

## 6. Private layer and activation

**6.1 Private layer.** Create `~/.supply-chain/` from the repository's `private-layer/`:

- `README.md`, `profile.md`, `agent.md` — copy only if missing (never overwrite).
- `learnings/` and `projects/` — create if missing.
- Fill `agent.md` with the paths from §1. If the user works with several agents, add one row per agent.
- **Migration:** if `~/.claude/supply-chain.local/` exists, merge its files into `~/.supply-chain/` (never overwrite a newer file), then tell the user the old folder can be deleted **[ask]**.
- If the user has their own private layer elsewhere (a private repo, a zip, a folder they name), copy it into `~/.supply-chain/` instead of the templates.
- `profile.md`: if it still contains the template placeholders, ask the user 3 questions (usual stacks, package managers, language of responses) and fill it.

**6.2 Activation block.** Read `adapters/activation.md`. Insert its block into `<instructions-file>`:

- If a block between `<!-- supply-chain:begin -->` and `<!-- supply-chain:end -->` already exists, replace it.
- Else, if the file has an older hand-written supply chain section (mentions `sc-*` skills or `supply-chain.local`), show it to the user and ask whether to replace it with the block **[ask]**.
- Else append the block at the end. Create the file if it does not exist.
- Do not change anything else in that file.

## 7. MCP servers and sync

**7.1 MCP [ask].** The supply chain works without MCP servers, but `library-docs` uses them for version-accurate documentation. Propose only what fits the user's stacks (from `profile.md`), using the registration method in the adapter:

| Server | For | Command / source |
|---|---|---|
| `context7` | docs for any library | `https://mcp.context7.com/mcp` (HTTP) |
| `angular-cli` | Angular projects | `npx -y @angular/cli mcp` |
| `primeng` | PrimeNG projects | `npx -y @primeng/mcp` |
| `engram` | persistent memory (optional) | `https://github.com/Gentleman-Programming/engram` — only if the binary is already installed |

Skip servers that are already registered.

**7.2 Sync.** Run:

```bash
node "<skills-dir>/supply-chain/scripts/sync.mjs"
```

It indexes installed skills and MCP servers into `skill-registry.md`, applies the department precondition to tool skills and creates the private layer folders. Show its output. Entries marked `auto: true` or listed under *Unassigned* are third-party skills it found; report them, do not fix them silently.

## 8. Verify and report

1. Confirm these files exist: `<skills-dir>/supply-chain/SKILL.md`, `<skills-dir>/sc-frontend/SKILL.md`, `<skills-dir>/ui-build/SKILL.md`, `~/.supply-chain/agent.md`, and the activation block in `<instructions-file>`.
2. Tell the user that skills load at session start: **they must restart the agent** (new session) for the skills to appear.
3. Give them the smoke test for the new session: *"quiero crear un modal de confirmación"* → the agent must load `sc-frontend`, print the supply chain brief, then use `ui-build`.
4. Report:

```
## Supply chain instalado
- Agente / rutas: …
- Respaldo: …
- Skills copiadas: 17 · skills de terceros eliminadas: …
- Capa privada: ~/.supply-chain (nueva / migrada / existente)
- Bloque de activación: agregado / reemplazado en …
- MCP: registrados … · omitidos …
- Sync: … · Pendiente: reiniciar el agente y probar la frase de humo
```

## 9. Update

1. Get the files (§2).
2. Back up (§3) — always, because installed skills may have learned content.
3. For each skill folder: copy new and changed files from the repository, but **merge** `## Learned rules`, `## Learned notes`, `patterns/`, `rules/` and `facts/`: keep the user's entries, add the repository's.
4. Never touch `~/.supply-chain/` except to create missing folders or files.
5. Replace the activation block (§6.2) and run sync (§7.2). Report what changed.

## 10. Uninstall **[ask]**

1. Back up (§3).
2. Remove from `<skills-dir>`: `supply-chain`, `sc-*` and the six tool skills from §5.
3. Remove the activation block from `<instructions-file>`.
4. Ask whether to keep `~/.supply-chain/` (it is the user's memory; default: keep).
5. MCP servers: list the ones the install registered and ask before removing any.
