# Content and copy (COPY)

### COPY-01 Actions and links say what they do
`moderate` · 2.4.4, 2.4.6 · auto
- Rule: button labels start with a verb naming the outcome ("Save changes"); link text makes sense out of context; no lone "click here", "more", "aquí", "ver más".
- Why: screen-reader users browse lists of links and buttons without the surrounding text.
- Check: TPL `>\s*(Click here|Here|More|Read more|Learn more|OK|Submit|Aquí|Clic aquí|Ver más|Leer más|Enviar|Aceptar)\s*<`.
- Fix: name the object or outcome ("Read the pricing guide"); or add visually hidden context.

### COPY-02 Errors explain what happened and how to recover
`serious` · 3.3.1, 3.3.3 · auto
- Rule: error states say what failed, why if known, and the next step (retry, contact, fix field); raw exceptions, codes and stack traces are never shown.
- Why: generic errors leave users stuck and erode trust.
- Check: `Something went wrong|An error occurred|Algo salió mal|Ocurrió un error|error\.message|err\.message|\{\{\s*error\s*\}\}`.
- Fix: map known errors to human messages with a recovery action; log technical detail instead of displaying it.

### COPY-03 Empty states guide the next step
`moderate` · practice · manual
- Rule: empty lists and first-use screens explain why it is empty and offer the primary action (or how to change filters).
- Why: a blank area looks broken.
- Check: list and table components: is there a branch for zero items (`@empty`, `length === 0`, `emptyMessage`)?
- Fix: add a message, a short explanation and one action; differentiate "no data yet" from "no results for this filter".

### COPY-04 The same thing has the same name
`moderate` · 3.2.4 · manual
- Rule: one term per concept and one label per repeated action across the product ("Delete" everywhere, not "Remove" here and "Erase" there).
- Why: inconsistent names make users doubt whether actions differ.
- Check: compare labels of equivalent actions and entities in templates and i18n files.
- Fix: pick the term in the users' vocabulary, record it in project memory conventions, replace the variants.

### COPY-05 One UI language, sourced consistently
`moderate` · 3.1.2 · auto
- Rule: text follows the project's UI language; foreign phrases carry `lang`; with i18n, no hard-coded user-facing strings.
- Why: mixed languages confuse users and screen-reader pronunciation.
- Check: with i18n present, TPL `>\s*[A-Za-zÁÉÍÓÚáéíóúñÑ][^<{]{3,}<` outside translation calls; spot English strings in a Spanish UI and vice versa.
- Fix: translate or move to the i18n source; mark foreign phrases with `lang`.

### COPY-06 Destructive confirmations are specific
`moderate` · practice · manual
- Rule: confirmation dialogs name the object and the consequence, and the confirm button repeats the action ("Delete contact"), never "OK" or "Yes".
- Why: users confirm on autopilot when labels are generic.
- Check: confirm dialog calls (`confirm(`, `ConfirmationService`, `window.confirm`) and their labels.
- Fix: title "Delete 'Ana López'?", body with the consequence, buttons "Delete contact" / "Cancel"; prefer undo for reversible actions.

### COPY-07 Numbers, dates and currency follow the locale
`minor` · practice · auto
- Rule: formatting uses the locale APIs or framework pipes with the app locale; no hand-built formats.
- Why: "01/02" means different days in different countries; wrong separators misstate amounts.
- Check: `toFixed\(|toLocaleString\(\)|new Date\([^)]*\)\.to(Date)?String|\| date:'[^']*'` and string-built dates or prices.
- Fix: `Intl.NumberFormat` / `Intl.DateTimeFormat` or the framework pipe with the configured locale.

### COPY-08 Truncated text remains reachable
`minor` · 1.3.1 · auto
- Rule: when text is truncated with ellipsis or line clamp, the full text is available to everyone (expand, detail view, or a tooltip that also works on focus).
- Why: a `title` attribute alone is invisible to keyboard and touch users.
- Check: STY/TPL `text-overflow:\s*ellipsis|\btruncate\b|line-clamp`.
- Fix: provide an expand action or detail view; keep names short enough not to need truncation in primary places.
