# Critique rubric

Score each dimension 0–4 from what is observable on the running screen. Cite evidence for every score below 3.

| Score | Meaning |
|---|---|
| 4 | Exemplary; nothing to fix |
| 3 | Solid; minor nits only |
| 2 | Noticeable problems that slow or confuse users |
| 1 | Serious problems; task success at risk |
| 0 | Broken or missing |

## Dimensions
| # | Dimension | Ask |
|---|---|---|
| 1 | Task focus | Is the primary task obvious within a few seconds? Is there exactly one primary action per section? |
| 2 | Hierarchy | Does one element dominate? Do size, weight and contrast steps differ enough to scan? |
| 3 | Layout rhythm | Do edges align to a grid? Is spacing from one scale, with tighter gaps inside groups than between them? |
| 4 | Consistency | Same component and variant for the same job? Tokens instead of one-off values? |
| 5 | Feedback and states | Loading, empty, error, success, disabled and interaction states present and distinct? |
| 6 | Copy | Verb-led actions, user vocabulary, actionable errors, no redundant text? |
| 7 | Accessibility | Contrast in every theme, visible focus, keyboard path, labels, target size, reduced motion? |
| 8 | Responsiveness | Reflow at 320 px, touch targets, no hover-only affordances? |
| 9 | Character | Does it feel designed for this product, or could it be any template? |

## Severity for findings
- **P0** blocks a task or fails WCAG AA.
- **P1** causes errors, hesitation or visible inconsistency on a main path.
- **P2** cosmetic or secondary-path issue.

## Report shape
```
| Dimension | Score | Evidence |
Top findings: [P0] <finding> — <file:line | screenshot area> — fix with: <mode>
Keep: <what works and must survive refinement>
Next: <mode sequence>
```
