# library-docs facts

Verified API facts, one file per library: `facts/<library>.md` (e.g. `angular.md`, `primeng.md`, `tailwindcss.md`, `rails.md`, `nestjs.md`, `vitest.md`, `gsap.md`, `supabase.md`). This is the self-growing memory of `library-docs`: read it before a lookup, append to it after one. Starts empty.

## Admission rule
Write a fact only when all three hold:
1. **Verified** — a docs lookup in this session (dedicated MCP, context7 or official site) confirmed it.
2. **Non-obvious** — it differs from what a model would assume: renamed or removed API, changed default, version-specific signature, deprecated path that still compiles, surprising interaction between two packages.
3. **Novel** — the novelty check (supply-chain §7) found it nowhere in `../SKILL.md`, the stack profile, project memory or this folder.

Stack conventions (how the user's projects should use a library) go to `../../supply-chain/stacks/<stack>.md`, not here. Project-only quirks go to project memory.

## File format
```
# <library>

Package: <npm package / gem / module id> · Docs: <official url>

## Facts
- [YYYY-MM-DD] v<range> · <fact in one sentence> — source: <provider + library id or page> (project: <slug>)
- [YYYY-MM-DD] v<range> · SUPERSEDED by v<new range>: <old fact> — source: …
```

- `v<range>` is mandatory: `v21`, `v19-v21`, `>=4.1`, `<8`. A fact without a version is not a fact.
- One sentence per fact; link the page instead of copying the docs.
- When a newer version changes a fact, keep the old line marked `SUPERSEDED` and add the new one below it.
- More than ~15 facts in a file → group them under subheadings by topic (routing, forms, theming…) without changing their meaning.
