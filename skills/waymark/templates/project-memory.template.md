# Project: <name>

Path: <absolute path to project root>
Updated: <YYYY-MM-DD>

## Work in progress
Read first at Recall; one entry per open task, each rewritten after its own milestones (never delete another task's pending items) (not at session end: sessions can stop without warning, e.g. out of tokens). Any agent can resume from here.
- Updated: <YYYY-MM-DD HH:mm> · by: <agent>
- Task: <what the user asked, in their words> · goal: <done looks like…>
- Done: <steps finished, files touched>
- Decision: <what was decided> ← <the evidence it rests on: file:line, output, observed value>
- Plan (L3): ✔1 <step> · ▶2 <step> · 3 <step> — next gate: <command> · Descartado: <what was ruled out and why>
- Next: <ordered remaining steps>
- Open: <decisions or questions pending>
- Last request: <the user's last message, short>
<!-- When the task is finished and nothing is pending: "- Status: idle (last: <task>, <date>)" -->

## Identity
- Stack: <slug from stacks/> (<framework + version>)
- Architecture: <slug from architectures/> — <how it maps here, e.g. features/<f>/{components,services,entities,routes}>
- Package manager / build tool: <pnpm | bundle | uv | gradle | …>
- Related projects: <e.g. backend API at ../api>

## Project map
Filled by the minimal project scan (waymark `references/project-detection.md`); extended when a task explores a new area.
- Source root and layout: <e.g. src/app/{core,shared,features}>
- Path aliases: <e.g. @core/* → src/app/core/*>
- How this project builds: <composes shared pieces (e.g. every modal wraps app-modal) | builds per feature | mixed>
- Reusables (path · what it is · when to use):
  - Components / UI: <e.g. shared/components/app-modal — base dialog, wrap it for every modal>
  - Features / modules: <…>
  - Services / API clients: <…>
  - Utils / helpers / pipes: <…>
  - Models / entities / types: <…>
  - Animations / motion: <…>
  - Styles / tokens / theme: <…>
- Reference files: <one exemplary file per kind: component, service, endpoint, test — with paths>
- Config: <lint/format/test config files worth knowing>

## Quality gates (verified commands)
| Gate | Command | Verified |
|---|---|---|
| typecheck | | <date> |
| lint (changed files) | | |
| test (related) | | |
| test (full) | | |
| build | | |

## Design system
Maintained by ui-system (discover mode). Source of truth for ui-build / ui-refine.
- Direction: <tone, density, personality>
- Tokens file(s): <path>
- Palette: <roles → token names>
- Typography: <families, scale>
- Spacing / radius / elevation: <scales>
- Component library: <e.g. PrimeNG Aura preset at …>
- Motion: <durations, easings, library>

## Conventions specific to this project
- …

## Solved problems
Searched by symptom at Recall. One entry per problem that took more than one attempt; keep the dead ends, they are what saves time next time.
<!-- - [YYYY-MM-DD] Symptom: <what the user saw> · Root cause: <real cause> · Fix: <what worked, file:line> · Did not work: <attempts and why> · Cost: <attempts / requests> -->

## Gotchas
- …

## Decisions (ADR log)
- [YYYY-MM-DD] <decision> — <why>

## Repeated procedures
Count how often a project-specific procedure happens. At 2 → propose a project skill.
| Procedure | Times | Project skill |
|---|---|---|

## Project skills
- `<slug>-<topic>` — <path> — <what it triggers on>
