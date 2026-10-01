# ui-system · mode: consistency-check

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** before a tokens refactor, after a large UI change, or "se ve inconsistente". Read-only unless the user asks to fix (then `tokens`).
- **Steps:** 1. Run the searches below (Grep tool, or `rg` via Bash), excluding the token source files. 2. Count per file. 3. Classify each hit: maps to an existing token → replace; near an existing step → snap to it; a real new need → propose a token. 4. Record the counts in `Gaps / drift`.

Ripgrep patterns (`smell — where — pattern`):
```
hex literal        — styles, templates (ignore anchors, ids) — #[0-9a-fA-F]{3,8}\b
function color     — styles, templates                        — \b(rgba?|hsla?|oklch|oklab)\(
magic spacing      — styles                                   — \b(margin|padding|gap|inset|top|right|bottom|left)[a-z-]*:\s*-?\d+px
arbitrary utility  — templates (Tailwind)                     — -\[(#|\d+(\.\d+)?(px|rem)|rgb)
inline style       — templates                                — style="|style=\{\{|\[style\.|\[ngStyle\]
raw type           — styles outside the theme                 — font-size:\s*\d+px|font-family:
ad-hoc depth/shape — styles                                   — box-shadow:\s*-?\d|border-radius:\s*\d+px
magic layer        — everywhere                               — z-index:\s*\d{3,}|z-\[\d+\]
palette bypass     — templates, only if semantic roles exist  — \b(bg|text|border)-(red|blue|green|gray|slate|zinc|neutral)-\d{2,3}\b
```
Globs: styles `*.{css,scss,sass,less}`; templates `*.{html,tsx,jsx,vue,svelte,erb}` plus inline Angular `template:` in `*.ts`.

- **Output:** table `file · smell · count · suggested token`, worst first; before/after totals if fixed.
