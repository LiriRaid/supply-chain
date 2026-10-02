---
name: dept-<department>
description: "Waymark · <Department name> department. Use FIRST, before any tool skill, whenever the user asks <what this department owns, with concrete phrases in the user's language and English>. Loads the department rules (what, why, where, how) and decides which skills and MCP servers to use. Not for trivial edits."
---

# <Department name>

## Quick ref
**Mission:** <one line>
**Must:** <3–5 rules separated by ·>
**Skills by default:** <skills from skill-registry.md, separated by ·>
**DoD:** <one line>

## Entry
Run the *Waymark protocol → Entry* from the instructions file (already in context; do not load the `waymark` skill for it). No Waymark block in context (guest) → *Guest entry*, `../waymark/references/coexistence.md` §3. Department-specific reads:
- Learnings: `~/.waymark/learnings/dept-<department>.md` if it exists.
- Stack profile: <which sections at L1, full at L2+>.
- Tools: the **Tools** table below. Open `../waymark/skill-registry.md` only if a capability there has no installed provider.

## Brief questions
1. **What** … 2. **Why / for whom** … 3. **Where** … 4. **How and done** …

## Scope
- Owns: …
- Does not own: … → `dept-…`

## Procedures
Detailed steps live in `procedures.md` (same folder). **Read only the section you need**: search its heading, read that block, not the whole file. Anti-patterns and references are at the end of that file.

- <Task type>

## Rules
- **MUST** …
- **SHOULD** …
- **MUST NOT** …

## Tools
| Capability | Skill / MCP / Agent | When | Level |
|---|---|---|---|

## Definition of Done
- [ ] Exit protocol (instructions file → Exit; L2+ full: `../waymark/references/protocol.md`)
- [ ] …

## Hand-offs
- To `dept-…`: when …

## Learned rules

_Grows with use (waymark `references/learning.md`). Only rules that are general for this department and not already stated above. Format: `- [YYYY-MM-DD] <rule> — <why> (source: <project>)`._
