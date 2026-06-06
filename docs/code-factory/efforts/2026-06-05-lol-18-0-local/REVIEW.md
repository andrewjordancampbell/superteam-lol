# Review: Worlds Run Local Prototype

## Machine Checks

- `npm run data:build` generated `public/data/pros.json` with 317 players, per-tournament team mappings, 301 player portraits, and 59 team logos.
- `npm run lint` passed.
- `npm run build` passed.
- `npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line` passed.

## Browser QA

Local URL: `http://127.0.0.1:5173/`

Verified:

- Page loads as `Worlds Run`.
- No browser console errors or warnings during core flows.
- First screen now exposes the core `Spin` action.
- Spin deals a real team plus timeframe.
- Active roll displays the rolled team logo.
- Active draw exposes the player choices without making desktop users hunt below the fold.
- Spin dealt five pro choices with five loaded player portraits in the in-app browser QA pass.
- In-app browser image QA loaded 11/11 LoL Esports images after a spin: five player portraits plus team-logo usages.
- Blind mode hides stats and shows memory-based choice cards.
- Reroll remains available once per run.
- Picking a pro advances the roster and preserves the drafted team/timeframe.
- Final state shows projected result, score, title odds, and locked roster.
- Mobile layout keeps the roll and first dealt player visible.

## Evidence

- Baseline screenshot: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/browser-home.png`
- Redesigned home: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-home.png`
- Active draw: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-draw.png`
- Completed run: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-final.png`
- Mobile draw: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-mobile.png`
- Reference screenshots: `docs/code-factory/efforts/2026-06-05-lol-18-0-local/research/`
- Build artifact: `dist/`

## Notes

The app is intentionally frontend-only for the local milestone. Deployment can stay simple unless we later need scheduled data refreshes, daily seeded challenges, or user-created saved rosters.
