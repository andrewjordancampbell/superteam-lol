# Worlds Run

Local-first League of Legends esports roster game inspired by the 82-0 team-building format.

The app gives you five rolls to draft a Worlds roster from pro player stats. Each round spins a real team plus timeframe, lets you choose one available pro, then projects whether that lineup is a play-in risk, knockout roster, semifinal roster, finals threat, or world champion.

Classic mode shows player stats. Blind mode hides them so the pick is based on esports memory and taste.

## Local Setup

```bash
npm install
npm run data:build
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

## Checks

```bash
npm run lint
npm run build
npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line
```

## Data

The local dataset is generated into `public/data/pros.json` from Oracle's Elixir aggregated player stats via `scripts/build-pro-data.mjs`.

Current generated snapshot:

- Generated: `2026-06-06T02:39:14.100Z`
- Players: `317`
- Tournaments: `12`
- Pools: `Worlds`, `International`, `Current Form`, `Americas`

This is an unofficial fan prototype and is not endorsed by Riot Games.
