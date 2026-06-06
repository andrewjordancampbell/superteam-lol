# Launch Checklist: Superteam

## Current Recommendation

Ship the first public test as a static Cloudflare Pages site.

This keeps the blast radius small: no backend, no database, no auth, no server functions, no runtime API keys, and no metered image transformation layer. The only external runtime calls are static image/font fetches and the local `public/data/pros.json` payload served by the host.

## Cloudflare Pages Setup

- Project name: `superteam-lol`
- Build command: `npm run build`
- Output directory: `dist`
- Config: `wrangler.toml`
- Headers: `public/_headers`

Manual CLI deploy after approval:

```bash
npm run deploy:cloudflare
```

Do not deploy/post from an agent session without Andrew explicitly approving the live publish.

## Security And Cost Posture

- Static hosting is the right first move for a viral traffic test.
- Runtime API keys are not needed; `.env` is ignored and `.env.example` documents refresh keys only.
- CSP limits scripts/connects to self and images to the known asset hosts.
- `frame-ancestors 'none'` and `X-Frame-Options: DENY` block clickjacking embeds.
- Cache hashed Vite assets for one year; cache `public/data/pros.json` for one hour with stale revalidation.
- Avoid Cloudflare Pages Functions, Workers, D1, KV, R2, image resizing, or analytics add-ons until there is a real need.

Primary cost worry is not the app itself; it is accidentally adding metered services later. Keep v1 static.

## Legal/Fan Project Posture

- Keep the Riot fan-project notice visible.
- Do not imply Riot endorsement.
- Do not monetize at launch.
- Use real LoL Esports imagery only as part of the fan-project experience.
- If monetization becomes attractive, re-check Riot's current fan/IP policy before adding ads, sponsorships, merch, or paid features.

## Pre-Post Checklist

- Run `npm run lint`.
- Run `npm run build`.
- Run the Playwright visual capture.
- Open the deployed URL in the browser.
- Spin once in Stats mode.
- Toggle Blind mode.
- Complete one run.
- Check the social preview title/description.
- Confirm the footer notice is visible.
- Confirm the network tab has no failed first-party requests.

## First Distribution

Start with X because the loop is quick to explain and easy to reshare:

> I made Superteam, an 82-0 style League of Legends esports game: spin a team + timeframe, take one pro, build a roster, try to win Worlds.

Then post to a targeted subreddit only after the first live sanity pass. Ask for brutal feedback on the draft loop, not generic promotion.

## Cut For Now

- Ads.
- Accounts.
- Leaderboards.
- Paid features.
- Save history.
- Complex model controls.
- Server-side data refresh.

The next valuable product feature after launch is a shareable result card, then a daily seeded challenge.
