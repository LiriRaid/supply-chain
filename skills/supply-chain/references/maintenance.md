# Maintenance

Part of the `supply-chain` core skill. Paths are relative to the core skill folder (`<skills-dir>/supply-chain/`). Read only when the instructions file or a department points here.

- **Own tool skills.** `ui-build`, `ui-refine`, `ui-system`, `ui-audit`, `browser-verify` and `library-docs` are original skills of this supply chain (`"owned": true`). They evolve only through the learning loop (`references/learning.md`): their `patterns/`, `rules/`, `facts/` folders and `## Learned notes`. External skills vendored later keep provenance in `NOTICE.md` (`vendoredFrom`, `upstreamHash`).
- **New external skill.** After the user approves and installs one (`references/skills.md`), make it owned so everything stays in `<skills-dir>` and is portable: `node scripts/sync.mjs --vendor <name>` (replaces a link with a real copy, marks it owned, adds NOTICE and the precondition), then fix its department in `skill-map.json` if it was auto-assigned.
- `node scripts/sync.mjs` — re-indexes skills and MCP servers into `skill-registry.md`, auto-assigns new skills, ensures preconditions, `Learned` sections and NOTICE files. Idempotent; `--dry-run` and `--unpatch` available.
- New stack / architecture / department → copy the matching file in `templates/`.
- Installed as a plugin, skill names are prefixed: `supply-chain:sc-frontend`. Use whichever form the session lists.
