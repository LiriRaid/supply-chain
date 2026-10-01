# ui-build · mode: greenfield-direction

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** no tokens, theme or component library exist yet, or the user explicitly asks for a new visual identity.
- **Steps:**
  1. Write one sentence of context: who uses it, on what device, in what situation and mood. Refine it until it forces decisions (light vs dark, density, pace).
  2. Reject the first obvious answer for the category (the palette or layout anyone would guess from the domain alone); look for a choice that fits this specific product.
  3. Decide and record:
     - **Type:** a display/body pairing (or one family with clear weight contrast), a modular scale with visible contrast between steps, body measure around 60–75 characters.
     - **Color strategy:** neutral-led with one accent, or one dominant brand color, or a small set of named roles. Tint neutrals toward the brand hue; avoid pure black and pure white surfaces. Define semantic roles (surface, text, muted, primary, danger, success) in both themes and check contrast.
     - **Space and shape:** spacing scale, radius set, elevation approach (borders, tints or shadows: pick one as primary).
     - **Motion:** durations for feedback, small transitions and view changes; one easing family that decelerates; no bounce in task flows.
     - **Composition:** grid, content width, how emphasis is created (scale, contrast, whitespace) and what to avoid (nested cards, uniform card grids, decorative blur).
  4. Encode it as tokens in the stack's source of truth before building views.
  5. Write it to project memory under `## Design system` with the date: tone, type, color strategy, scales, motion, anti-choices. Future builds treat it as brownfield.
- **Output:** design direction summary, token file(s), project memory `## Design system` entry.
