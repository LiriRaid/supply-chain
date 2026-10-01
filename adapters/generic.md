# Adapter · any other agent

Use this when no specific adapter fits.

| Key | Value |
|---|---|
| `<skills-dir>` | the agent's documented user skills folder; if none, `~/.agents/skills` (cross-agent convention) |
| `<project-skills-dir>` | the agent's project skills folder; if none, `.agents/skills` |
| `<instructions-file>` | the agent's global instructions file; most agents read `AGENTS.md` |
| Skill loading | if the agent has no skill tool, the activation block tells it to read `<skills-dir>/<name>/SKILL.md` |

What changes:
- Ask the user where the agent reads global instructions if its docs do not say.
- MCP: register the servers from INSTALL §7.1 with whatever the agent supports, or skip them (`library-docs` then falls back to official docs on the web).
- Record the chosen paths in `~/.supply-chain/agent.md` so every department knows them.
