# Worlds Run

Local-first League of Legends esports roster builder inspired by the 82-0 team-building format.

The app lets you draft a five-player Worlds roster from pro player stats, then projects whether that lineup is a play-in risk, knockout roster, semifinal roster, finals threat, or world champion.

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
```

## Data

The local dataset is generated into `public/data/pros.json` from Oracle's Elixir aggregated player stats via `scripts/build-pro-data.mjs`.

Current generated snapshot:

- Generated: `2026-06-06T01:32:27.545Z`
- Players: `317`
- Tournaments: `12`
- Pools: `Worlds`, `International`, `Current Form`, `Americas`

This is an unofficial fan prototype and is not endorsed by Riot Games.
