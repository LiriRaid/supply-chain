# Harden checklist

Mark each item pass / fixed / open / n/a. Test with real or realistic data, not the demo fixture.

## Content extremes
- [ ] Very long names, titles and unbroken strings (URLs, emails): wrap, truncate with full value available (tooltip or detail), no layout break. Flex/grid children that hold text have `min-width: 0`.
- [ ] Missing optional values: no "undefined", "null" or empty labels; a neutral placeholder or the row adapts.
- [ ] Zero, one and many items; counts pluralize correctly.
- [ ] Large lists: pagination or virtualization; scroll position kept on update.

## Language and locale
- [ ] Text expansion of about 30–40% (e.g. German, Spanish) does not clip buttons or tabs.
- [ ] Logical properties (`margin-inline`, `inset-inline-start`) where RTL is supported; icons that imply direction mirror.
- [ ] Dates, numbers and currency use locale formatting, not string concatenation.
- [ ] No text baked into images; all strings go through the i18n mechanism if one exists.

## Network and async
- [ ] Slow network: skeleton or pending state appears; no layout jump when data arrives.
- [ ] Request failure: message says what failed and offers retry; partial data stays visible.
- [ ] Offline or timeout: clear status; queued or blocked actions are explained.
- [ ] Double submit prevented (pending state disables the trigger); optimistic updates roll back visibly on failure.
- [ ] Out-of-order responses (fast typing in search) cannot overwrite newer results.

## Permissions and states
- [ ] Read-only or unauthorized users see disabled or hidden actions with a reason, not dead buttons.
- [ ] Session expiry mid-task does not lose form input.

## Forms
- [ ] Validation on blur or submit, not on every keystroke for untouched fields; errors linked to fields and announced.
- [ ] Paste, autofill and password managers work; input types and `autocomplete` set.
- [ ] Server-side errors map back to the right field.

## Resilience
- [ ] 200% zoom and 320 px reflow without horizontal scroll.
- [ ] Forced colors / high-contrast mode keeps borders and focus visible.
- [ ] No leaks: listeners, timers, observers and subscriptions cleaned up on destroy.
