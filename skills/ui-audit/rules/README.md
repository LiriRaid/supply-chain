# ui-audit rule set

Original rules derived from WCAG 2.2 level AA and common web interface practice. Local, versioned with the supply chain, and growing from real audits (see *Growing the rule set* in `../SKILL.md`).

## Index
| File | Prefix | Covers | Rules |
|---|---|---|---|
| `accessibility.md` | A11Y | semantics, names, contrast, landmarks, status messages | 10 |
| `focus-and-keyboard.md` | KEY | keyboard operation, focus visibility and order, dialogs | 11 |
| `forms.md` | FORM | labels, errors, input purpose, submission, authentication | 10 |
| `motion.md` | MOT | reduced motion, flashing, auto-moving content, animation cost | 6 |
| `content-and-copy.md` | COPY | action labels, errors, empty states, terminology, locale | 8 |
| `performance.md` | PERF | layout shift, images, fonts, long lists, perceived speed | 7 |
| `layout-and-responsive.md` | LAY | reflow, zoom, text spacing, target size, order, viewport units, layers | 9 |
| `navigation-and-state.md` | NAV | links vs buttons, location, URL state, async states, context changes | 9 |

## Rule format
```
### <ID> <short title>
`<default severity>` · <WCAG 2.2 criterion or "practice"> · <auto | manual>
- Rule: what must be true.
- Why: who is affected and how.
- Check: search pattern and/or manual step.
- Fix: the usual correction.
```
`auto` means a search finds candidates; `manual` means judgment or a running app is needed. Every `auto` hit must still be confirmed by reading the code.

## Check syntax
- Patterns are ripgrep regular expressions, usable with the Grep tool or `rg` in Bash.
- Globs: **TPL** = `*.{html,tsx,jsx,vue,svelte,erb}` plus inline `template:` in Angular `*.ts`; **STY** = `*.{css,scss,sass,less}` plus Tailwind classes inside TPL.
- Multi-line elements: enable multiline (`-U` / `multiline: true`) when a tag spans lines.
- No lookarounds in the default engine. For "X without Y", search X, then inspect the hits (or use `rg --pcre2` in Bash).
- Exclude `node_modules`, build output and vendored files.

## Severity and growth
Severities are defined in `../SKILL.md`. New rules follow its *Growing the rule set*: novelty check, next free id, an `Added: <YYYY-MM-DD> · source: <project>` line under the severity line, count updated above.
