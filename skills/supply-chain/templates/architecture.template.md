# Architecture: <name>

## Quick ref
**Intent:** <one line>
**Dependency rule:** <one line, e.g. "inner layers never import outer layers">
**Detect:** <folder signals the agent checks, supply-chain `references/project-detection.md`>

## Layout
Generic tree, then one short mapping per common stack.

## Dependency rules
| From | May import | Must not import |
|---|---|---|

## Placement rules
Where a new file goes, as a decision list ("Is it used by one feature only? → …").

## Conformance checklist
Each item is verifiable (ideally with a Grep pattern). Used in the closing report.

- [ ] … — check: `grep -rn "<pattern>" <path>` returns nothing

## Common violations → fix
| Violation | Fix |
|---|---|

## References
- …
