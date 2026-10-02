# Self-evaluation

When the user says **"evalúa tu trabajo"** (or "evalúa tu trabajo con evaluation.md"), audit the task(s) of this session **with evidence**: quote your own tool calls, files and outputs, not memory. Be strict; report what failed as clearly as what worked. Waymark aims at the **right decision with fewer attempts** (a task costs *attempts × cost per attempt*), without taking decisions away from the agent.

**User decisions win, per task.** A check the user asked to skip ("no hagas tests") is ✔ when the field says `omitido (usuario: "<their words>")` and those words are in their messages; it applies to that task only — skipping it in the next task without being asked again is ✘.

**Declared ≠ done.** Every field of the opener and the Cierre is a claim; it counts only if a tool call in the transcript backs it (a `Read` of the procedure section, a `browser-verify`/`run` call, a `code-review` call, a `mem_search`/`mem_save` call, the gate command and its output). A claim with no call behind it is ✘ and is reported as a false declaration.

## 0. Proportional to level
- **L1:** routing line; opener (Pedido · Captura [· Copia · Capa]; Memoria · Reutiliza · Evidencia · Procedimiento) filled truthfully; department skill first; exact target; evidence observed or a declared hypothesis with its check; L1 gate after the last edit; Cierre with Aprendido quoting the rewritten *Work in progress* line. `mem_search`, `library-docs`, extra procedures only when actually needed.
- **L2+:** everything below. **L3:** also section 2b.

## 1. Routine (Rule 0) — did it happen, in order?
| Check | ✔ when | Evidence to cite |
|---|---|---|
| Routing | each reply starts `Waymark → L<n>|Q · dept-… · skills: …`, and every skill listed was invoked | first line; Skill calls |
| Pedido · Captura | before the first edit; the target it names is the one edited; one question when two readings changed the result; "like X" → *Copia* lists only what was named; a layer the user named → *Capa*, and it asked before leaving it | the line; edited files |
| Recordar | the injected digest cited; the project file read when the task relates to an entry; at L2+ (or a topic the digest lacks) `mem_search` before the first edit when engram is available | Read of `~/.waymark/projects/<slug>.md`; `mem_search` call |
| Enrutar | owner `dept-*` loaded before any other skill or edit; the declared *Procedimiento* section was actually read (`procedures.md` Read/Grep) | order of Skill/Read calls |
| Skills | the department's Tools used where they apply: `library-docs` (or the installed package source) for every API not verified this session; at L2+ with UI changes a real `browser-verify`/`run` attempt; at L2+ with code changes `code-review` on the task's files | Skill calls and their arguments |
| Verificar | the project's gates after the last edit: typecheck/lint (L1), + tests and build (L2+); "pre-existing failure" proven in a clean copy of HEAD (or "no comprobado (sin permiso …)"), never by stashing the user's changes; "sin infra" only when no spec exists next to the changed files | commands and real output |
| Aprender | *Work in progress* rewritten as `decision ← evidence`; *Solved problems* for a bug that took more than one attempt; memory the code contradicted fixed; `engram: guardado` only with a `mem_save` in that turn | files written; `mem_save` calls |
| Cierre | `## Cierre` with every field for the level, each backed by a call | last reply |

Hooks run some of these checks themselves (resume guard, pre-tool checks, end-of-turn Cierre check). Report when one fired and whether the agent fixed the cause or only reworded the field.

## 2. Right decision — did it get there without guessing?
- **Understood the ask:** did *Pedido · Captura* name the element the user meant (screenshot included)? Was a correction needed because it fixed the right thing in the wrong place or layer?
- **Exact target:** identified before editing, or edited and corrected later?
- **Reuse before create:** the project's reusable pieces found and used (`Reutiliza: …`)?
- **No hallucination:** every API, prop, path, class or command exists in the code or the official docs for the installed version. Any memory entry trusted that turned out stale?
- **Attempts:** how many user prompts the task took; if ≥ 2, why (misread ask, wrong layer, guessed API, bug it introduced, skipped verification that would have caught it), and whether the two-strike rule was applied.
- **Scope:** only what was asked; behavior preserved; any behavior change confirmed with the user first.

## 2b. Large tasks (L3)
- Plan first, split into L1/L2 steps each with its own gate?
- Steps kept in *Work in progress* (`✔1 · ▶2 · 3`, next gate, *Descartado*), a step ✔ only after its gate?
- After a compaction or a new session, resumed from the entry instead of re-exploring or guessing?
- Hand-offs between departments in the fixed line (`hecho · necesita · evidencia · abierto`)?
- Sub-agents only for broad searches?

## 3. Efficiency and consumption
- Anything loaded that was not needed (whole files, all modes, references "just in case", recursive searches through dependencies, an MCP the project's framework does not use)?
- For a request similar to an earlier one: did Recall make it faster (no re-scan, reused pattern or memory)?
- **Measure** (run it, do not estimate): `node <skills-dir>/waymark/scripts/measure.mjs --turns <a>-<b>` in the project folder. Report attempts, responses, tool calls, new input · cached input · output · sub-agent tokens, the fixed context at session start and the *Ctx* growth. Add the plan-quota % the user noted before and after (the agent cannot read it).

## 4. Report format
```
## Evaluación Waymark
Rutina: Pedido·Captura ✔/✘ · Recordar ✔/✘ · Enrutar ✔/✘ · Skills ✔/✘ · Verificar ✔/✘ · Aprender ✔/✘ · Cierre ✔/✘
Declaraciones sin respaldo: ninguna | <campo: lo declarado → lo que muestran las llamadas>
Decisión correcta: ✔/✘ — intentos: N — alucinaciones: ninguna | <lista>
Reutilizó: <pieza> | no aplicaba | ✘ creó algo que ya existía
Hooks: <cuál disparó y qué se corrigió> | ninguno disparó
L3: plan en checkpoints ✔/✘ · retomó tras compactación ✔/✘/no aplicó · traspasos ✔/✘   (solo L3)
Consumo: intentos N · respuestas N · tools N · tokens nuevos X · cacheados Y · salida Z · sub-agentes W · contexto fijo F · cuota A% → B%
Carga innecesaria: <qué>
Qué falló y por qué (con evidencia): …
Qué mejorar en Waymark (campo, hook, skill, plantilla — no reglas en prosa): …
```
If you maintain Waymark (its repository has a project memory file in `~/.waymark/projects/`), add the general improvements to that file → *Work in progress → Open*; otherwise list them in the report only.
