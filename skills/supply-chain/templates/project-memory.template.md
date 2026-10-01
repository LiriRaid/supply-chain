# Project: <name>

Path: <absolute path to project root>
Updated: <YYYY-MM-DD>

## Identity
- Stack: <slug from stacks/> (<framework + version>)
- Architecture: <slug from architectures/> — <how it maps here, e.g. features/<f>/{components,services,entities,routes}>
- Package manager / build tool: <pnpm | bundle | uv | gradle | …>
- Related projects: <e.g. backend API at ../api>

## Project map
Filled by the minimal project scan (supply-chain §6); extended when a task explores a new area.
- Source root and layout: <e.g. src/app/{core,shared,features}>
- Path aliases: <e.g. @core/* → src/app/core/*>
- Reusables: <shared components, base services, helpers, tokens/theme — with paths>
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
