# Forms (FORM)

### FORM-01 Every field has a programmatic label
`critical` · 1.3.1, 3.3.2, 4.1.2 · auto
- Rule: each `input`, `select`, `textarea` and custom control is named by a visible `label` (`for`/`id` or wrapping), or `aria-labelledby` pointing to visible text.
- Why: screen readers announce "edit text" with no purpose.
- Check: TPL `<(input|select|textarea|p-inputtext|p-select|p-dropdown|mat-select)\b` → match each id with a `<label for=`; Rails `f\.\w+_field` without `f.label`.
- Fix: add a visible label bound to the control; `aria-label` only where a visible label is truly impossible.

### FORM-02 Placeholder is not a label
`serious` · 3.3.2 · auto
- Rule: placeholders give an example format at most; the label stays visible while typing.
- Why: the hint disappears on input, overloading memory; placeholder text usually fails contrast.
- Check: TPL `placeholder=` on fields with no associated label (from FORM-01).
- Fix: move the text to a label; keep a short example placeholder only if it adds value.

### FORM-03 Errors are identified in text and tied to the field
`serious` · 3.3.1 · auto + manual
- Rule: an invalid field gets `aria-invalid="true"` and an error message linked with `aria-describedby`; the message is text, near the field.
- Why: a red border alone says nothing to a screen reader or a color-blind user.
- Check: TPL `aria-invalid|aria-describedby` near validation messages; error blocks rendered with `@if (...invalid)` / `{errors.x && ...}`.
- Fix: link the message id to the field; on submit, move focus to the first invalid field or to an error summary.

### FORM-04 Errors suggest how to fix
`moderate` · 3.3.3 · manual
- Rule: messages state the expected format or the action ("Enter a date as DD/MM/YYYY"), not just "Invalid".
- Why: users repeat the same mistake.
- Check: list the validation messages in templates and i18n files.
- Fix: rewrite with the constraint and an example, in the UI language.

### FORM-05 Required fields are marked in text
`moderate` · 3.3.2 · auto
- Rule: required fields use `required` (or `aria-required`) and a visible marker explained once ("* required"), or optional fields are marked instead.
- Why: a colored asterisk alone is not perceivable or understood by everyone.
- Check: TPL `Validators\.required|required\b|\.required\(` vs the presence of a visible marker.
- Fix: add the attribute and a textual legend.

### FORM-06 Personal data fields declare their purpose
`moderate` · 1.3.5 · auto
- Rule: fields for name, email, phone, address, birthday, username and passwords carry the right `autocomplete` token.
- Why: autofill reduces typing for motor and cognitive disabilities.
- Check: TPL `type="(email|tel|password)"|name="(name|email|phone|address|city|zip)` → inspect for `autocomplete=`.
- Fix: add `autocomplete="email"`, `"tel"`, `"given-name"`, `"current-password"`, `"new-password"`…

### FORM-07 Validation timing is humane
`moderate` · practice · manual
- Rule: validate on blur or submit, not on every keystroke before the user finishes; never disable the submit button as the only sign that something is wrong.
- Why: premature errors distract; a disabled button gives no reason.
- Check: `updateOn|valueChanges|onChange.*validate`; `[disabled]="form.invalid"` / `disabled={!isValid}`.
- Fix: keep submit enabled and show the errors on submit, or explain next to the disabled button what is missing.

### FORM-08 Submission gives feedback and keeps data
`serious` · 3.3.7, 3.3.4 · manual
- Rule: submit shows a pending state and blocks double submission; on error, entered data stays; users are not asked again for data already given in the same flow; binding (legal, financial) submissions can be reviewed or reversed.
- Why: lost input and duplicate orders are the most expensive form failures.
- Check: submit handlers, wizard steps, error paths that reset the form.
- Fix: loading state on the button, idempotent submit, prefill known values, a review step for binding actions.

### FORM-09 Related controls are grouped
`moderate` · 1.3.1 · auto
- Rule: radio groups, checkbox groups and multi-part fields (date, address) sit in a `fieldset` with a `legend`, or a `role="group"` / `radiogroup` with a name.
- Why: each option is otherwise read without its question.
- Check: TPL `type="radio"|p-radiobutton|type="checkbox"` groups without `<fieldset` or `role="(radio)?group"`.
- Fix: wrap in `fieldset` + `legend` styled with tokens.

### FORM-10 Sign-in does not depend on memory tricks
`serious` · 3.3.8 · auto
- Rule: password and code fields allow paste and password managers; no puzzles or transcription without an alternative.
- Why: blocking paste locks out password-manager and cognitive-disability users.
- Check: TPL `\(paste\)|onPaste|@paste|autocomplete="off"` on password, one-time-code or email fields.
- Fix: remove paste blocking; use `autocomplete="current-password"` / `"one-time-code"`; offer passkeys or email links where possible.
