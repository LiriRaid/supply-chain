# INSTALL — instructions for the agent

> **You are a coding agent (Claude Code, Codex, Cursor, Gemini CLI, OpenCode or similar) and the user asked you to install, update or uninstall Waymark.** Follow this document step by step. No installer script is needed: you do the work with your own file and shell tools.
>
> Talk to the user in their language. Ask before every step marked **[ask]**, with your choice window if the agent has one (Claude Code: `AskUserQuestion`, options as buttons, recommended first), else in text. Never touch credentials, sessions or files not listed here.

Repository: `https://github.com/LiriRaid/waymark`

---

## 0. Pick the operation

| The user said… | Do |
|---|---|
| "instálame / install Waymark" | §1 (incl. §1.1 orchestrators, §1.2 confirm) → §8 |
| "actualiza / update Waymark" | §9 |
| "desinstala / uninstall Waymark" | §10 |

## 1. Detect the agent and its paths

Identify which agent **you** are, and **every other agent installed on this machine** (config folders such as `~/.claude`, `~/.codex`, `~/.cursor`, `~/.gemini`, `~/.config/opencode`, or the agent's CLI on the PATH). Waymark can be installed in all of them at once; they share one private layer, so work started in one agent can be resumed in another. For each agent, open `adapters/<agent>.md` from the repository (`claude-code`, `codex`, `cursor`, `gemini-cli`, `opencode`, or `generic` if none fits). It gives:

- `<skills-dir>` — user-level skills folder (e.g. `~/.claude/skills`)
- `<project-skills-dir>` — project-level skills folder (e.g. `.claude/skills`)
- `<instructions-file>` — global instructions file (e.g. `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`)
- how to register MCP servers

If the adapter marks a path as *verify*, check it against your own documentation or the filesystem before using it. Tell the user in one line per agent what you detected:

```
Agente: Claude Code · skills: ~/.claude/skills · instrucciones: ~/.claude/CLAUDE.md · capa privada: ~/.waymark
También encontré: Codex (~/.codex) · Cursor (~/.cursor)
```

**1.1 Orchestrators and other agent frameworks.** Before the plan, check whether another framework already governs each agent (e.g. gentle-ai): marked blocks in `<instructions-file>` that are not Waymark's (`<!-- <name>:<section> -->`), hooks in the agent settings that do not run Waymark scripts, orchestrator/persona/trigger skills, its own skill registry. Waymark is not an orchestrator: **if one is already installed, Waymark becomes its guest** (no hooks, no Rule 0 block; its skills and memory reach the orchestrator through the orchestrator's own registry and engram). Follow the repository's `skills/waymark/references/coexistence.md` §1–§4: read its sections, write each rule as one line and classify it (Adopted · Fallback · Resolved), and find how its registry is refreshed. **Never edit that framework's files.** Tell the user in one line:

```
Orquestador ya instalado: gentle-ai (bloques gentle-ai:*, hooks propios, registro .atl/skill-registry.md) → Waymark entra como invitado: sin hooks ni bloque, sus skills por el registro de gentle-ai, memoria por engram. No toco sus archivos.
```

Nothing found → the normal plan below; Waymark leads.

**1.2 Plan and confirm [ask].** Before downloading or touching anything, show the user the plan and wait for an explicit yes:

```
Voy a instalar Waymark así:
1. Skills (17)            → ~/.claude/skills/            (respaldo previo si ya existe algo)
2. Instrucciones generales → ~/.claude/CLAUDE.md          (bloque marcado arriba; el resto no se toca)
3. Capa privada            → ~/.waymark/             (fuera de .claude; sirve para cualquier agente y se completa sola)
4. Hooks              → ~/.claude/settings.json      (memoria del proyecto al iniciar sesión ~400 tokens; recordatorio por mensaje ~90 tokens; no bloquean nada)
5. Agentes: Claude Code (este) + ¿también Codex, Cursor…? (los que encontré; misma memoria compartida)
6. Te preguntaré antes de: quitar skills de terceros, mover contenido de tu archivo de instrucciones y registrar MCP.
```

Ask it with your **choice window** if the agent has one (Claude Code: `AskUserQuestion`), the plan in the question, options as buttons:
- **Instalar (Recomendado)** — this agent, as in the plan.
- **Instalar en todos mis agentes** — only if §1 found others; lists them.
- **Cambiar algo** — the user says what (another folder, skip the hook, skip a step).
- **Cancelar**.

**§1.1 found an orchestrator →** the plan becomes the guest plan (items 2 and 4 disappear; a new step refreshes its registry) and the question offers, one question only:
- **Invitado de <framework> (Recomendado)** — skills + private layer; no block, no hooks; `<framework>` keeps its flow and loads Waymark's departments through its registry; memory through engram.
- **Waymark lidera, <framework> de respaldo** — full plan; its compatible rules adopted, its skills as fallback, turn conflicts resolved for Waymark (the user prefers Waymark's routine).
- **Solo skills** — skills + private layer; no registry step, no block, no hooks.
- **Cancelar**.

Then show the lists (Adopted · Fallback · Resolved) and let the user move any rule **[ask]**; they become `~/.waymark/coexistence.md` in §6.1 with `Mode: guest | waymark-leads | skills-only`.

Agents without a choice window: show the plan and end with *"¿Continúo?"*.

Use the real paths from the adapter. **Several agents chosen** → run §3–§7 once per agent with its own adapter (skills, instructions block, hook if supported, MCP in its own config), and §6.1 (private layer) only once. If the user says no or changes something (another folder, skip a step), adapt and show the plan again.

## 2. Get the files

Clone into a temporary folder (do not clone inside `<skills-dir>`):

```bash
git clone --depth 1 https://github.com/LiriRaid/waymark "<tmp>/waymark"
```

No git? Download `https://github.com/LiriRaid/waymark/archive/refs/heads/main.zip` and extract it. If the user gave you a local path to the repository, use that instead.

Requirement check: `node --version` must be 18 or newer (only `sync.mjs` needs it). If Node is missing, tell the user and continue; skip §7 and say so in the report.

## 3. Back up **[ask if anything exists]**

Create `~/.waymark-backups/<YYYY-MM-DD-HHmm>/` and copy into it whatever already exists of:

- `<skills-dir>/waymark`, `<skills-dir>/dept-*`, and the tool skills listed in §5
- `<instructions-file>`
- `~/.waymark/`

Report the backup path. If nothing exists, say "instalación limpia" and continue.

## 4. Replaced third-party skills **[ask]**

Waymark ships its own tool skills that replace these community skills. If any of them is installed in `<skills-dir>` (or as a link from `~/.agents/skills`), list what you found and ask before removing:

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
waymark  dept-product  dept-architecture  dept-frontend  dept-ux-ui  dept-backend
dept-data  dept-security  dept-qa  dept-devops  dept-devex
ui-build  ui-refine  ui-system  ui-audit  browser-verify  library-docs
```

Copy real files (no symlinks). If this is a reinstall and the user's installed copies have entries under `## Learned rules` / `## Learned notes`, or files in `patterns/`, `rules/`, `facts/` that the repository does not have, keep those entries: merge them into the new files instead of overwriting.

## 6. Private layer and instructions

Keep a list of **every file you create or modify** from here on; §8 reports it.

**6.1 Private layer.** Create `~/.waymark/` from `<skills-dir>/waymark/templates/private-layer/`:

| File | If missing | If it exists |
|---|---|---|
| `README.md`, `profile.md`, `preferences.md`, `subagents.md`, `projects.md` | copy the template | keep it; never overwrite |
| `agent.md` | copy and fill with the paths from §1 | add or update this agent's row only |
| `learnings/`, `projects/` | create | keep |
| `coexistence.md` | only if §1.1 found another framework: from the template, with the mode and the three lists confirmed in §1.2 | update `Mode`, `Frameworks` and the lists the user confirmed; keep the rest |

These files start generic on purpose. **Do not ask the user to fill them**: Waymark completes them automatically while they work (stacks and projects on first detection, preferences from corrections, see `waymark` §6–§7).

- **The user's own layer:** if they name one (a private repository, a zip, a folder), copy it into `~/.waymark/` instead of the templates.

**6.2 Instructions block.** Insert `<skills-dir>/waymark/templates/instructions.md` (everything from `<!-- waymark:begin -->` to `<!-- waymark:end -->`) into `<instructions-file>`. It holds the general working rules and the mandatory use of Waymark; it contains no stack or personal data.

- File missing → create it with the block.
- Block already present → replace it in place.
- Mode `guest` or `skills-only` → **no block**: nothing in the instructions file competes with the orchestrator.
- File exists without the block → add the block **at the top** and leave the rest of the file untouched. Another framework's blocks are never moved, edited or offered for moving. Then read the rest of the file and list for the user the parts that are now covered by the block or the private layer (an older Waymark section, rules about subagents, delivery preferences, project descriptions, links to files such as `Agents.md` or `user-preferences.md`). Offer **[ask]**: move each part into the matching private-layer file (`subagents.md`, `preferences.md` → *Learned preferences*, `projects.md`, `profile.md`) and remove it from the instructions file. Never delete content the user did not approve.
- Agents whose instructions are not a file (e.g. Cursor user rules): show the block and ask the user to paste it.

## 7. MCP servers and sync

**7.1 MCP [ask].** Waymark works without MCP servers; `library-docs` uses them for version-accurate documentation. Register only what the user accepts, with the method in the adapter, and skip servers already registered.

| Server | Propose when | Command / source |
|---|---|---|
| `context7` | always (docs for any library) | `https://mcp.context7.com/mcp` (HTTP) |
| `engram` | recommended: persistent memory across sessions (the instructions block uses it to search before re-reading and to save decisions) | `https://github.com/Gentleman-Programming/engram` — if the binary is missing, offer to install it following its README **[ask]**; register it with the adapter's command |
| stack-specific servers | only when the user works with that stack | entries in `skill-map.json` → `mcp` with a `stack` field |

The stack-specific entries shipped today are **examples** for Angular (`angular-cli`: `npx -y @angular/cli mcp`, `primeng`: `npx -y @primeng/mcp`). On a fresh machine the stack is usually unknown: skip them, and let `dept-devex` propose the right server later, when a project of that stack is detected (`waymark` §5).

**7.2 Hooks (installed by default).** Two small local scripts. **Session memory** (`session-hook.mjs`, at session start, after `/clear` and after a context summary): injects a capped digest (≤ 2,500 chars, usually ~400 tokens) of this machine's *Environment* and the current project's memory, so Recall never depends on the agent remembering to read it. **Rule 0 reminder** (`rule0-hook.mjs`, per prompt). The instructions block can be ignored in long sessions; a per-prompt reminder keeps Waymark on every request. Once a day it also checks the repository's `VERSION` (1.5 s timeout, silent offline) and, only when a newer version exists, tells the agent to offer the update (§9) at most once a day; commits without a version change never trigger it. It runs locally (0 tokens to execute) and adds ~70 tokens of context per prompt; it never blocks or changes the prompt. Include it in the §1.2 plan. With `coexistence.md` the session hook also injects its rules (≤ 1,800 chars) and the reminder follows the mode.

- **Claude Code:** merge into `~/.claude/settings.json` (keep every existing key and hook; do not duplicate a hook whose command already runs `rule0-hook.mjs` or `session-hook.mjs`):

```json
{ "hooks": {
  "UserPromptSubmit": [ { "hooks": [ { "type": "command", "command": "node \"<skills-dir>/waymark/scripts/rule0-hook.mjs\"" } ] } ],
  "SessionStart":     [ { "hooks": [ { "type": "command", "command": "node \"<skills-dir>/waymark/scripts/session-hook.mjs\"" } ] } ]
} }
```

  Use the absolute path with forward slashes. Verify: `echo {} | node "<skills-dir>/waymark/scripts/rule0-hook.mjs"` and `echo {} | node "<skills-dir>/waymark/scripts/session-hook.mjs"` each print JSON with `additionalContext`.
- **Coexistence mode:** `guest` or `skills-only` → register **neither** hook (the orchestrator's hooks own the turn). `waymark-leads` → both hooks, added after the other framework's; never remove or reorder its hooks.
- **Other agents:** if the adapter documents a per-prompt hook, register the same script there; otherwise skip it (the instructions block still applies) and say so in the report.
- Report it under *Archivos modificados* (`settings.json — hook Rule 0 agregado`).

**7.3 Sync.** Run:

```bash
node "<skills-dir>/waymark/scripts/sync.mjs"
```

It indexes installed skills (this agent's, other agents' skill folders such as `~/.cursor/skills` or `~/.agents/skills`, plugins and project skill folders, each with its path) and MCP servers into `skill-registry.md`, applies the department precondition to tool skills and creates the private layer folders. Show its output. Entries marked `auto: true` or under *Unassigned* are third-party skills it found; report them, do not fix them silently. In `waymark-leads` this is how the other framework's skills become available as *Fallback*. Afterwards the session hook re-runs it in the background whenever skill folders change; no manual sync is needed for new third-party skills.

**7.4 Orchestrator registry (`guest` only).** Run the orchestrator's refresh so it indexes the copied skills (`coexistence.md` §4; gentle-ai: `gentle-ai skill-registry refresh`). Check that its registry now lists `waymark` and the `dept-*` skills and report it. If it does not scan `<skills-dir>`, tell the user where it scans and ask **[ask]** before copying the skills there too. Never edit its registry by hand.

## 8. Verify and report

1. Confirm these exist: `<skills-dir>/waymark/SKILL.md`, `<skills-dir>/dept-frontend/SKILL.md`, `<skills-dir>/ui-build/SKILL.md`, `~/.waymark/agent.md`, `~/.waymark/preferences.md`, and the block in `<instructions-file>` (in `guest`: `~/.waymark/coexistence.md` and the orchestrator's registry listing the skills, instead of the block).
2. Tell the user that skills load at session start: **they must restart the agent** (new session).
3. Smoke test for the new session: *"quiero crear un modal de confirmación"* → the agent must load `dept-frontend`, print Waymark brief, then use `ui-build`. In `guest`: the orchestrator's flow runs as before and loads `dept-frontend` from its registry, with no Waymark opener.
4. Report, listing **every file created or modified** (from §6 on), so the user knows what changed:

```
## Waymark instalado
- Agentes / rutas: … (uno por línea)
- Versión: <skills-dir>/waymark/VERSION
- Respaldo: ~/.waymark-backups/<fecha>/
- Skills: 17 copiadas · de terceros eliminadas: …
- Archivos modificados según INSTALL.md:
  - <instructions-file> — bloque agregado arriba / reemplazado (resto intacto)
  - ~/.waymark/agent.md — creado / fila agregada
  - ~/.waymark/{profile,preferences,subagents,projects}.md — creados (se completan solos al trabajar)
  - …
- Movido a la capa privada con tu permiso: …
- Coexistencia: <framework> · modo … · adoptadas N · respaldo N · resueltas N · sus archivos: sin cambios   (solo si §1.1 encontró otro)
- MCP: registrados … · omitidos …
- Sync: … (skills de otros agentes: N) · Medir una tarea: node <skills-dir>/waymark/scripts/measure.mjs --turns a-b
- Pendiente: reiniciar el agente y probar la frase de humo
```

## 9. Update

1. **Compare versions.** Read the installed `<skills-dir>/waymark/VERSION` (missing = older than 0.3.0) and the repository's. Same version → say it is up to date and stop unless the user insists. Otherwise show the user the `CHANGELOG.md` entries between both versions and wait for a yes **[ask]**.
2. Get the files (§2) and back up (§3) — always, because installed skills may have learned content. Update every agent where Waymark is installed (§1), unless the user names one.
3. For each skill folder: copy new and changed files, delete files the repository removed (only inside the 17 Waymark skills), but **merge** `## Learned rules`, `## Learned notes`, `patterns/`, `rules/` and `facts/`: keep the user's entries, add the repository's.
4. `~/.waymark/`: only create missing files or folders from the templates; never edit existing ones. Existing `projects/<slug>.md` files gain new template sections (e.g. *Work in progress*) the next time a task runs there; do not rewrite them now.
   `skill-map.json`: take every entry from the repository, then add back the installed entries the repository does not have (skills and MCP servers the user created or mapped, project skills).
5. Re-run §1.1: a framework or rules that `~/.waymark/coexistence.md` does not list yet → classify only those and ask **[ask]** (no such file yet and a framework found now → the §1.2 question: keep leading or become guest). `Mode: other-leads` from 1.5.0 → offer to switch to `guest`: remove Waymark's block and hooks (backup first).
6. Per mode: leading → replace the instructions block (§6.2) and make sure both hooks are registered (§7.2; versions before 1.4.0 only had the Rule 0 one); `guest` → no block, no hooks, re-run the orchestrator's refresh (§7.4). Then run sync (§7.3).
7. Report with the same list of modified files as §8, plus `Versión: <old> → <new>`.

## 10. Uninstall **[ask]**

1. Back up (§3).
2. Remove from `<skills-dir>`: `waymark`, `dept-*` and the six tool skills from §5.
3. Remove the block between the `waymark` markers from `<instructions-file>`; leave the rest. Remove the hook entries that run `rule0-hook.mjs` and `session-hook.mjs` from the agent settings.
4. Ask whether to keep `~/.waymark/` (it is the user's memory; default: keep). A coexisting framework needs nothing: its files were never changed. In `guest`, re-run its registry refresh so it stops listing Waymark's skills.
5. MCP servers: list the ones the install registered and ask before removing any.
