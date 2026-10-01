# Adapter · Gemini CLI

| Key | Value |
|---|---|
| `<skills-dir>` | `~/.gemini/skills` (*verify*; fallback `~/.agents/skills`) |
| `<project-skills-dir>` | `.gemini/skills` (*verify*) |
| `<instructions-file>` | `~/.gemini/GEMINI.md` |
| Skill loading | native Agent Skills support where available; otherwise via the activation block |
| Restart needed | yes |

## MCP registration

`~/.gemini/settings.json` → `mcpServers` (merge, never overwrite):

```json
{
  "mcpServers": {
    "context7": { "httpUrl": "https://mcp.context7.com/mcp" },
    "angular-cli": { "command": "npx", "args": ["-y", "@angular/cli", "mcp"] },
    "primeng": { "command": "npx", "args": ["-y", "@primeng/mcp"] }
  }
}
```

## Capability mapping

Claude-only agents and review skills are done manually and noted in the closing report.
