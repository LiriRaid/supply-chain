---
name: browser-verify
description: "Supply chain tool skill (test.browser), owned by sc-qa. Use to verify a web change in a real browser: \"verifica que funcione\", \"pruébalo en el navegador\", \"revisa que se vea bien en móvil\", \"toma screenshots\", \"hay errores en consola\", smoke test, e2e check, visual regression, responsive check. Load sc-qa first if it is not loaded. Uses the session's browser tools first and Playwright as fallback; local dev hosts only. Not for writing unit tests."
---

# Browser Verify

> **Precondition.** Tool of `sc-qa` (supporting `sc-frontend`). If that department skill is not loaded in this conversation, load it first and use its brief (what, why, where, how) as the input of this skill. Skip only for L0 edits.

## Approach
A passing test suite says the code compiles and the units behave; only a rendered page says the user can do the job. This skill turns the brief's acceptance criteria into observations in a real browser and returns evidence, not opinions.
- **Look before you touch.** Every interaction starts with a fresh view of the page (accessibility tree, text or screenshot). Selectors and coordinates come from what is rendered now, never from guessing at the source.
- **Wait for readiness, not for time.** Wait for the server to answer and for the page to settle (network quiet, target element present). Fixed sleeps are a last resort and always short.
- **Use what the session already has.** Prefer browser tools already wired into the session over installing anything.
- **Local only, fake data only.** Verify against `localhost`, `127.0.0.1`, `[::1]`, `*.localhost` or `*.test`. Use seed/fixture or generated test accounts, never the user's real credentials, never a production URL.
- **Every criterion gets a verdict.** Pass, fail, or not verified with a reason. Silence is not a pass.

### Guardrails
- **MUST** recon before every interaction sequence; re-read after navigation or a re-render.
- **MUST** stay on local development hosts; refuse production or third-party URLs for interaction.
- **MUST NOT** type real passwords, tokens, card or ID numbers; use test values from the project's seeds/fixtures or generated ones recorded there.
- **MUST NOT** install browsers or packages without an explicit yes.
- **MUST** stop servers you started and leave the user's running.
- **SHOULD** keep scripts throwaway in the scratchpad; promote to a committed e2e test only when `sc-qa` asks for one.

### Provider order
Decide once per session, top to bottom; stop at the first that works. Say which one was used in the output.

| # | Provider | How to detect | Notes |
|---|---|---|---|
| 1 | Built-in browser pane / preview tools | Tool list or `ToolSearch` shows tools such as `preview_start`, `navigate`, `read_page`, `find`, `computer` (screenshot), `read_console_messages`, `read_network_requests`, `resize_window` | Best option: no install, the user can watch. `resize_window` takes presets (mobile 375, tablet 768, desktop) and a `colorScheme` for light/dark. Screenshots come back inline, not as files. |
| 2 | Browser extension MCP (e.g. a Chrome extension server) | Deferred tools named like `mcp__<chrome-server>__navigate`; load the whole set in ONE `ToolSearch` call | Runs in the user's real browser profile: never read their other tabs, history or saved credentials. |
| 3 | Playwright via Node | `@playwright/test` or `playwright` in `package.json` | `pnpm exec playwright ...` (or the project's package manager). Saves screenshots to disk. |
| 4 | Playwright via Python | `playwright` in `pyproject.toml` / `requirements*.txt` | Use the project's environment (`uv run`, `poetry run`, venv). |
| 5 | Nothing available | — | Ask before installing anything (`pnpm add -D @playwright/test` + `pnpm exec playwright install chromium`). If the user declines, report every criterion as *not verified* and give manual steps. |

### Server lifecycle
1. **Already running?** `node scripts/wait-for-port.mjs <url> --timeout 3`. Exit 0 → reuse it and do not stop it at the end (it is not yours).
2. **Find the command.** Project memory → dev server row; else the stack default below; else the `dev`/`start` script in the manifest. Never invent one.
3. **Start it in the background.** Built-in pane: `preview_start` with a `.claude/launch.json` entry (tell the user before adding that file to the repository). Otherwise run the command with the shell tool in background mode.
4. **Wait for readiness.** `node scripts/wait-for-port.mjs <url> --timeout 120` (exit 0 ready, 1 timeout, 2 bad arguments or non-local host). On timeout read the server output, report the first error and stop; do not test a half-started app.
5. **Backend needed too?** Start it first, wait for its port, then the frontend.
6. **Stop what you started** when done: `preview_stop`, or stop the background task / process. Leave servers the user started running.
7. First successful start in a project → record the dev command, URL and port in project memory (*Quality gates*, row `dev server`).

| Stack | Default dev command | Default URL |
|---|---|---|
| Angular | `pnpm start` (or `pnpm exec ng serve`) | `http://localhost:4200` |
| React + Vite | `<pm> run dev` | `http://localhost:5173` |
| Next.js | `<pm> run dev` | `http://localhost:3000` |
| Rails | `bin/dev` if present, else `bundle exec rails s` | `http://localhost:3000` |
| NestJS (API behind a UI) | `pnpm run start:dev` | `http://localhost:3000` |

## Inputs
| Input | Source |
|---|---|
| Brief | the `sc-qa` / `sc-frontend` brief: acceptance criteria, affected screens, states, viewports |
| Stack conventions | `../supply-chain/stacks/<stack>.md` → *Commands* and *Testing* |
| Project context | `~/.supply-chain/projects/<slug>.md` → *Quality gates* (dev server row), *Gotchas*, test accounts |
| Known patterns | `patterns/` in this skill (generic flows) + project skills (project-specific) |

## Modes
Pick the smallest mode that proves the brief. `sc-qa` browser verification for any UI change = smoke + the relevant parts of states + evidence.

### smoke
- **When:** any UI change; golden path of the changed feature.
- **Steps:** 1. Open the route. 2. Recon: read the accessibility tree (or page text) and take one screenshot. 3. Perform the main user task step by step, re-reading the page after each action that changes it. 4. Assert the visible outcome of each acceptance criterion (text, element, URL, toast, list count). 5. Read console and network: new errors or failed requests count as failures.
- **Output:** one line per criterion with a verdict.

### states
- **When:** new or restyled components, screens with async data, responsive or theming work.
- **Steps:** 1. Loading: throttle or delay the request if the provider allows it, otherwise catch it on first render and say so. 2. Empty: use a filter, account or fixture with no data. 3. Error: point to a failing endpoint only through the app's own dev mechanism (mock flag, stopped backend); never tamper with shared environments. 4. Disabled and focus: tab through the controls, confirm visible focus and that disabled controls do not act. 5. Viewports 375, 768, 1280: screenshot each; check no horizontal scroll, no clipped or overlapping text, reachable primary action. 6. Light and dark: switch the color scheme (emulation or the app's own toggle) and screenshot both.
- **Output:** a state × viewport/theme grid with verdicts and screenshot references.

### regression
- **When:** a previously reported bug was fixed, or a change touches code near a known bug.
- **Steps:** 1. Take the original reproduction steps from the bug report, project memory or `engram`. 2. Replay them exactly (same route, data, viewport). 3. Confirm the wrong behavior is gone and the expected one is visible. 4. Exercise one neighbouring path that shares the fixed code.
- **Output:** "reproduced before / not reproduced after" with steps and evidence; if the "before" was not observed, say so.

### evidence
- **When:** closing an L1+ UI task, or the user asks for screenshots or console output.
- **Steps:** 1. Screenshot the final state of each criterion (desktop, plus mobile when layout changed). 2. With Playwright, save under the scratchpad directory or a git-ignored folder, named `<feature>-<state>-<width>.png`. 3. With the pane, screenshots are inline: list them by step. 4. Collect console messages at warning level and above, and failed network requests, filtered to the app's origin.
- **Output:** files or inline references plus the console/network digest for the closing report.

## Stack adapters
| Stack | Notes |
|---|---|
| Angular | SSR apps: also open one route with JavaScript blocked or read the raw HTML response to confirm server output; hydration mismatches show as console warnings and count as failures. Zoneless apps settle quickly; wait for the element, not for network idle. |
| React / Next.js | Dev mode double-invokes effects (Strict Mode): duplicated requests in dev are expected, not a bug. Next.js error overlay = failure. |
| Rails | Turbo navigations do not reload the page; re-read the DOM after each visit. Check flash messages for outcomes. |
| NestJS | API-only: verify through the UI that consumes it, or skip the browser and report it as N/A. |

## Output contract
Always return to the department:

```
Browser verify · provider: <built-in pane | chrome MCP | playwright-node | playwright-python> · url: <local url> · server: <started by me / reused>
Criteria
- ✔ <criterion> — <what was observed>
- ✘ <criterion> — <observed vs expected> — <screenshot ref>
- not verified: <criterion> — <reason>
Console / network: <none new> | <level · message · source> | <failed request · status>
Screenshots: <paths or inline step refs>
Server: stopped / left running (not mine)
```

## Pattern library (grows with use)
- Before building, list `patterns/` and read the matching file, if any (`patterns/README.md` explains the format).
- After verifying a reusable flow that has no pattern yet (login with a seed user, a CRUD form, a modal, a paginated table, a theme toggle), write `patterns/<pattern>.md` from `../supply-chain/templates/pattern.template.md`: intent, anatomy of the check, states to cover, a11y checks, pitfalls, one adapter per provider used. Project-specific routes and accounts go to project memory, not here.
- Update an existing pattern only with new, verified information (novelty check, supply-chain `references/learning.md`).

## Learned notes
_Grows with use (supply-chain `references/learning.md`). Dated, non-obvious notes about using this tool. When there are more than ~10, fold them into the body above and clear this list._
