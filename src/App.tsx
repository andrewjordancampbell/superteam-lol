import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  emptyDraft,
  formatStat,
  projectRoster,
  roleIcons,
  roleLabels,
  roles,
  type Draft,
  type Player,
  type ProsData,
} from './game'

type Offer = {
  tournamentId: string
  timeframe: string
  pool: string
  team: string
  players: Player[]
}

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function freshDraft(): Draft {
  return { ...emptyDraft }
}

function tournamentEntry(player: Player, tournamentId: string) {
  return player.tournaments.find((tournament) => tournament.id === tournamentId)
}

function dealOffer(draft: Draft, players: Player[], data: ProsData): Offer | null {
  const openRoles = new Set(roles.filter((role) => !draft[role]))
  const eligible = data.tournaments.flatMap((tournament) => {
    const playersByTeam = players.reduce((teams, player) => {
      const entry = tournamentEntry(player, tournament.id)
      if (!openRoles.has(player.role) || !entry?.team) return teams
      const teamPlayers = teams.get(entry.team) ?? []
      teamPlayers.push(player)
      teams.set(entry.team, teamPlayers)
      return teams
    }, new Map<string, Player[]>())

    return Array.from(playersByTeam.entries()).map(([team, candidates]) => ({
      tournament,
      team,
      candidates: candidates.sort((a, b) => b.rating - a.rating || b.gp - a.gp),
    }))
  })

  const roll = shuffled(eligible)[0]
  if (!roll) return null

  return {
    tournamentId: roll.tournament.id,
    timeframe: roll.tournament.label,
    pool: roll.tournament.pool,
    team: roll.team,
    players: roll.candidates,
  }
}

function App() {
  const [data, setData] = useState<ProsData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(freshDraft)
  const [offer, setOffer] = useState<Offer | null>(null)
  const [rerollsLeft, setRerollsLeft] = useState(1)
  const [showStats, setShowStats] = useState(true)

  useEffect(() => {
    fetch('/data/pros.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<ProsData>
      })
      .then(setData)
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Unable to load local pro data')
      })
  }, [])

  const players = useMemo(() => data?.players ?? [], [data])
  const projection = useMemo(() => projectRoster(draft), [draft])
  const filled = projection.filled
  const runComplete = filled === roles.length

  function spin(useReroll = false) {
    if (!data || runComplete) return
    const nextOffer = dealOffer(draft, players, data)
    if (!nextOffer) return
    setOffer(nextOffer)
    if (useReroll) setRerollsLeft((current) => Math.max(0, current - 1))
  }

  function pickPlayer(player: Player) {
    setDraft((current) => ({
      ...current,
      [player.role]: {
        ...player,
        draftTeam: offer?.team,
        draftTimeframe: offer?.timeframe,
      },
    }))
    setOffer(null)
  }

  function newRun() {
    setDraft(freshDraft())
    setOffer(null)
    setRerollsLeft(1)
  }

  return (
    <main className="game-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">LoL esports roster game</p>
          <h1>Spin a team. Steal one pro. Win Worlds.</h1>
        </div>
        <button type="button" className="quiet-action" onClick={newRun}>
          New run
        </button>
      </header>

      <section className="score-strip" aria-label="Worlds projection">
        <div>
          <span>Projection</span>
          <strong>{projection.result}</strong>
        </div>
        <div className="meter" aria-label={`Worlds score ${projection.score}`}>
          <i style={{ width: `${projection.score}%` }} />
        </div>
        <div className="score-pair">
          <span>
            <b>{projection.score}</b>
            score
          </span>
          <span>
            <b>{projection.titleOdds}%</b>
            title odds
          </span>
        </div>
      </section>

      {loadError ? <div className="notice">Data load failed: {loadError}</div> : null}
      {!data && !loadError ? <div className="notice">Loading pro data...</div> : null}

      <section className="playmat">
        <section className={`round-panel ${offer ? 'has-offer' : ''}`} aria-label="Current round">
          <div className="round-kicker">
            <span>Round {runComplete ? roles.length : filled + 1}/5</span>
            <span>{runComplete ? 'Roster locked' : showStats ? 'Classic' : 'Scout IQ'}</span>
          </div>

          <div className="mode-toggle" aria-label="Stats mode">
            <button type="button" className={showStats ? 'active' : ''} onClick={() => setShowStats(true)}>
              Stats
            </button>
            <button type="button" className={!showStats ? 'active' : ''} onClick={() => setShowStats(false)}>
              Blind
            </button>
          </div>

          <div className="roll-cards" aria-label="Current roll">
            <div>
              <span>Team</span>
              <strong>{offer ? offer.team : '?'}</strong>
            </div>
            <div>
              <span>Timeframe</span>
              <strong>{offer ? offer.timeframe : '?'}</strong>
            </div>
          </div>

          <div className="draw-copy">
            <span>{runComplete ? 'Final result' : offer ? offer.pool : 'Roll the draw'}</span>
            <strong>{runComplete ? projection.result : offer ? 'Choose one player' : 'Team + timeframe'}</strong>
            <p>
              {runComplete
                ? 'Your roster is locked. Start a new run or chase a cleaner title score.'
                : offer
                  ? 'Pick one available role from this roster. The rest disappear.'
                  : 'Spin a pro team and era, then take one player for your Worlds roster.'}
            </p>
          </div>

          <div className="round-actions">
            {runComplete ? (
              <button type="button" className="primary-action" onClick={newRun}>
                Run it back
              </button>
            ) : offer ? (
              <button type="button" className="quiet-action" onClick={() => spin(true)} disabled={rerollsLeft === 0}>
                Reroll ({rerollsLeft})
              </button>
            ) : (
              <button type="button" className="primary-action" onClick={() => spin()} disabled={!data}>
                Spin
              </button>
            )}
          </div>

          {offer ? (
            <div className="choice-grid" aria-label={`${offer.team} choices`}>
              {offer.players.map((player) => (
                <button type="button" className="choice-card" key={player.id} onClick={() => pickPlayer(player)}>
                  <span className="choice-topline">
                    <span>
                      <small>
                        <img src={roleIcons[player.role]} alt="" />
                        {roleLabels[player.role]}
                      </small>
                      <strong>{player.name}</strong>
                      <em>{offer.team}</em>
                    </span>
                    {showStats ? <b>{player.rating}</b> : <b>?</b>}
                  </span>
                  {showStats ? (
                    <span className="mini-stats">
                      <span>
                        GP <strong>{player.gp}</strong>
                      </span>
                      <span>
                        KDA <strong>{formatStat(player.stats.kda)}</strong>
                      </span>
                      <span>
                        KP <strong>{formatStat(player.stats.kp, '%')}</strong>
                      </span>
                      <span>
                        DPM <strong>{formatStat(player.stats.dpm)}</strong>
                      </span>
                    </span>
                  ) : (
                    <span className="blind-note">Trust your read.</span>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="roster-panel" aria-label="Roster">
          <div className="panel-title">
            <span>Your roster</span>
            <strong>{filled}/5</strong>
          </div>

          <div className="roster-slots">
            {roles.map((role) => {
              const player = draft[role]
              const active = !player && !runComplete
              return (
                <div className={`roster-slot ${active ? 'active' : ''}`} key={role}>
                  <img src={roleIcons[role]} alt="" />
                  <span>
                    <small>{roleLabels[role]}</small>
                    <strong>{player ? player.name : 'Empty'}</strong>
                    <em>
                      {player ? `${player.draftTeam ?? player.team} · ${player.draftTimeframe ?? 'Drafted'}` : 'Awaiting roll'}
                    </em>
                  </span>
                  {player && showStats ? <b>{player.rating}</b> : null}
                </div>
              )
            })}
          </div>

          <div className="breakdown">
            {projection.breakdown.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <footer className="source-note">
        <span>
          Oracle&apos;s Elixir stats · {data ? `${data.players.length} pros` : '-'} · Generated{' '}
          {data ? new Date(data.generatedAt).toLocaleDateString() : '-'}
        </span>
        <span>Unofficial fan prototype. Not endorsed by Riot Games.</span>
      </footer>
    </main>
  )
}

export default App
