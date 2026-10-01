# browser-verify · mode: evidence

Loaded on demand from `../SKILL.md` → *Modes*.

- **When:** closing an L1+ UI task, or the user asks for screenshots or console output.
- **Steps:** 1. Screenshot the final state of each criterion (desktop, plus mobile when layout changed). 2. With Playwright, save under the scratchpad directory or a git-ignored folder, named `<feature>-<state>-<width>.png`. 3. With the pane, screenshots are inline: list them by step. 4. Collect console messages at warning level and above, and failed network requests, filtered to the app's origin.
- **Output:** files or inline references plus the console/network digest for the closing report.
