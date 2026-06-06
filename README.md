# Superteam

Local-first League of Legends esports roster game inspired by the 82-0 team-building format.

The app gives you five rolls to draft a Worlds roster from pro player stats. Each round spins a real team plus timeframe, lets you choose one available pro, then projects whether that lineup is a play-in risk, knockout roster, semifinal roster, finals threat, or world champion.

The first screen is a match lobby with a Superteam identity, difficulty selection, scouting mode, and a Summoner's Rift draft map. Stats mode shows player ratings and mini-stats. Blind mode hides them so the pick is based on esports memory and taste.

## Local Setup

```bash
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

The committed `public/data/pros.json` snapshot is enough to run the app locally or deploy it as a static site.

To refresh the dataset, copy `.env.example` to `.env`, set `OE_API_KEY`, optionally set `LOL_ESPORTS_API_KEY` for LoL Esports asset enrichment, then run:

```bash
npm run data:build
```

## Checks

```bash
npm run lint
npm run build
npx playwright test docs/code-factory/efforts/2026-06-05-lol-18-0-local/visual-capture.spec.js --reporter=line
```

## Deploy

The app is static-only: no server, no database, no runtime API keys.

Cloudflare Pages settings:

- Build command: `npm run build`
- Output directory: `dist`
- Headers: `public/_headers`

CLI deploy:

```bash
npm run deploy:cloudflare
```

## Data

The local dataset is generated into `public/data/pros.json` from Oracle's Elixir aggregated player stats via `scripts/build-pro-data.mjs`. The builder also enriches the snapshot with hosted LoL Esports team logos and player portraits when available.

Current generated snapshot:

- Generated: `2026-06-06T03:42:40.413Z`
- Players: `317`
- Player portraits: `301`
- Team logos: `59`
- Tournaments: `12`
- Pools: `Worlds`, `International`, `Current Form`, `Americas`

Superteam was created under Riot Games' Legal Jibber Jabber policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.
