# browser-verify · mode: smoke

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** any UI change; golden path of the changed feature.
- **Steps:** 1. Open the route. 2. Recon: read the accessibility tree (or page text) and take one screenshot. 3. Perform the main user task step by step, re-reading the page after each action that changes it. 4. Assert the visible outcome of each acceptance criterion (text, element, URL, toast, list count). 5. Read console and network: new errors or failed requests count as failures.
- **Output:** one line per criterion with a verdict.
