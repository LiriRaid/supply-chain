# Adapter · Cursor

| Key | Value |
|---|---|
| `<skills-dir>` | `~/.cursor/skills` (*verify*; fallback `~/.agents/skills`) |
| `<project-skills-dir>` | `.cursor/skills` (*verify*) |
| `<instructions-file>` | user level: Settings → Rules (not a file: show the block and ask the user to paste it); project level: `AGENTS.md` at the repository root, or `.cursor/rules/supply-chain.mdc` with `alwaysApply: true` |
| `<project-instructions-file>` | `AGENTS.md` at the project root or `.cursor/rules/*.mdc` |
| Skill loading | native Agent Skills support where available; otherwise the instructions block makes the agent read `SKILL.md` |
| Restart needed | reload the window |

## MCP registration

`~/.cursor/mcp.json` (merge, never overwrite other servers):

```json
{
  "mcpServers": {
    "context7": { "url": "https://mcp.context7.com/mcp" },
    "angular-cli": { "command": "npx", "args": ["-y", "@angular/cli", "mcp"] },
    "primeng": { "command": "npx", "args": ["-y", "@primeng/mcp"] }
  }
}
```

## Capability mapping

Same as Codex: Claude-only agents and review skills are done manually and noted in the closing report.
