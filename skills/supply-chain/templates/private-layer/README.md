# ~/.supply-chain — private layer

This user's memory of the supply chain. The same for every agent, never published, never overwritten by installs or updates. Everything here **fills itself** as the user works (supply-chain skill §6 and §7).

| File | What | Filled by |
|---|---|---|
| `agent.md` | skills folder and instructions file of each agent on this machine | installer |
| `profile.md` | stacks, package managers, architectures used | project detection |
| `preferences.md` | how to communicate and deliver | user corrections |
| `subagents.md` | search and delegation rules | experience |
| `projects.md` | index of projects and how they relate | first task in each project |
| `projects/<slug>.md` | stack, verified gate commands, gotchas, decisions, project skills | every task |
| `learnings/sc-<dept>.md` | lessons seen once (staging) | learning loop |

To use it on several machines, keep it in a **private** repository.
