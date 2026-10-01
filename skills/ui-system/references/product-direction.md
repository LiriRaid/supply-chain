# Product direction

How the product type, its audience and the conditions of use decide style, density and tone. Start from the row that matches the product, then apply the modifiers. The result is a three-line direction statement recorded in project memory.

## Base decision table

| Product type | Primary user goal | Style family | Density | Tone of copy | Radius | Elevation | Motion | Color strategy |
|---|---|---|---|---|---|---|---|---|
| Internal tool / admin | finish tasks fast | neutral-functional | compact | plain, terse | small (4–6) | flat, borders | minimal | neutral surfaces, one accent |
| B2B SaaS app | manage work daily | neutral-functional or soft-modern | regular | clear, professional | medium (6–8) | low, subtle shadows | subtle feedback | neutral + brand primary, status set |
| Analytics / finance | read numbers, decide | technical | compact | precise, no hype | small | flat | minimal | low-chroma UI, color reserved for data and status |
| Messaging / inbox / support | respond quickly, keep context | soft-modern | regular, compact lists | warm but brief | medium | low | quick, purposeful | neutral surfaces; color for unread, channel and status |
| Developer tool | configure, debug | technical | compact | exact, example-led | small | flat | minimal | dark theme first-class, mono accents |
| Consumer mobile app | quick moments | soft-modern or playful | comfortable | friendly | large (12–16) | medium | expressive but short | brand-led, generous whitespace |
| E-commerce | find, compare, buy | clean commercial | regular | persuasive, honest | medium | low | subtle | product imagery leads; accent for buy actions only |
| Marketing landing | understand, convert | bold-expressive or editorial | airy | benefit-first | any, consistent | varies | scroll-linked, reduced-safe | strong brand hue, high contrast sections |
| Portfolio / creative | be impressed, remember | bold-expressive | airy | personal | any | varies | signature motion allowed | brand or monochrome with one daring accent |
| Editorial / blog / docs | read and learn | editorial | comfortable | explanatory | small | flat | none in reading | near-monochrome, link color only |
| Health, public sector, banking | trust, accomplish safely | neutral-functional | comfortable | calm, reassuring | medium | low | minimal | conservative hue, AA+ contrast, never alarming red as decoration |
| Education / kids | learn, stay motivated | playful | comfortable | encouraging | large | medium | rewarding, short | multiple hues with strict roles |

## Style families
- **neutral-functional:** content first, grid-aligned, borders over shadows, restrained color.
- **soft-modern:** rounded corners, gentle shadows, tinted neutrals, friendly but organised.
- **technical:** dense, monospace accents, crisp lines, dark theme as a peer of light.
- **editorial:** type-led hierarchy, wide margins, serif or high-contrast headings.
- **clean commercial:** white space around products, clear price and action hierarchy.
- **bold-expressive:** large type, saturated color fields, asymmetric layouts, signature motion.
- **playful:** large radii, illustration, bright but role-bound colors.

Trend effects (translucent glass, soft extruded surfaces, heavy gradients) are decoration: use them only outside task flows and only where contrast still passes.

## Modifiers (apply after the base row)

| Condition | Adjust |
|---|---|
| used at a glance, on the move, outdoors | larger targets (44 px), higher contrast, fewer simultaneous elements |
| long daily sessions | low-saturation surfaces, offer dark theme, avoid bright large fills |
| data-dense screens | compact density, tabular numerals, 1.125 type ratio |
| older or low-vision audience | base 17–18 px, contrast above minimum, avoid thin weights |
| expert / power users | keyboard shortcuts, density toggle, fewer confirmations, undo |
| first-time or occasional users | comfortable density, inline guidance, explicit labels over icons |
| multilingual UI | allow 30–40% text expansion, no text in images |
| brand already strong | keep its hue and type; adapt density and roles only |

## Density scale
| Density | Control height | Row height | Default gap | Spacing steps used most |
|---|---|---|---|---|
| compact | 32 px | 36 px | 8 px | 4 · 8 · 12 · 16 |
| regular | 40 px | 44–48 px | 12–16 px | 8 · 12 · 16 · 24 |
| comfortable | 48 px | 56 px | 16–24 px | 12 · 16 · 24 · 32 |

Spacing scale on a 4 px base: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Related items sit closer than unrelated ones (gap inside a group < gap between groups). Keep touch targets ≥ 24 px everywhere and ≥ 44 px on touch-first products regardless of density.

## Direction statement (record template)
```
Direction: <product type> for <audience>, used <context>.
Style <family>, density <…>, tone <…>; radius <…>, elevation <…>, motion <level>.
Color: <strategy> · Type: <families, ratio> · Avoid: <2–3 anti-choices>.
```
