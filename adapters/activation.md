# Activation block

The installer inserts this block, unchanged, into the agent's global instructions file (`<instructions-file>` in the adapter). It is the only thing outside the skills that the supply chain needs: it tells the agent to route every non-trivial task through a department before using any other skill.

```markdown
<!-- supply-chain:begin -->
## Supply chain (always)

Every task goes through the supply chain unless it is **L0 trivial** (a color, a text, a typo, one value).

1. Load the department skill that owns the task **before any other skill**: `sc-frontend`, `sc-backend`, `sc-data`, `sc-security`, `sc-qa`, `sc-devops`, `sc-architecture`, `sc-ux-ui`, `sc-product`, `sc-devex`. If unsure which one, load `supply-chain`.
2. Follow its Entry protocol (project memory → stack profile → architecture profile → learnings → skill registry → brief), use the skills and MCP servers it selects, and close with its Exit protocol (typecheck · lint · tests · build · architecture conformance · learnings).
3. A department never gets skipped because a task "looks small". Size decides the level (L1/L2/L3), not whether the supply chain runs.

Private layer (learnings, project memory, profile, agent paths): `~/.supply-chain/`.
<!-- supply-chain:end -->
```

Agents without a skill-loading tool: "load the skill" means read `<skills-dir>/<name>/SKILL.md` and follow it.
