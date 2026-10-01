# Palette method

Derive an accessible palette from one decision (the brand hue) instead of picking colors one by one. Work in OKLCH: its lightness axis is perceptual, so equal steps look equal and contrast becomes predictable.

## 1. Pick the hue
- Existing brand: take the hue of the logo or the current primary (convert hex → OKLCH in browser devtools or any converter).
- No brand: choose the hue from the direction (`product-direction.md`). Cool hues (200–270) read calm and technical; warm hues (20–80) read energetic and human; greens (130–170) read growth and health. Avoid a primary hue within ~20° of the danger hue (~25) unless the brand demands it; then make danger clearly darker and always pair it with an icon.

## 2. Build the tonal scale (11 steps)
Keep hue fixed (a drift of up to ±10° toward warmer at the light end is acceptable). Vary lightness evenly; let chroma peak in the middle and fall at both ends so light tints do not look neon and dark shades do not look muddy.

| Step | L (approx.) | Chroma (share of the hue's max) | Typical use |
|---|---|---|---|
| 50 | 0.97 | 10% | tinted backgrounds |
| 100 | 0.94 | 20% | subtle fills, selected rows |
| 200 | 0.88 | 35% | hover fills, light borders |
| 300 | 0.80 | 55% | decorative accents |
| 400 | 0.71 | 80% | primary on dark surfaces |
| 500 | 0.62 | 100% | focus ring, charts |
| 600 | 0.54 | 95% | primary fill on light surfaces |
| 700 | 0.47 | 85% | hover / pressed, link text |
| 800 | 0.39 | 70% | strong text accents |
| 900 | 0.31 | 55% | dark fills |
| 950 | 0.24 | 40% | darkest surfaces in accent |

**Neutrals:** same steps, same hue, chroma 0.005–0.02. A slight tint toward the brand makes grays feel related to it; pure gray next to a saturated brand looks dead.

**Status scales:** build the same 11 steps for success (~150), warning (~75), danger (~27) and info (~240). Only steps 50–100 (backgrounds), 600–700 (text and fills) and 400 (dark theme) are normally used.

## 3. Map semantic roles
Components use roles only. Minimum role set and a starting mapping:

| Role | Light | Dark | Required contrast |
|---|---|---|---|
| `surface` | white or neutral-50 | neutral-950 | — |
| `surface-raised` | white | neutral-900 | — |
| `surface-sunken` | neutral-100 | black or neutral-950 at lower L | — |
| `text` | neutral-900 | neutral-100 | 4.5:1 on every surface |
| `text-muted` | neutral-600 | neutral-400 | 4.5:1 on every surface |
| `border` (decorative) | neutral-200 | neutral-800 | none (not informative) |
| `border-input` | neutral-500 | neutral-500 | 3:1 against surface |
| `primary` | primary-600 | primary-400 | 3:1 as a fill vs surface |
| `primary-hover` | primary-700 | primary-300 | 3:1 vs surface |
| `on-primary` | white | neutral-950 | 4.5:1 on `primary` |
| `link` | primary-700 | primary-300 | 4.5:1 on surface |
| `focus` | primary-500 | primary-400 | 3:1 vs adjacent colors |
| `danger` / `success` / `warning` / `info` | status-700 text, status-600 fill | status-400 | as text 4.5:1; as fill 3:1 |
| `*-surface` (alert backgrounds) | status-50 | status-950 / status-900 | its text role 4.5:1 on it |

Dark theme rules: raise elevation with lighter surfaces, not shadows; keep body text below pure white (neutral-100) to reduce glare; lower chroma of large filled areas; recheck every pair, because a step that passes in light mode often fails in dark.

## 4. Check contrast
Thresholds (WCAG 2.2): body text 4.5:1 · large text (≥ 24 px, or ≥ 18.66 px bold) 3:1 · UI component boundaries, icons that carry meaning, chart marks and focus indicators 3:1 against their neighbours · disabled controls are exempt but should stay legible · placeholder text that conveys information counts as text.

Save as a scratch file (`contrast.mjs` in the scratchpad) and run `node contrast.mjs <fg> <bg> [<fg> <bg> …]` with 3- or 6-digit hex:
```js
const lum = (h) => {
  let n = h.replace('#', ''); if (n.length === 3) n = [...n].map((x) => x + x).join('');
  const [r, g, b] = n.slice(0, 6).match(/../g).map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i += 2) {
  const [x, y] = [lum(a[i]), lum(a[i + 1])];
  const ratio = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  console.log(a[i], 'on', a[i + 1], ratio.toFixed(2), ratio >= 4.5 ? 'text' : ratio >= 3 ? 'large/UI only' : 'FAIL');
}
```
OKLCH or HSL tokens: resolve them to hex first (computed style in the browser, or a converter). Semi-transparent colors: blend with the actual background before measuring.

## 5. Fix a failing pair
1. Move along the scale (change lightness), never swap the hue.
2. A brand color that fails as text becomes a fill with `on-primary` text, and a darker `link` role carries text use.
3. Status colors: if 600 fails as text, use 700 for text and keep 600 for fills.
4. Re-run the script for the whole role table, both themes.

## 6. Color-vision safety
- Status and chart series must differ in lightness, not only in hue; red and green pairs need an icon, label or pattern.
- Check the palette with a color-blindness emulation (browser devtools rendering panel) before recording it.

## Output
A contrast table in the record: `pair · theme · ratio · pass/fail`, plus the scale values written to the source of truth.
