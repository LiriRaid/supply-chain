# Focus and keyboard (KEY)

### KEY-01 Everything clickable works with the keyboard
`critical` · 2.1.1 · auto
- Rule: every pointer action is reachable with Tab and operable with Enter/Space (or the widget's keys).
- Why: keyboard, switch and voice users cannot trigger mouse-only handlers.
- Check: TPL `<(div|span|li|td|tr|img|p|section)\b[^>]*(\(click\)|onClick|@click|on:click)=`.
- Fix: use `button` (action) or `a href` (navigation); only if impossible add `tabindex="0"`, a role and key handlers.

### KEY-02 Focus is always visible
`critical` · 2.4.7 · auto
- Rule: every focusable element shows a clear indicator on keyboard focus.
- Why: without it, keyboard users do not know where they are.
- Check: STY `outline:\s*(none|0)\b`; TPL `\b(focus:)?outline-none\b` → inspect for a `focus-visible` replacement (`ring`, border, shadow).
- Fix: a `:focus-visible` style using the `focus` token, ≥ 2 px, offset from the element, 3:1 against neighbours.

### KEY-03 Focus is not hidden by sticky content
`serious` · 2.4.11 · manual
- Rule: a focused element is never fully covered by sticky headers, footers, banners or chat widgets.
- Why: users tab "into nothing".
- Check: find `position:\s*(sticky|fixed)|\b(sticky|fixed)\b` bars; tab through long pages.
- Fix: `scroll-padding-top` / `scroll-padding-bottom` equal to the bar height; keep cookie banners out of the focus path.

### KEY-04 Focus order follows the visual order
`serious` · 2.4.3 · auto
- Rule: no positive `tabindex`; the DOM order matches the reading order.
- Why: jumping focus disorients and causes errors.
- Check: TPL `tabindex="[1-9]|tabIndex=\{[1-9]|\[tabindex\]="[1-9]`.
- Fix: remove positive values; reorder the DOM instead of fixing order with CSS.

### KEY-05 Dialogs manage focus
`critical` · 2.4.3, 2.1.2 · manual
- Rule: opening a modal moves focus inside, Tab stays within it, Escape closes it, and closing returns focus to the trigger; background is inert.
- Why: focus left behind the overlay makes the dialog unusable.
- Check: list dialog, drawer and popover components; verify each behavior, or that the library provides it.
- Fix: use the library dialog or native `<dialog>` with `showModal()`; restore focus explicitly when closing programmatically.

### KEY-06 No keyboard trap
`critical` · 2.1.2 · manual
- Rule: focus can always leave a component with standard keys (only modals deliberately contain it).
- Why: a trap forces users to reload the page.
- Check: tab through embedded editors, maps, iframes, custom selects and date pickers.
- Fix: release focus on Tab/Escape; document any non-standard exit key on screen.

### KEY-07 Users can skip repeated blocks
`moderate` · 2.4.1 · auto
- Rule: a "skip to content" link (first focusable element) or proper landmarks let users bypass navigation.
- Why: dozens of Tab presses before reaching the content on every page.
- Check: layout/shell file for `href="#main|skip` and `<main\b`.
- Fix: add a skip link that becomes visible on focus and targets `main` (with `tabindex="-1"`).

### KEY-08 Composite widgets follow their keyboard model
`moderate` · practice (ARIA APG) · manual
- Rule: tabs, menus, listboxes, comboboxes, trees and grids use arrow keys inside and a single Tab stop (roving tabindex or `aria-activedescendant`).
- Why: users expect the platform model; tabbing through every item is slow.
- Check: custom widgets not taken from the component library.
- Fix: follow the authoring-practices pattern or replace with the library widget.

### KEY-09 Single-key shortcuts can be avoided
`moderate` · 2.1.4 · auto
- Rule: shortcuts made of one printable key can be turned off, remapped, or work only while the related component has focus.
- Why: speech input triggers them accidentally.
- Check: `addEventListener\(['"]keydown|@HostListener\(['"](document|window):keydown|onKeyDown` on document/window, then inspect for single-key checks.
- Fix: require a modifier, scope to the focused component, or add a setting.

### KEY-10 Focus is handled after view changes
`moderate` · 2.4.3 · manual
- Rule: after client-side navigation or replacing the main content, focus moves to the new heading (or the change is announced); after deleting an item, focus goes to a sensible neighbour.
- Why: focus lost on `body` restarts the user at the top.
- Check: router transitions, list deletions, wizard steps.
- Fix: focus the `h1` (with `tabindex="-1"`) on route change; focus the next item or the list heading after removal.

### KEY-11 Hover and focus content is controllable
`moderate` · 1.4.13 · manual
- Rule: tooltips and popovers shown on hover/focus can be dismissed with Escape, can be hovered themselves, and stay until dismissed or focus leaves.
- Why: magnifier users lose content that vanishes when the pointer moves.
- Check: tooltip directives and CSS `:hover` reveals; TPL `tooltip|title=` used for essential info.
- Fix: use the library tooltip with Escape support; never put essential information only in a tooltip.
