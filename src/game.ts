export type Role = 'Top' | 'Jungle' | 'Mid' | 'Bot' | 'Support'

export type MetricKey =
  | 'winRate'
  | 'kda'
  | 'kp'
  | 'dpm'
  | 'egpm'
  | 'lane'
  | 'vision'
  | 'safety'
  | 'gd10'
  | 'xpd10'
  | 'csd10'
  | 'cspm'
  | 'wpm'
  | 'cwpm'
  | 'wcpm'
  | 'deathShare'

export type PlayerStats = Partial<Record<MetricKey, number | null>>
export type Percentiles = Partial<Record<MetricKey, number>>

export type TournamentRef = {
  id: string
  label: string
  pool: string
  team: string
  teamCode?: string
  teamLogo?: string
  games: number
}

export type TeamRef = {
  name: string
  code?: string
  games: number
  logo?: string
}

export type Player = {
  id: string
  name: string
  role: Role
  team: string
  draftTeam?: string
  draftTeamCode?: string
  draftTeamLogo?: string
  draftTimeframe?: string
  image?: string
  realName?: string
  teams: TeamRef[]
  tournaments: TournamentRef[]
  gp: number
  weightedGames: number
  kills: number
  deaths: number
  assists: number
  stats: PlayerStats
  rating: number
  percentiles: Percentiles
}

export type ProsData = {
  generatedAt: string
  source: {
    name: string
    api: string
    downloadsPage: string
  }
  tournaments: Array<{
    id: string
    label: string
    pool: string
    weight: number
  }>
  roleOrder: Role[]
  players: Player[]
}

export type Draft = Record<Role, Player | null>

export type Projection = {
  score: number
  titleOdds: number
  result: string
  filled: number
  modelNotes: string[]
  breakdown: Array<{
    label: string
    value: number
  }>
}

export const roles: Role[] = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']

export const emptyDraft: Draft = {
  Top: null,
  Jungle: null,
  Mid: null,
  Bot: null,
  Support: null,
}

export const roleIcons: Record<Role, string> = {
  Top: 'https://cdn.datalisk.io/icons/TopIcon.png',
  Jungle: 'https://cdn.datalisk.io/icons/JungleIcon.png',
  Mid: 'https://cdn.datalisk.io/icons/MidIcon.png',
  Bot: 'https://cdn.datalisk.io/icons/BotIcon.png',
  Support: 'https://cdn.datalisk.io/icons/SupportIcon.png',
}

export const roleLabels: Record<Role, string> = {
  Top: 'Top',
  Jungle: 'Jungle',
  Mid: 'Mid',
  Bot: 'Bot',
  Support: 'Support',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function average(values: Array<number | null | undefined>, fallback = 0) {
  const usable = values.filter((value): value is number => Number.isFinite(value))
  if (usable.length === 0) return fallback
  return usable.reduce((sum, value) => sum + value, 0) / usable.length
}

function rolePlayer(draft: Draft, role: Role) {
  return draft[role]
}

function sameTeam(a: Player | null, b: Player | null) {
  return Boolean(a && b && rosterTeam(a) === rosterTeam(b))
}

function rosterTeam(player: Player) {
  return player.draftTeam ?? player.team
}

function draftedTournament(player: Player) {
  if (!player.draftTimeframe) return undefined
  return player.tournaments.find((tournament) => tournament.label === player.draftTimeframe)
}

function worldsExperience(player: Player) {
  const drafted = draftedTournament(player)
  if (drafted?.pool === 'Worlds') return 100
  if (drafted?.pool === 'International') return 82
  if (player.tournaments.some((tournament) => tournament.pool === 'Worlds')) return 88
  if (player.tournaments.some((tournament) => tournament.pool === 'International')) return 72
  return 48
}

function formScore(player: Player) {
  const drafted = draftedTournament(player)
  if (drafted?.label.includes('2026')) return 96
  if (drafted?.pool === 'Worlds') return 90
  if (player.tournaments.some((tournament) => tournament.label.includes('2026'))) return 84
  return 70
}

function stabilityScore(player: Player) {
  const sampleTrust = clamp((player.weightedGames / 48) * 100, 44, 100)
  return average([player.percentiles.safety, sampleTrust], 60)
}

export function projectRoster(draft: Draft): Projection {
  const selected = roles.map((role) => draft[role]).filter((player): player is Player => Boolean(player))
  const filled = selected.length

  if (filled === 0) {
    return {
      score: 0,
      titleOdds: 0,
      result: 'Draft a roster',
      filled,
      modelNotes: ['Spin a team and timeframe to start the model.'],
      breakdown: [
        { label: 'Talent', value: 0 },
        { label: 'Carry', value: 0 },
        { label: 'Control', value: 0 },
        { label: 'Lane', value: 0 },
        { label: 'Synergy', value: 0 },
        { label: 'Worlds reps', value: 0 },
      ],
    }
  }

  const ratings = selected.map((player) => player.rating)
  const sortedRatings = [...ratings].sort((a, b) => b - a)
  const topSide = rolePlayer(draft, 'Top')
  const jungle = rolePlayer(draft, 'Jungle')
  const mid = rolePlayer(draft, 'Mid')
  const bot = rolePlayer(draft, 'Bot')
  const support = rolePlayer(draft, 'Support')
  const teams = selected.map(rosterTeam)
  const maxTeamCount = Math.max(...teams.map((team) => teams.filter((candidate) => candidate === team).length))
  const uniqueTeams = new Set(teams).size
  const timeframes = selected.map((player) => player.draftTimeframe).filter(Boolean)
  const maxTimeframeCount = Math.max(0, ...timeframes.map((timeframe) => timeframes.filter((candidate) => candidate === timeframe).length))

  const talent = average(ratings, 50)
  const carryCeiling = average(sortedRatings.slice(0, Math.min(2, sortedRatings.length)), talent)
  const rosterFloor = average(sortedRatings.slice(-Math.min(2, sortedRatings.length)), talent)
  const mapControl = average(
    [
      jungle?.percentiles.kp,
      jungle?.percentiles.vision,
      support?.percentiles.kp,
      support?.percentiles.vision,
    ],
    talent,
  )
  const lanePressure = average(
    [topSide?.percentiles.lane, jungle?.percentiles.lane, mid?.percentiles.lane, bot?.percentiles.dpm],
    talent,
  )
  const teamfight = average(
    selected.flatMap((player) => [player.percentiles.kda, player.percentiles.kp, player.percentiles.safety]),
    talent,
  )
  const worldsReps = average(selected.map(worldsExperience), 50)
  const currentForm = average(selected.map(formScore), 75)
  const stability = average(selected.map(stabilityScore), talent)

  let synergy = 58
  if (sameTeam(jungle, mid)) synergy += 11
  if (sameTeam(bot, support)) synergy += 13
  if (sameTeam(topSide, jungle)) synergy += 7
  if (maxTeamCount >= 3) synergy += 8
  else if (maxTeamCount === 2) synergy += 4
  if (maxTimeframeCount >= 3) synergy += 5
  if (uniqueTeams === selected.length && selected.length >= 4) synergy -= 8
  synergy = clamp(synergy, 35, 100)

  const rawScore =
    talent * 0.24 +
    carryCeiling * 0.13 +
    rosterFloor * 0.1 +
    mapControl * 0.12 +
    lanePressure * 0.09 +
    teamfight * 0.08 +
    currentForm * 0.07 +
    worldsReps * 0.05 +
    stability * 0.05 +
    synergy * 0.07

  const championshipBonus =
    filled === roles.length
      ? clamp(
          (talent - 82) * 0.18 +
            (carryCeiling - 86) * 0.15 +
            (worldsReps - 72) * 0.08 +
            (synergy - 66) * 0.1,
          0,
          6,
        )
      : 0
  const completeness = filled / roles.length
  const score = Math.round(clamp((rawScore + championshipBonus) * completeness + 45 * (1 - completeness), 0, 99))
  const titleOdds =
    filled < roles.length
      ? Math.round(clamp((score - 40) * 0.45, 0, 32))
      : Math.round(clamp(100 / (1 + Math.exp(-(score - 83) / 5)), 1, 96))

  let result = 'Play-in risk'
  if (score >= 91 && filled === roles.length) result = 'World Champion'
  else if (score >= 85 && filled === roles.length) result = 'Finals threat'
  else if (score >= 78 && filled === roles.length) result = 'Semifinal roster'
  else if (score >= 70) result = 'Knockout roster'
  else if (filled < roles.length) result = `${filled}/5 locked`

  const modelNotes = [
    championshipBonus >= 4 ? 'Championship ceiling bonus is active.' : null,
    carryCeiling >= 88 ? 'Elite carry ceiling can steal knockout games.' : null,
    mapControl >= 80 ? 'Jungle/support control grades as a real strength.' : null,
    sameTeam(bot, support) ? 'Bot/support pair gets a chemistry bump.' : null,
    sameTeam(jungle, mid) ? 'Jungle/mid pair gets a chemistry bump.' : null,
    maxTeamCount >= 3 ? 'Three-player team stack improves coordination.' : null,
    worldsReps < 62 ? 'Low Worlds reps keep the title projection cautious.' : null,
    stability < 66 ? 'Volatile samples add risk to the model.' : null,
    filled < roles.length ? 'Projection gets stricter as the roster fills.' : null,
  ].filter((note): note is string => Boolean(note))

  return {
    score,
    titleOdds,
    result,
    filled,
    modelNotes: modelNotes.length > 0 ? modelNotes.slice(0, 3) : ['Balanced profile with no standout weakness yet.'],
    breakdown: [
      { label: 'Talent', value: Math.round(talent) },
      { label: 'Carry', value: Math.round(carryCeiling) },
      { label: 'Control', value: Math.round(mapControl) },
      { label: 'Lane', value: Math.round(lanePressure) },
      { label: 'Synergy', value: Math.round(synergy) },
      { label: 'Worlds reps', value: Math.round(worldsReps) },
    ],
  }
}

export function formatStat(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return `${Number(value).toFixed(value >= 100 ? 0 : 1)}${suffix}`
}

export function pickBestRoster(players: Player[]): Draft {
  return roles.reduce((draft, role) => {
    const candidate = players
      .filter((player) => player.role === role)
      .sort((a, b) => b.rating - a.rating || b.gp - a.gp)[0]
    return {
      ...draft,
      [role]: candidate ?? null,
    }
  }, emptyDraft)
}

export function pickContenderRoster(players: Player[]): Draft {
  return roles.reduce((draft, role) => {
    const candidates = players
      .filter((player) => player.role === role)
      .sort((a, b) => b.rating - a.rating || b.gp - a.gp)
      .slice(0, 12)
    const candidate = candidates[Math.floor(Math.random() * candidates.length)]
    return {
      ...draft,
      [role]: candidate ?? null,
    }
  }, emptyDraft)
}
