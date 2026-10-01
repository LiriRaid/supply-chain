# library-docs · mode: migrate

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** upgrading a major or minor, removing a deprecation, adopting a new API across the code base.
- **Steps:** 1. Detect current and target versions. 2. Ask the provider for the official migration guide or update path between those versions (Angular: `search_documentation` plus `onpush_zoneless_migration` when relevant; also the official schematics such as `ng update`). 3. List breaking changes that touch code in this project (Grep each removed or renamed symbol). 4. Hand the list to `sc-architecture` for L3 planning; do not start a cross-cutting migration from this skill alone.
- **Output:** version path, breaking changes with affected files, recommended order, commands to run.
