# Adapter · OpenAI Codex CLI

| Key | Value |
|---|---|
| `<skills-dir>` | `~/.codex/skills` (*verify*: some versions read `~/.agents/skills`) |
| `<project-skills-dir>` | `.agents/skills` (*verify*) |
| `<instructions-file>` | `~/.codex/AGENTS.md` |
| Skill loading | native Agent Skills support (*verify* in the docs); otherwise read `SKILL.md` as the instructions block says |
| Restart needed | yes |

## MCP registration

Add to `~/.codex/config.toml` (or use `codex mcp add` if available). Merge, never overwrite other servers:

```toml
[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"

[mcp_servers.angular-cli]
command = "npx"
args = ["-y", "@angular/cli", "mcp"]

[mcp_servers.primeng]
command = "npx"
args = ["-y", "@primeng/mcp"]
```

## Capability mapping

Claude-only names in the registry (`Explore`, `Plan`, `code-review`, `simplify`, `security-review`, `update-config`) have no direct equivalent: do the step yourself (search with your tools, write the plan in the chat, review the diff) and note it in the closing report.
