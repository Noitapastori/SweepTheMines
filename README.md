# SweepTheMines

Simple Minesweeper built with React (Vite) and styled using Material Design 3 (MD3).

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview build

## UX overview
- Theme: MD3 tokens in `src/styles.css` (`--md-sys-color-*`, elevation, shapes). Tweak here to rebrand.
- Layout: Board is a CSS grid; `--cols` sets column count, `--cell-size` sets tile size.
- Interactions:
  - Click reveals; right-click flags; keyboard: arrows move focus, Enter/Space reveal, F flag, R new game.
  - Unrevealed = surface-variant + outline; revealed = surface.
- Feedback: Web Audio tones (safe vs mine). Score label pops briefly on safe reveals.

## Architecture
- `src/lib/useMinesweeper.js`: reducer-based game state (grid generation, adjacency, flood-fill reveal, win/lose).
- `src/App.jsx`: renders board and controls; delegates events at board level; memoized cells for performance.
- `src/styles.css`: MD3 color tokens, elevations, shapes, dark mode, and component styles.
