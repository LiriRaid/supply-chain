# ui-audit · mode: audit

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** "audita la UI", "revisa la accesibilidad", "cumple WCAG", "revisa el formulario", before a PR with UI changes, `dept-qa` Definition of Done.
- **Steps:**
  1. Fix the scope. More than ~30 files → ask, or start with the primary flows.
  2. Read `rules/README.md` and pick categories by file type: templates → accessibility, focus-and-keyboard, forms, navigation-and-state, content-and-copy; styles → layout-and-responsive, motion, contrast rules; routes, config, image and font loading → performance.
  3. Automated pass: run each selected rule's **Check** pattern over the scope with Grep (count first, then content with 2–3 lines of context).
  4. Confirm every hit by reading the code; drop false positives (library handles it, element is hidden or decorative). Then do the manual pass for rules marked `manual`.
  5. Contrast: resolve token pairs from `## Design system` or the theme files and measure them per theme with the script in `../ui-system/references/palette-method.md`.
  6. Runtime evidence when the app can run locally and the brief includes it: `browser-verify` for a keyboard-only pass, focus screenshots, 320 px reflow and 200% zoom. Use an axe engine only if the project already has it.
  7. Report, record in project memory, then ask which findings to fix (propose all critical and serious).
- **Output (no edits):**
```
## UI audit — <scope> — <YYYY-MM-DD>
| # | Rule | Severity | File:line | Finding | Fix |
|---|---|---|---|---|---|
| 1 | FORM-01 | critical | src/app/features/auth/login.html:14 | email input labelled only by placeholder | add a visible <label for> bound to the input id |
Totals: critical N · serious N · moderate N · minor N
Clean categories: … · Not verified: … (why)
```

Audit log in project memory (keep only open findings and the last audit line per scope):
```
## UI audit log
- [YYYY-MM-DD] <scope> · c N / s N / m N / n N · open: FORM-01 login.html:14 "placeholder=\"Email\"" · KEY-02 …
```
