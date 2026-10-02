# Changelog

The installed version is in `<skills-dir>/waymark/VERSION`. When a newer version is published the agent offers the update; you can also say *"actualiza Waymark desde https://github.com/LiriRaid/waymark siguiendo su INSTALL.md"* (INSTALL §9).

## 1.8.0 (in progress, `develop`) — fewer wrong-direction attempts, checks that run themselves
Seventh real test (1.7.0): the largest cost is not the size of each step but attempts in the wrong direction. A small front-end bug cost ~9% of the 5-hour quota, ~6% of it in the API after the user had said "solo FE" (3 attempts, 14.1M tokens); an L2 with 1 attempt cost ~7%. Skipped checks repeated from test 6 (no browser-verify/code-review and no reason given, opener skipped in a turn, inferred evidence labelled "observed").
- **`Capa:`** in the opener: a layer the user named ("solo FE", "no toques la API") is binding; evidence pointing elsewhere → ask before leaving it.
- **Quick bug triage** (dept-qa) new step: a stale view after an action → check what reloads it (another tab via `window.open`, a cache in a service, a reused route) before blaming the backend. It was the real cause.
- **Sharper fields:** `Evidencia: observada <what you saw>` (code you read is not observed behavior); `Memoria: … · mem_search "<query>"` at L2+; `Navegador: … | no (requiere <physical action>; check: …)`; `Review: code-review <task's files> …` (a review without paths reviewed someone else's changes).
- **Cierre check** (`stop-hook.mjs`, Stop): a turn routed L1–L3 that changed project files must end with the Cierre; at L2+ `Navegador`/`Review` name browser-verify/code-review or say why; otherwise the agent is asked once to complete it.
- **Pre-tool checks** (`tool-hook.mjs`, now also on edits): recursive `grep`/`find` that walks `node_modules` is denied with the fix (hung 120 s, four times); an edit in an L1–L3 turn with no opener found gets a one-line note. Not a denial: Claude Code does not persist reply text written after a thinking block (checked on 2.1.286), so the transcript cannot prove the opener is missing.
- **Context notices:** the resume guard (150k tokens + 60 min idle, unchanged) now saves the stopped prompt and a new session in the same folder within 30 min takes it over, so nothing is retyped. While a session is active nothing is blocked: past 300k tokens of context (and every 200k more) a notice shown only to the user (`systemMessage`, 0 model tokens) says a new task is cheaper in a new session.
- **Claims checked against tool calls** (eighth real test, on 1.8.0-dev: the Cierre passed the format check while declaring a procedure never read, "sin infra" next to an existing spec, "Navegador: no (requiere login)" without trying, which is how a stuck tooltip reached the user, and "Review: omitido (revisión propia)"). `stop-hook.mjs` now requires the Read of the declared `procedures.md`, no spec next to the changed files for "sin infra", a real browser attempt when UI files changed (L2+), `code-review` when code changed (L2+; docs/config-only exempt) and a `mem_save` for "engram: guardado". `tool-hook.mjs` adds a note before the first L2+ edit when engram is available and no `mem_search` ran. Replayed on that session: it flags the spec, the missing browser attempt and the missing code-review.
- **The user can skip a check, for one task:** "no hagas tests", "sin navegador", "no corras code-review" → `omitido (usuario: "<their words>")` in that Cierre field and in the task's *Work in progress* entry. The end-of-turn hook accepts it only when those words are in the user's messages (prompts are persisted reliably; accents and case ignored); the next task, or "ahora sí", returns to the defaults (build, specs, unit tests, browser, code-review).
- **Pre-existing failures proven without touching the user's work:** a clean copy of HEAD (`git worktree add <tmp> HEAD` → rerun → remove) instead of `git stash`, which can lose the staged state; not allowed to run it → "no comprobado (sin permiso para <command>)" without retrying. `tool-hook.mjs` denies `git stash` (not `list`/`show`) with that method.
- **Self-evaluation guide in the repo** (`references/evaluation.md`): aligned with the current fields (Copia, Capa, mem_search at L2+), a "declared ≠ done" rule and a *Declaraciones sin respaldo* line; the local `~/.waymark/evaluation.md` becomes a pointer, so it no longer goes stale.
- **`measure.mjs`:** background-task notifications are no longer counted as prompts (they inflated attempts); a shared `transcript.mjs` reads transcripts for the hooks and `measure.mjs`.

## 1.7.0 — fewer tokens per session and per prompt
Measured in a real 500k-token session: resuming it after an hour idle cost 502k tokens of cache writes (8% of a 5-hour quota) for a one-line message; the Rule 0 reminder was re-sent in full on every prompt; the skill listing (Waymark's and the user's unused ones) is paid in every session.
- **Resume guard** (`rule0-hook.mjs`): reads the session transcript; with ≥ 150k tokens of context and ≥ 60 min idle (the prompt cache expired), it stops that one prompt (0 tokens; the user sees why) and suggests a new session or `/compact`; resending continues. `WAYMARK_RESUME_TOKENS` / `WAYMARK_RESUME_MINUTES` (0 = off).
- **Adaptive reminder:** the full Rule 0 reminder (~120 tokens) only when the last reply did not open with `Waymark →`; otherwise one line (~35).
- **Shorter triggers:** the 17 Waymark descriptions went from 8,558 to 4,407 characters (~1,000 tokens per session); procedural notes moved to the bodies they already lived in; templates and the devex procedure cap them at ~300 characters.
- **Skill fit** (`skill-fit.mjs`, Claude Code): skills you added (claude.ai synced, `~/.claude/skills`) with no invocation in 30 days → `skillOverrides: "name-only"` (still invocable); plugins with no skill used → `enabledPlugins: false`. Plan by default, `--apply` after a yes, `--restore`; never Waymark's skills, `skill-map.json` providers or bundled skills; needs 14 days of history. The session hook computes it in the background and offers it at most once a month. Verified: `name-only` drops a synced skill's description from the listing.
- **Token economy** (`protocol.md`): small tool outputs, sub-agents are not free, `/compact` is safe with L3 checkpoints, new session over resuming a large idle one.
- **`measure.mjs`:** new *Ctx* column, the context each prompt started with, to see growth per prompt.

**Sixth real test (measured on 1.7.0-dev): L1 593k tokens, 1 attempt (~1% of the 5-hour quota); L2 1.7M + a 572k second attempt.** ~95% is cached context re-read on every response, so the levers are fewer round trips and fewer attempts. The fields the agent skipped become checkable:
- **`Copia:`** in the opener when the ask is "like X": only the properties the user named (the second attempt copied X's whole rule).
- **`Procedimiento: <section> (procedures.md:<line>)`**: shows the section was read, not just named.
- **Cierre:** `Aprendido` quotes the rewritten *Work in progress* line (never "ninguno"); L2+ `Tests: rojo→verde <spec> | sin infra (<proof>)`, `Navegador: browser-verify <result> | no (<what failed when tried>)`, `Review: code-review <findings> | omitido (<why>)`.
- **Batch independent tool calls** in one response (instructions and both reminders): each response re-reads the whole context.
- **`mem_search`** only at L2+ or for a topic the injected digest lacks (the digest already covers L1).
- **Inline-script guard** (`tool-hook.mjs`, PreToolUse): denies an inline `node -e` with backticks, `${` or regex escapes (mangled by shell quoting, twice in real tests) and asks for a script file; `# waymark:allow` skips it.
- **Angular stack:** `ng build --configuration development` as the L1 compile check (templates included) instead of the full build.
- The instructions block's index is one line instead of a table (same entries).

## 1.6.0 — guest mode, third-party skills, one attempt per task (measured)
Changes accumulate on `develop` and reach `main` in one release, so installs see one update notice per release instead of one per change.

**Guest mode: Waymark adapts to whoever arrived first.** A real install next to gentle-ai showed that 1.5.0's `other-leads` still competed: the same Rule 0 block (only moved below) and Waymark's hooks kept claiming the turn. Waymark is not an orchestrator, so it now fits inside one:
- **Orchestrator already installed → `guest`** (recommended): no Waymark hooks, no Rule 0 block. The skills are registered through the orchestrator's own registry (gentle-ai: `gentle-ai skill-registry refresh`, INSTALL §7.4) and project memory travels through engram (`topic_key waymark/<slug>/…`).
- **Departments work without the block:** each `dept-*` runs a *Guest entry* (recall project memory, apply its rules and one procedure, reply in the orchestrator's format, update memory) when no Waymark block is in context.
- **Waymark first, orchestrator later → `waymark-leads`:** the session hook asks once whether to keep leading (its skills become *Fallback* via `skill-registry.md`) or step down to guest; when the listed orchestrator's markers disappear it offers the full install back.
- `other-leads` from 1.5.0 is read as `guest`; updates offer to remove the block and hooks it left.

**One attempt per task, measured.** A task costs *attempts × cost per attempt*; the four real tests went from ~20 messages per task to 1–2. This release closes the gaps that still cost attempts and adds the way to prove it:
- **Pedido · Captura** (opener): the request in the user's terms and, per image, the screen, element and state it marks; two readings → one question before editing. The one second attempt in the tests was the right fix on a misread target.
- **Third-party skills are used:** `sync.mjs` indexes other agents' skill folders (`~/.cursor`, `~/.codex`, `~/.agents`, Gemini, OpenCode) and project skill folders, guesses each one's capability, records its path (agents read and follow that `SKILL.md`), lists the six replaced community skills as *Replaced (not used)* and drops uninstalled auto entries. The session hook refreshes the registry in the background when skill folders change.
- **L3 checkpoints:** the plan lives in the task's *Work in progress* (`✔1 · ▶2 · 3`, next gate, *Descartado*) so a compaction or a new session resumes from disk instead of guessing (`protocol.md` → *L3: plan as checkpoints*).
- **Memory hygiene:** the injected memory is labelled *pointers, not facts* (the code wins and the entry gets fixed); *Work in progress* older than 14 days is flagged; entries record `decision ← evidence`; stale *Solved problems* are deleted; the project file is the source of truth over engram (`learning.md` §7).
- **Decision chain:** a fixed hand-off line between departments (`hecho · necesita · evidencia · abierto`, `protocol.md`).
- **Framework MCP servers only where the framework is used:** your servers stay registered where they are (nothing is moved or removed). `mcp-fit.mjs` reads each known project's manifests (none up to the repository root = no framework) and adds a deny rule (`mcp__<server>`) to that project's `.claude/settings.local.json` for each framework server it does not use (Angular, PrimeNG, React, Vue, Tailwind, NestJS, Prisma, Rails, Django…), lifting only its own rules when the project adopts the framework; `--apply` after a yes merges with a backup and never touches a file it cannot parse. Measured: the rule hides the server from tool search and its names/instructions from context (~120 tokens per server per request) and stops calls to the wrong framework. The session hook offers it per folder, at most once a week. Docs and memory servers are never blocked.
- **`measure.mjs`:** per prompt, responses, tool calls, images, new vs cached input, output and sub-agent tokens, the fixed context at session start, and attempts for a range of prompts. Responses streamed over several transcript lines are counted once (earlier ad-hoc counts summed them 2–3×).

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
