# Changelog

The installed version is in `<skills-dir>/waymark/VERSION`. When a newer version is published the agent offers the update; you can also say *"actualiza Waymark desde https://github.com/LiriRaid/waymark siguiendo su INSTALL.md"* (INSTALL §9).

## 1.6.0 — in progress (branch `develop`)
Changes accumulate on `develop` and reach `main` in one release, so installs see one update notice per release instead of one per change.

**Guest mode: Waymark adapts to whoever arrived first.** A real install next to gentle-ai showed that 1.5.0's `other-leads` still competed: the same Rule 0 block (only moved below) and Waymark's hooks kept claiming the turn. Waymark is not an orchestrator, so it now fits inside one:
- **Orchestrator already installed → `guest`** (recommended): no Waymark hooks, no Rule 0 block. The skills are registered through the orchestrator's own registry (gentle-ai: `gentle-ai skill-registry refresh`, INSTALL §7.4) and project memory travels through engram (`topic_key waymark/<slug>/…`).
- **Departments work without the block:** each `dept-*` runs a *Guest entry* (recall project memory, apply its rules and one procedure, reply in the orchestrator's format, update memory) when no Waymark block is in context.
- **Waymark first, orchestrator later → `waymark-leads`:** the session hook asks once whether to keep leading (its skills become *Fallback* via `skill-registry.md`) or step down to guest; when the listed orchestrator's markers disappear it offers the full install back.
- `other-leads` from 1.5.0 is read as `guest`; updates offer to remove the block and hooks it left.

## 1.5.0 — coexistence with other agent frameworks
A real install met gentle-ai (persona, engram protocol, SDD orchestrator, review triggers) and could only offer "skills only" or "full install with conflicting rules". Now Waymark adapts instead of competing:
- **Detect and classify** (INSTALL §1.1, `references/coexistence.md`): every rule of the other framework becomes *Adopted* (Waymark follows it), *Fallback* (its skill backs a capability, or *When stuck*) or *Resolved* (same-moment conflict, per mode).
- **Who leads [ask]:** `waymark-leads` (recommended), `other-leads` (block below theirs, no opener, session hook only) or `skills-only`. The user can move any rule.
- **Their files are never edited;** the adaptation lives in `~/.waymark/coexistence.md`.
- **Session hook** injects it (≤ 1,800 chars) and, when the instructions file carries a framework marker the file does not list, asks the agent to offer configuring it before the task.
- **Rule 0 hook** follows the mode (full, support reminder or silent).
- Updates re-check new frameworks and rules; uninstall leaves the other framework untouched; `sync.mjs` never creates `coexistence.md` on its own.

## 1.4.0 — memory injected at session start
Fourth real test: right decision on the first try (4/4), department first, procedure sections read, tests 10/10 + build, Solved problems and engram saved. Gaps: the opener asked for "Memoria: leída" before any tool call (impossible to fill truthfully), Environment was not read (python tried again), L2 checks skipped, code from another task deleted without asking.
- **Session memory hook** (`session-hook.mjs`, SessionStart): injects this machine's *Environment* and the project's memory digest (Solved problems symptoms, gates, Work in progress), capped at 2,500 chars. Recall no longer depends on the agent.
- **Opener in two moments:** routing line first; `Memoria · Reutiliza · Evidencia · Procedimiento` before the first edit.
- **L2+ Cierre fields:** `Tests: rojo→verde | sin infra · Navegador · Review`.
- **API verification:** official docs or the installed package source, cited.
- Removing code not written in this task needs a yes.
- INSTALL registers both hooks; updates add the new one.

## 1.3.0 — template instead of rules
Three real tests: the right decision on the first try 3/3. What sits in the **first text and first tool call** is always done; rules placed "in the middle" (brief lines, procedure, memory search) kept being skipped, and every evaluation proposed more rules. So 1.3.0 turns rules into **fields**:
- Every turn opens with two lines: the routing line and `Memoria · Reutiliza · Evidencia · Procedimiento`; every change closes with `Gates · Aprendido · engram`. Each field is a step that must be filled truthfully.
- Evidence that cannot be observed is declared as *hipótesis* with the user's one-line check **before** the fix.
- Only skills that will be invoked are listed; a support department only if its Quick ref was read; library internals count as API → `library-docs`.
- Visual bugs route to `dept-frontend`; `dept-qa` owns tests, review and bugs with no clear layer.
- *Work in progress* is per task; other tasks' pending items are kept.
- Instructions block 5.7k → 4.7k characters; hook reminder matches the template.

## 1.2.0 — lessons from the second real test
The second test confirmed 1.1.0 (routing line first, department skill as the first tool call, Spanish narration, build gate, reuse found, right result first try). Remaining gaps:
- **Environment knowledge:** `profile.md` gets an *Environment* section (OS, shell, missing tools, how to edit files), read at Recall and filled by the learning loop, so no session wastes attempts (e.g. heredoc → missing python → Edit).
- **Verifiable memory step:** the brief states `Memoria: leída | creada <file>` before the first edit.
- **Announced skills are invoked** with the skill tool; no announcing skills that are not used.
- **No unrequested behavior:** extras are proposed, not implemented.
- **Gates after the last edit;** L2 without a spec: add one where the project tests that kind of file, else say "sin infraestructura de test" and give a one-line check.
- `dept-frontend` Quick ref lists the key UX musts.

## 1.1.0 — lessons from the first real test
The first real test fixed in one attempt a bug that had failed over 20 times, but the agent skipped the "expensive" parts of the routine on a quick fix. This release makes them cheap and concrete:
- **First actions are explicit:** first text is the routing line, first tool call is the owner `dept-*` skill; all text in the user's language (block and hook).
- **Minimal bootstrap:** a missing project memory is created in one step (identity + gates from the project's own docs or manifest); the full scan is for L2+.
- **L1 minimum gate:** lint or typecheck of the changed files (UI: quickest compile check).
- **Evidence plan B:** without a browser or behind a login, give the user a one-line DevTools/console check and mark the fix *no verificado*.
- **Learn always:** a missing memory file is no reason to skip *Work in progress* and *Solved problems*.
- **Quick bug triage** procedure in `dept-qa`.
- Instructions block rewritten shorter.

## 1.0.0 — first release as Waymark
- **Departments:** 10 department skills (`dept-product`, `dept-architecture`, `dept-frontend`, `dept-ux-ui`, `dept-backend`, `dept-data`, `dept-security`, `dept-qa`, `dept-devops`, `dept-devex`) plus the `waymark` core and 6 tool skills (`ui-build`, `ui-refine`, `ui-system`, `ui-audit`, `browser-verify`, `library-docs`).
- **Rule 0 on every request:** recall → route → skills → verify → learn; questions in read-only consult mode; routing line at the start of every reply; per-prompt reminder hook.
- **Layered loading:** instructions block → one department → one procedure → one mode; references only when needed.
- **Right decision, faster:** reuse before create, minimal project scan with a project map, evidence before change, two-strike rule, official docs escalation, *Solved problems* with dead ends.
- **Self-filling memory** in `~/.waymark/`, shared by every agent, with *Work in progress* so another session or agent resumes where the last stopped.
- **Grows with use:** missing skills are created (global or project, asked), unknown architectures get a generated profile, the user's own MCP servers are mapped and used.
- **Install, update and uninstall** written for the agent (INSTALL.md), multi-agent, with choice windows, backups and daily update notices.
