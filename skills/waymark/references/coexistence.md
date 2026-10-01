# Coexistence with other agent frameworks

Read when the installer (INSTALL §1.2), an update (§9) or the session hook finds another framework that also governs the agent: a marked block in the instructions file that is not Waymark's (e.g. `<!-- gentle-ai:persona -->`), hooks that do not run Waymark scripts, or skills/agents that orchestrate work (SDD flows, persona, review triggers, delegation rules).

**Principle: Waymark adapts; the other framework is never edited.** Its blocks, hooks, skills, agents and registries stay byte-for-byte as they are. Every adaptation lives on Waymark's side, in `~/.waymark/coexistence.md`, which the session hook injects at session start. Uninstalling Waymark leaves the other framework exactly as it was.

## 1. Detect

For every agent being installed (`~/.waymark/agent.md` → `<instructions-file>`):
1. Instructions file: list HTML-comment markers with a namespace other than `waymark` (`<!-- <name>:<section> -->`) and headings that define a persona, an orchestrator, a memory protocol or triggers.
2. Agent settings: hooks whose command does not run `rule0-hook.mjs` or `session-hook.mjs`.
3. `<skills-dir>`, plugins and agent folders: skills or agents that belong to the same framework (same prefix, same source, referenced from its block).

Read each section once and write its rules as one line each. Do not guess rules you did not read.

## 2. Classify every rule

Ask one question per rule: **does it act at the same moment as a Waymark rule?** Moments: first text of the turn, before the first edit, delegation, memory, language of code and commits, commits/PRs, closing a change.

| Class | Test | Goes to |
|---|---|---|
| **Adopted** | different moment, or same moment with an outcome Waymark accepts (a preference, a tool choice, a stricter check) | *Adopted*: Waymark follows it as a user preference |
| **Fallback** | it names a skill, agent, workflow or tool that covers a capability | *Fallback*: `capability → provider`; used when Waymark has no provider for it, or at *When stuck* (2nd failed attempt) |
| **Resolved** | same moment, incompatible outcome | *Resolved*: who wins and how, according to the mode |

## 3. Pick the mode [ask]

One question, choice window if the agent has one, plan and conflict count in the question:

| Mode | Waymark | The other framework |
|---|---|---|
| `waymark-leads` (Recommended) | Rule 0 complete (opener, Memoria, Cierre); block on top; both hooks | *Adopted* rules followed; *Fallback* providers used; conflicts resolved in Waymark's favor |
| `other-leads` | block **below** the other framework's content; no opener; departments are knowledge loaded when a task matches; project memory still recalled and updated; session hook only | keeps its flow; *Resolved* entries say where Waymark steps aside |
| `skills-only` | skills + private layer only; no block, no hooks | untouched; Waymark used on demand |

## 4. Write `~/.waymark/coexistence.md`

From `templates/private-layer/coexistence.md`: `Mode`, `Frameworks` (name · markers · hooks · skills), then *Adopted*, *Fallback*, *Resolved*, one line each, ≤ ~1,800 characters in total (the hook injects them every session and cuts beyond that). Show the three lists to the user before writing **[ask]**; they can move any rule to another list.

Never `--vendor`, patch or map into `skill-map.json` a skill that belongs to the other framework; its own registry stays separate.

## 5. Re-check

- **Update (§9):** detect again; new rules or a new framework → classify only the new ones and ask.
- **Session hook:** a framework namespace in the instructions file that `coexistence.md` does not list → it asks the agent to offer the configuration before the task.
- **The user changes the mode** ("que gentle-ai mande", "Waymark primero") → move the block (top or below), register or remove the Rule 0 hook, update `Mode`.

## Worked example: gentle-ai, mode `waymark-leads`

```
Mode: waymark-leads
Frameworks: gentle-ai · markers gentle-ai:persona, engram-protocol, sdd-orchestrator, trigger-rules · skills sdd-*, review-*, judgment-day

## Adopted
- Commits: conventional commits, no AI attribution (overrides the agent's default attribution).
- Shell tools: rg/fd/bat/sd/eza when installed (Environment says which exist), else the agent's own tools.
- One question per choice window; short answers; after asking, stop and wait.
- Never agree without verifying (same as Evidencia).
- Persona tone only in chat; the opener and Cierre keep their format.
- engram: mem_save after decisions/bugfixes/findings; mem_session_summary before closing and after compaction (satisfies Cierre → engram).
- Delegation: ≥4 files to understand or ≥2 non-trivial files to write → subagent, with the department skill path in its prompt.

## Fallback
- review.diff (Cierre → Review) → review-readability; pre-PR on auth/update/security/payments or >400 lines → the 4 reviews in parallel.
- L3 plan → SDD (explore → propose → spec/design → tasks → apply → verify → archive), artifacts in engram.
- When stuck (2nd failed attempt) → judgment-day.
- Structural code questions (Q) → CodeGraph first.

## Resolved
- First text of the turn → Waymark opener; persona applies to the rest of the reply.
- "The main agent coordinates and does not execute" → the main agent routes (opener, dept skill, Memoria, Cierre); execution is delegated by the Adopted thresholds.
- Language of code/UI/docs → the project's established language; no convention yet → neutral English.
- Pre-commit triggers + Cierre Review → one review: the trigger's result fills the Review field.
- Models per phase → only inside SDD flows.
```

In `other-leads` the same rules flip: the orchestrator delegates, sub-agents receive Waymark department skill paths as knowledge, and Waymark keeps only Recall (project memory) and Aprendido (Work in progress, Solved problems).
