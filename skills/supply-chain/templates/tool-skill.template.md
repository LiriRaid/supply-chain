---
name: <capability-name>
description: "Supply chain tool skill (<capability>), owned by <sc-department>. Use when <concrete situations and phrases, English + Spanish>. Load <sc-department> first if it is not loaded. Works in any stack through the stack profile. Not for <what it is not for>."
---

# <Tool name>

> **Precondition.** Tool of `<sc-department>`. If that department skill is not loaded in this conversation, load it first and use its brief (what, why, where, how) as the input of this skill. Skip only for L0 edits.

## Approach
The thinking model of this tool in 5–10 lines: what it optimizes for, the questions it asks before acting, the principles it never trades away.

## Inputs
| Input | Source |
|---|---|
| Brief | the department brief |
| Stack conventions | `../supply-chain/stacks/<stack>.md` → section relevant to this tool |
| Project context | `~/.supply-chain/projects/<slug>.md` → relevant sections |
| Known patterns | `patterns/` in this skill (generic) + project skills (project-specific) |

## Modes
One block per mode (e.g. build · critique · polish · animate). Each: when → steps → output.

### <mode>
- **When:** …
- **Steps:** 1. … 2. …
- **Output:** …

## Stack adapters
How the approach maps to concrete stacks. Only the minimum; details live in the stack profiles.

| Stack | Notes |
|---|---|

## Output contract
What this skill always returns to the department (files changed, decisions, checks run, open risks).

## Pattern library (grows with use)
- Before building, list `patterns/` and read the matching file, if any.
- After building something reusable that has no pattern yet (a modal, a data table, a stepper…), write `patterns/<pattern>.md` from `../supply-chain/templates/pattern.template.md`: stack-agnostic intent, anatomy, states, a11y, pitfalls, and one short adapter per stack it was built in. Project-specific details go to project memory, not here.
- Update an existing pattern only with new, verified information (novelty check, supply-chain §7).

## Learned notes
_Grows with use (supply-chain §7). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._
