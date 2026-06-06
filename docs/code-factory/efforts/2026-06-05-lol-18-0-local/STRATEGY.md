# Strategy: Simplify Worlds Run

## Decision

Worlds Run should be a constraint game, not a searchable stats dashboard.

The reference pattern from 82-0, 82-0+, 20-0, RoadTo38, Hockey 82-0, 17-0 football, CFB Labs, and the SportsStack 38-0/7-0 variants is:

- One challenge name.
- One round counter.
- One random team/franchise/club plus timeframe/era constraint.
- One candidate set from that constraint.
- One roster that visibly fills.
- One final result worth sharing.

Reference URLs reviewed:

- `https://www.82-0.com/`
- `https://www.20-0.com/play?mode=classic&scope=full`
- `https://82-0plus.vercel.app/`
- `https://hockey82-0.com/`
- `https://roadto38.com/`
- `https://www.firstdown.studio/build-a-17-0-team`
- `https://www.cfblabs.com/cfb-team-builder`
- `https://www.sportsstack.com.au/pl-38-zero.html`
- `https://www.sportsstack.com.au/7-0.html`

Our first prototype exposed too much: full search, filters, sorting, autodraft, shuffle, and a large card grid. That makes it feel like an analytics tool. The fun version should feel like being dealt a hand.

## Product Direction

Build a five-roll LoL esports game:

- Five roles: Top, Jungle, Mid, Bot, Support.
- Each round rolls a team plus tournament/timeframe.
- The player gets the available pros from that rolled roster.
- Pick one pro, lock that role, advance.
- Classic mode shows stats. Blind mode hides stats for the knowledge test.
- After five picks, show the Worlds projection.

## Monetization Direction

Do not start with ads. Ads make the first session worse and the traffic is unproven.

Best path:

1. Add shareable result cards and daily seed.
2. Use the daily challenge to prove replay/viral behavior.
3. Add a small sponsor slot only after there is repeat traffic.
4. Keep Ko-fi optional and low-priority.

Potential sponsors later:

- Esports analytics tools.
- LoL fantasy/community products.
- Esports newsletters or creators.
- Data/infrastructure sponsors if the app gets social traction.

Competitor monetization signals:

- 82-0 uses support/feedback links and has privacy/ads infrastructure.
- 20-0 has leaderboard retention and visible sponsor-style placement.
- Hockey 82-0 exposes ad infrastructure and the same Classic/hidden-stats split.
- 82-0+ has an infrastructure sponsor/powered-by placement.
- RoadTo38 uses Ko-fi support and tees up accounts/history later.

## What To Ignore Now

- Accounts.
- Leaderboards.
- Full player browser.
- Fine-grained model controls.
- Paid subscriptions.
- Roster history.
- Deep stats pages.

Those can all come later. The next test is whether the five-roll draft loop is immediately fun.
