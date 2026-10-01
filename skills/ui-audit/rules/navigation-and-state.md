# Navigation and state (NAV)

### NAV-01 Links navigate, buttons act
`serious` · 4.1.2 · auto
- Rule: navigation uses `a` with a real `href` (or the router link); actions use `button`; no `href="#"` or `javascript:` for actions.
- Why: wrong semantics break open-in-new-tab, history, and screen-reader expectations.
- Check: TPL `href="#"|href="javascript:|link_to\s+["']#["']`; `<button[^>]*(routerLink|href)`.
- Fix: swap the element; style it to look as designed.

### NAV-02 Current location is indicated
`moderate` · 1.3.1 · auto
- Rule: the active nav item, breadcrumb end and current step carry `aria-current` (`page`, `step`) plus a visible non-color cue.
- Why: users must know where they are without relying on color.
- Check: nav templates: `routerLinkActive` without `ariaCurrentWhenActive`; Next.js nav without `aria-current`.
- Fix: add `aria-current` and an indicator (weight, bar, icon).

### NAV-03 Shareable state lives in the URL
`moderate` · practice · manual
- Rule: filters, search terms, tabs, pagination and the selected record are reflected in the URL where users would refresh, share or go back.
- Why: refresh loses context; links cannot be shared; back skips steps.
- Check: components holding filter or tab state only in memory.
- Fix: sync with query params; read them on load.

### NAV-04 Every async view has all its states
`serious` · practice · manual
- Rule: data views render loading (skeleton for content), empty, error with retry, partial and success states.
- Why: blank or frozen screens look broken and hide failures.
- Check: for each data fetch in scope, look for the loading, error and empty branches (`@if`, `isLoading`, `error`, `@empty`).
- Fix: add the missing branches; error state offers retry and keeps prior data when possible.

### NAV-05 Destructive actions are recoverable
`moderate` · practice · manual
- Rule: prefer undo for reversible actions; irreversible ones need a specific confirmation (see COPY-06); trivial reversible actions need neither.
- Why: accidental loss is costly; needless confirmations train users to click through.
- Check: delete, archive, discard, leave handlers.
- Fix: soft delete with an undo toast, or a confirmation naming the object.

### NAV-06 Navigation and help stay consistent
`moderate` · 3.2.3, 3.2.6 · manual
- Rule: repeated navigation keeps the same order across pages; help (contact, chat, FAQ link) stays in the same place.
- Why: users rely on spatial memory.
- Check: compare layouts and shells of different sections.
- Fix: one shared layout component; same position for help.

### NAV-07 No surprise context changes
`serious` · 3.2.1, 3.2.2 · auto
- Rule: focusing or changing a control does not navigate, submit or open windows by itself unless the user was told beforehand.
- Why: keyboard and screen-reader users trigger changes while exploring options.
- Check: `\((change|focus|selectionChange)\)="[^"]*(navigate|submit)|onChange=\{[^}]*(router\.push|submit)|onchange=`.
- Fix: add an explicit "Apply" or "Go" button, or announce the behavior next to the control.

### NAV-08 Time limits can be extended
`moderate` · 2.2.1 · manual
- Rule: session or step timeouts warn before expiring and allow extending; entered data survives re-authentication.
- Why: slower users lose their work.
- Check: session expiry and idle logout logic; countdowns.
- Fix: warning dialog with "Stay signed in" at least 20 s before expiry; save drafts.

### NAV-09 Unsaved changes are protected
`moderate` · practice · manual
- Rule: leaving a form with significant unsaved input asks for confirmation or saves a draft.
- Why: navigation or a stray click destroys minutes of work.
- Check: long forms and editors without a leave guard (`canDeactivate`, `beforeunload`, router blocker).
- Fix: add a guard with a specific message, or autosave drafts.
