# browser-verify · Stack adapters

Loaded on demand: read only the row of the project's stack.

| Stack | Notes |
|---|---|
| Angular | SSR apps: also open one route with JavaScript blocked or read the raw HTML response to confirm server output; hydration mismatches show as console warnings and count as failures. Zoneless apps settle quickly; wait for the element, not for network idle. |
| React / Next.js | Dev mode double-invokes effects (Strict Mode): duplicated requests in dev are expected, not a bug. Next.js error overlay = failure. |
| Rails | Turbo navigations do not reload the page; re-read the DOM after each visit. Check flash messages for outcomes. |
| NestJS | API-only: verify through the UI that consumes it, or skip the browser and report it as N/A. |
