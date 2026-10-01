# Stack: <name>

## Detect
Signals the agent checks (supply-chain §6): <files / dependencies>.

## Commands
Default commands the agent runs in the Exit protocol; verify each once, then record it in project memory. `<pm>` = detected package manager.

| Gate | Command | Notes |
|---|---|---|
| typecheck | … | |
| lint | … | changed files: `…` |
| test | … | non-watch mode |
| build | … | |
| format | … | not a gate |

Project memory example (Quality gates, verified commands):

| Gate | Command | Verified |
|---|---|---|
| typecheck | … | <date> |
| lint (changed files) | … | |
| test (full) | … | |
| build | … | |

## Conventions by department
Only what is specific to this stack. General rules live in the `sc-*` department skills.

### Frontend / Backend
- …
### Testing
- …
### Data & state
- …
### Security
- …

## Tools
| Capability | Provider | Type |
|---|---|---|

## Architecture fit
Which `architectures/*.md` are common for this stack and how their folders map here.

## Anti-patterns
- …

## Official docs
- …
