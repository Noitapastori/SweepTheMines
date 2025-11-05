
# Copilot — repo notes (cleaned)

Tiny static Minesweeper demo. The authoritative app logic lives in `index.html`; `style.css` holds the visual rules. There is no build system or tests — run the page in a browser or with a simple static server.
Quick test (PowerShell from repo root):
```powershell
# then open http://localhost:8000
```


Quick summary
- Install and start the dev server:
	- npm install

Where to edit (high-impact files)
- `index.html` — Vite entry (mount point only).

- Score animation: the score element (id="score") is toggled with the score-changed class to trigger CSS keyframes.
- Important functions inside the hook: `createEmptyGrid`, `placeMines`, `computeAdjacency`, `revealIterative`.

Project-specific rules and UX constraints
- First-click safety: mines must not be placed on the first clicked cell (see `placeMines` usage in the reducer generate/reveal flows).
- UI state flags to preserve when modifying logic: `generated`, `gameOver`, `flagsPlaced`, `mineCount`.
- Accessibility: keep `role="grid"` on the board and `role="gridcell"`, `aria-label`, and `aria-live` updates for messages and counters.

# Copilot — repo notes (React + Vite)

Quick summary
- Small React + Vite Minesweeper demo. UI in `src/App.jsx`, game logic in `src/lib/useMinesweeper.js`, styles in `src/styles.css`.

Run & dev workflow
- Install + run locally:
  - npm install
  - npm run dev
  - Open the local URL printed by Vite (commonly http://localhost:5173)
- Build/preview: `npm run build` and `npm run preview`.

Key files to edit
- `src/App.jsx` — UI, keyboard shortcuts, audio, score display, accessibility attributes.
- `src/lib/useMinesweeper.js` — single source of truth for game state: grid creation, mine placement, reveal algorithm, flagging, win/loss detection.
- `src/styles.css` — visuals, CSS vars (`--cols`, `--cell-size`), animations like score-change.

Runtime shapes & API
- Grid: a 2D array `grid[r][c]` (cells: { r, c, isMine, revealed, flag, adj }).
- Hook API: `revealCell(r,c)`, `toggleFlagAt(r,c)`, `newGame()`, `setOptions()`, plus `rows, cols, mines, message, mineCount`.
- Important logic functions: `createEmptyGrid`, `placeMines`, `computeAdjacency`, `revealIterative`.

Project rules you must not break
- First-click safety: the first reveal must not hit a mine (handled in `placeMines`/generate flow).
- Preserve UI state flags: `generated`, `gameOver`, `flagsPlaced`, and `mineCount` behavior.
- Keep accessibility: `role="grid"` and `role="gridcell"`, `aria-label` on cells, and `aria-live` for `message` and counters.

Interactions & small quirks
- Keyboard: arrow keys move focus (Board has key handler), Enter/Space reveal, `f` toggles flag, `r` restarts game.
- Audio: Web Audio API is used in `src/App.jsx` (playClickSound, playMineSound). Handle missing AudioContext gracefully.
 - Score animation: the score element (id="score") is toggled with the score-changed class to trigger CSS keyframes.

Developer tips
 - Prefer game logic changes inside `src/lib/useMinesweeper.js` and keep UI slim in `src/App.jsx`.
 - Keep data-row / data-col on cell elements if touching keyboard focus logic.
 - Update --cols via inline style on the board element (App sets it using the hook's cols).

Testing & validation
- Manual tests are primary: first-click safety, keyboard navigation, flagging, mine counter accuracy, win/loss messages and visuals.
- Use browser devtools console for runtime errors during `npm run dev`.

Committing & HMR
- Vite HMR updates `src/*`; if not, restart `npm run dev`.
- Keep commits small and descriptive (e.g., "feat: keyboard nav", "style: primary button").

If anything here is unclear or you'd like examples (cell label outputs, reducer flows, or a tiny test harness), tell me which area to expand.

Please analyze this codebase thoroughly and provide a comprehensive rules doc for your use (e.g. CLAUDE.md, .cursor/rules/design_system_rules.mdc file) on the following aspects to help integrate Figma designs using the Model Context Protocol:

## Design System Structure

1. **Token Definitions**
   - Where are design tokens (colors, typography, spacing, etc.) defined?
   - What format/structure is used for tokens?
   - Are there any token transformation systems in place?

2. **Component Library**
   - Where are UI components defined?
   - What component architecture is used?
   - Are there any component documentation or storybooks?

3. **Frameworks & Libraries**
   - What UI frameworks are used (React, Vue, etc.)?
   - What styling libraries/frameworks are used?
   - What build system and bundler are used?

4. **Asset Management**
   - How are assets (images, videos, etc.) stored and referenced?
   - What asset optimization techniques are used?
   - Are there any CDN configurations?

5. **Icon System**
   - Where are icons stored?
   - How are icons imported and used in components?
   - Is there an icon naming convention?

6. **Styling Approach**
   - What CSS methodology is used (CSS Modules, Styled Components, etc.)?
   - Are there global styles?
   - How are responsive designs implemented?

7. **Project Structure**
   - What is the overall organization of the codebase?
   - Are there any specific patterns for feature organization?

Provide your analysis as structured markdown with code snippets demonstrating key patterns. Include file paths where relevant.


