# Subagents and search

General delegation rules. Goal: avoid spending thousands of tokens reading files sequentially before answering. They apply to any agent; map the agent names to what yours offers (Claude Code: `Explore`, `Plan`, `general-purpose`; agents without subagents: do the step yourself). **Learned rules** grows automatically when a rule proves wrong or missing.

## Search before you read
- Specific symbol or string in a known area → search directly (grep).
- Files by name → glob.
- 3+ searches needed or unclear scope → delegate to an exploration subagent.
- Never open a whole file to find one function; read only the relevant range.

## When to delegate
| Situation | Delegate to |
|---|---|
| "Where is X / who uses Y?" across the codebase | exploration agent |
| Task touches >3 files and scope is unclear | exploration first, then work |
| Feature spanning several files or layers | planning agent before coding |
| 2+ independent research tasks | parallel agents in one message |
| Long library/API research | general-purpose agent |

## When not to delegate
- One targeted lookup, or a task scoped to 1–2 known files.
- Sequential work where each step depends on the previous one.
- Simple fixes. Delegation has a startup cost.

## Writing a subagent prompt
Subagents start cold. State the goal, the project path and known files, what is already ruled out, the response format and length, and whether it may write code.

## Learned rules
<!-- - [YYYY-MM-DD] <rule> — <why> -->
