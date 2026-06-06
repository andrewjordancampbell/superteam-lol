import { mkdir, writeFile } from 'node:fs/promises'

const API_BASE = 'https://oe.datalisk.io'
const API_KEY = process.env.OE_API_KEY ?? 'f561197a-82ea-4e54-acd2-386979018a7a'
const OUTFILE = new URL('../public/data/pros.json', import.meta.url)

const tournaments = [
  {
    id: '2025 Season World Championship/Main Event',
    label: 'Worlds 2025 Main Event',
    pool: 'Worlds',
    weight: 1.25,
  },
  {
    id: '2026 First Stand',
    label: 'First Stand 2026',
    pool: 'International',
    weight: 1.15,
  },
  {
    id: 'LCK/2026 Season/Rounds 1-2',
    label: 'LCK 2026 Rounds 1-2',
    pool: 'Current Form',
    weight: 1.05,
  },
  {
    id: 'LCK/2026 Season/Cup',
    label: 'LCK Cup 2026',
    pool: 'Current Form',
    weight: 0.9,
  },
  {
    id: 'LPL/2026 Season/Split 2 Playoffs',
    label: 'LPL 2026 Split 2 Playoffs',
    pool: 'Current Form',
    weight: 1.05,
  },
  {
    id: 'LPL/2026 Season/Split 2',
    label: 'LPL 2026 Split 2',
    pool: 'Current Form',
    weight: 0.9,
  },
  {
    id: 'LEC/2026 Season/Spring Playoffs',
    label: 'LEC 2026 Spring Playoffs',
    pool: 'Current Form',
    weight: 1,
  },
  {
    id: 'LEC/2026 Season/Spring Season',
    label: 'LEC 2026 Spring',
    pool: 'Current Form',
    weight: 0.85,
  },
  {
    id: 'LCP/2026 Season/Split 2 Playoffs',
    label: 'LCP 2026 Split 2 Playoffs',
    pool: 'Current Form',
    weight: 0.95,
  },
  {
    id: 'LCP/2026 Season/Split 2',
    label: 'LCP 2026 Split 2',
    pool: 'Current Form',
    weight: 0.8,
  },
  {
    id: 'LTA North/2025 Season/Split 3',
    label: 'LTA North 2025 Split 3',
    pool: 'Americas',
    weight: 0.75,
  },
  {
    id: 'LTA South/2025 Season/Split 3',
    label: 'LTA South 2025 Split 3',
    pool: 'Americas',
    weight: 0.75,
  },
]

const roleOrder = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']

const roleWeights = {
  Top: {
    winRate: 0.12,
    kda: 0.15,
    kp: 0.1,
    dpm: 0.18,
    egpm: 0.08,
    lane: 0.24,
    vision: 0.04,
    safety: 0.09,
  },
  Jungle: {
    winRate: 0.12,
    kda: 0.16,
    kp: 0.22,
    dpm: 0.08,
    egpm: 0.07,
    lane: 0.18,
    vision: 0.1,
    safety: 0.07,
  },
  Mid: {
    winRate: 0.12,
    kda: 0.17,
    kp: 0.12,
    dpm: 0.2,
    egpm: 0.09,
    lane: 0.2,
    vision: 0.03,
    safety: 0.07,
  },
  Bot: {
    winRate: 0.12,
    kda: 0.18,
    kp: 0.12,
    dpm: 0.24,
    egpm: 0.12,
    lane: 0.12,
    vision: 0.02,
    safety: 0.08,
  },
  Support: {
    winRate: 0.13,
    kda: 0.16,
    kp: 0.2,
    dpm: 0.03,
    egpm: 0.03,
    lane: 0.08,
    vision: 0.28,
    safety: 0.09,
  },
}

function parsePercent(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  return Number(String(value).replace('%', ''))
}

function num(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeRole(position) {
  if (position === 'ADC') return 'Bot'
  if (position === 'JNG') return 'Jungle'
  if (position === 'Middle') return 'Mid'
  return position
}

function weightedAverage(values) {
  const usable = values.filter((entry) => entry.value !== null && Number.isFinite(entry.value))
  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0)
  if (totalWeight === 0) return null
  return usable.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / totalWeight
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function percentile(sorted, value) {
  if (!Number.isFinite(value) || sorted.length === 0) return 0.5
  let below = 0
  for (const item of sorted) {
    if (item <= value) below += 1
  }
  return below / sorted.length
}

async function fetchTournament(tournament) {
  const url = new URL('/stats/players/byTournament', API_BASE)
  url.searchParams.set('tournament', tournament.id)
  const response = await fetch(url, {
    headers: {
      'X-Api-Key': API_KEY,
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${tournament.label}: ${response.status}`)
  }
  const rows = await response.json()
  return rows.map((row) => ({ ...row, __tournament: tournament }))
}

function aggregate(rows) {
  const byPlayer = new Map()

  for (const row of rows) {
    const role = normalizeRole(row.Pos)
    if (!roleOrder.includes(role)) continue

    const games = num(row.GP) ?? 0
    if (games < 1) continue

    const key = `${row.Player}|${role}`
    const weight = games * row.__tournament.weight
    const existing =
      byPlayer.get(key) ??
      {
        id: `${String(row.Player).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${role.toLowerCase()}`,
        name: row.Player,
        role,
        teams: new Map(),
        tournaments: [],
        gp: 0,
        weightedGames: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        values: {
          winRate: [],
          kda: [],
          kp: [],
          dpm: [],
          egpm: [],
          gd10: [],
          xpd10: [],
          csd10: [],
          cspm: [],
          wpm: [],
          cwpm: [],
          wcpm: [],
          deathShare: [],
        },
      }

    existing.gp += games
    existing.weightedGames += weight
    existing.kills += num(row.K) ?? 0
    existing.deaths += num(row.D) ?? 0
    existing.assists += num(row.A) ?? 0
    existing.teams.set(row.Team, (existing.teams.get(row.Team) ?? 0) + games)
    existing.tournaments.push({
      id: row.__tournament.id,
      label: row.__tournament.label,
      pool: row.__tournament.pool,
      games,
    })

    existing.values.winRate.push({ value: parsePercent(row['W%']), weight })
    existing.values.kda.push({ value: num(row.KDA), weight })
    existing.values.kp.push({ value: parsePercent(row.KP), weight })
    existing.values.dpm.push({ value: num(row.DPM), weight })
    existing.values.egpm.push({ value: num(row.EGPM), weight })
    existing.values.gd10.push({ value: num(row.GD10), weight })
    existing.values.xpd10.push({ value: num(row.XPD10), weight })
    existing.values.csd10.push({ value: num(row.CSD10), weight })
    existing.values.cspm.push({ value: num(row.CSPM), weight })
    existing.values.wpm.push({ value: num(row.WPM), weight })
    existing.values.cwpm.push({ value: num(row.CWPM), weight })
    existing.values.wcpm.push({ value: num(row.WCPM), weight })
    existing.values.deathShare.push({ value: parsePercent(row['DTH%']), weight })

    byPlayer.set(key, existing)
  }

  return Array.from(byPlayer.values())
    .map((entry) => {
      const stats = Object.fromEntries(
        Object.entries(entry.values).map(([key, values]) => [key, weightedAverage(values)]),
      )
      const teams = Array.from(entry.teams.entries()).sort((a, b) => b[1] - a[1])
      const laneParts = [stats.gd10, stats.xpd10, stats.csd10].filter((value) => value !== null)
      return {
        id: entry.id,
        name: entry.name,
        role: entry.role,
        team: teams[0]?.[0] ?? 'Unknown',
        teams: teams.map(([name, games]) => ({ name, games })),
        tournaments: entry.tournaments,
        gp: entry.gp,
        weightedGames: Number(entry.weightedGames.toFixed(2)),
        kills: entry.kills,
        deaths: entry.deaths,
        assists: entry.assists,
        stats: {
          ...stats,
          lane:
            laneParts.length > 0
              ? laneParts.reduce((sum, value) => sum + (value ?? 0), 0) / laneParts.length
              : null,
          vision: (stats.wpm ?? 0) * 0.45 + (stats.cwpm ?? 0) * 0.35 + (stats.wcpm ?? 0) * 0.2,
          safety: stats.deathShare === null ? null : 100 - stats.deathShare,
        },
      }
    })
    .filter((player) => player.gp >= 5)
}

function ratePlayers(players) {
  const byRole = new Map(roleOrder.map((role) => [role, players.filter((player) => player.role === role)]))

  return players.map((player) => {
    const peers = byRole.get(player.role) ?? []
    const metrics = ['winRate', 'kda', 'kp', 'dpm', 'egpm', 'lane', 'vision', 'safety']
    const percentiles = Object.fromEntries(
      metrics.map((metric) => {
        const values = peers
          .map((peer) => peer.stats[metric])
          .filter((value) => value !== null && Number.isFinite(value))
          .sort((a, b) => a - b)
        return [metric, percentile(values, player.stats[metric])]
      }),
    )

    const weights = roleWeights[player.role]
    const weightedScore = Object.entries(weights).reduce(
      (sum, [metric, weight]) => sum + (percentiles[metric] ?? 0.5) * weight,
      0,
    )
    const rating = Math.round(clamp(42 + weightedScore * 57 + Math.min(player.gp, 35) * 0.08, 35, 99))

    return {
      ...player,
      stats: Object.fromEntries(
        Object.entries(player.stats).map(([key, value]) => [
          key,
          value === null || !Number.isFinite(value) ? null : Number(value.toFixed(2)),
        ]),
      ),
      rating,
      percentiles: Object.fromEntries(
        Object.entries(percentiles).map(([key, value]) => [key, Number((value * 100).toFixed(1))]),
      ),
    }
  })
}

const rows = []
for (const tournament of tournaments) {
  const result = await fetchTournament(tournament)
  console.log(`${tournament.label}: ${result.length} player rows`)
  rows.push(...result)
}

const players = ratePlayers(aggregate(rows)).sort((a, b) => b.rating - a.rating)

await mkdir(new URL('../public/data', import.meta.url), { recursive: true })
await writeFile(
  OUTFILE,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: {
        name: "Oracle's Elixir",
        api: API_BASE,
        downloadsPage: 'https://oracleselixir.com/tools/downloads',
      },
      tournaments,
      roleOrder,
      players,
    },
    null,
    2,
  )}\n`,
)

console.log(`Wrote ${players.length} players to ${OUTFILE.pathname}`)
