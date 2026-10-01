# Chart choice

Start from the question the chart must answer, not from the data shape or the library's gallery.

## Form by question
| Question | Form | Avoid |
|---|---|---|
| how did it change over time? | line (≤ 5 series); area only for one cumulative series | pie, 3D, many stacked areas |
| how do categories compare? | bar; horizontal when labels are long; sort unless the order means something | radar beyond 5 axes |
| what ranks highest? | sorted horizontal bar, top N plus "other" | unsorted bars |
| what share does each part have? | stacked or 100% bar; donut only for ≤ 4 parts | pie with many thin slices |
| how is it distributed? | histogram, box or strip plot | a single average |
| do two measures relate? | scatter; bubble only if size encodes a real third variable | dual y-axes |
| what is the number now? | stat tile: value, delta, period, optional sparkline | gauges and dials |
| where do people drop off? | funnel bars with conversion per step labelled | sankey for fewer than 3 steps |
| where does it happen? | map only when location is the point; else a ranked bar | choropleth of raw counts (normalise per capita) |

## Color schemes
- **Categorical:** take series colors from distinct hues of the palette, spaced so their lightness also differs; at most 6 plus a neutral "other". Same entity, same color on every chart.
- **Sequential:** one hue from light to dark (steps 100 → 800); higher value = darker in light theme.
- **Diverging:** two hues meeting at a neutral midpoint that has a real meaning (zero, target, average).
- **Status:** success / warning / danger only when the data is a status, never as decoration.
- **Emphasis:** one highlighted series in the primary color, the rest in neutral-400; often clearer than many colors.

## Accessibility and clarity
- Marks and lines reach 3:1 against the plot background in every theme; gridlines stay quiet (decorative).
- Direct labels beat legends; add markers or dash styles so series survive grayscale and color-vision differences.
- The title states the takeaway ("Response time fell 30% in Q3"), axis labels carry units.
- Provide a data table or a text summary; tooltips must be reachable by keyboard and not the only way to read values.
- Y axis of bars starts at zero; truncated axes only on line charts and clearly marked.
- No entrance animation under reduced motion; never animate while the user reads values.
