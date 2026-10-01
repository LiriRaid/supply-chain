# Type scale and pairing

## Pairing principles
- **One family is often enough.** A good variable sans with 3 weights covers most product UI. Add a second family only for a clear job: display headlines, long-form reading, or code and data.
- **Contrast in one dimension, kinship in another.** Pair families that differ in classification (serif with sans, geometric with humanist) but share proportions: similar x-height and width, so lines sit together. Two similar sans-serifs side by side look like a mistake.
- **Tone follows classification:**

| Classification | Reads as | Fits |
|---|---|---|
| neo-grotesque sans | neutral, efficient | product UI, dashboards, admin |
| humanist sans | friendly, readable | consumer apps, health, education |
| geometric sans | modern, brand-forward | marketing, startups, headings |
| transitional / modern serif | trustworthy, editorial | publishing, finance, law, long reads |
| slab serif | sturdy, confident | headlines with character |
| monospace | technical, precise | code, IDs, tabular data accents |

- **Practical filters before taste:** full coverage of the UI languages (Spanish needs á é í ó ú ñ ü ¿ ¡), the weights you need, tabular numerals for data, a license that allows self-hosting, and a variable font when more than two weights are needed.
- **System stack is a valid choice** for dense internal tools: zero load cost, native feel. Record it as a decision, not as an absence of one.

## Modular scale method
1. **Base size** = body text. 16 px for most apps; 17–18 px for reading-heavy or older audiences; 14 px only for dense data views and never below 12 px for any text.
2. **Ratio by density and expressiveness:**

| Ratio | Name | Use |
|---|---|---|
| 1.125 | major second | dense product UI, tables, admin |
| 1.2 | minor third | regular apps, SaaS |
| 1.25 | major third | marketing pages with product sections |
| 1.333 | perfect fourth | editorial, landing heroes |

3. **Generate:** `size(n) = base × ratio^n` for n = −2…5, then round to the 4 px grid (2 px below 16 px) and express in `rem`.
   Example, 16 px × 1.2 → 11 → 12 (caption floor), 13, **16**, 19 → 20, 23 → 24, 27.6 → 28, 33 → 32, 39.8 → 40.
4. **Name by role, not size:** `caption`, `label`, `body-sm`, `body`, `h3`, `h2`, `h1`, `display`. Keep 6–8 steps; more steps mean less hierarchy.
5. **Line height** decreases as size grows: body 1.5–1.6, labels 1.3–1.4, headings 1.1–1.25, display 1.0–1.1. Snap the resulting line box to the 4 px grid where practical.
6. **Measure:** 45–75 characters per line for reading text (`max-width: 65ch`); data cells may be shorter.
7. **Weights:** body 400, labels and emphasis 500–600, headings 600–700. Load at most three weights; hierarchy comes from size and spacing first, weight second, color last.
8. **Fluid display sizes (landing only):** `clamp(<min rem>, <rem + vw>, <max rem>)` on display and h1 steps; keep body fixed. Always include a `rem` term so browser zoom still scales the text.
9. **Numerals:** `font-variant-numeric: tabular-nums` for tables, prices, timers and KPIs.

## Loading
- `font-display: swap` (brand-critical) or `optional` (performance-critical); subset to the needed scripts; preload at most the one or two files used above the fold.
- Match fallback metrics (`size-adjust`, `ascent-override`) or use a framework font helper to avoid layout shift.

## Record
In `## Design system` → Type: families and loading method, base, ratio, the role table (role · size · line height · weight), and the reason for the choice.
