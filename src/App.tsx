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
  type Role,
} from './game'

type Offer = {
  tournamentId: string
  label: string
  pool: string
  players: Player[]
}

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function freshDraft(): Draft {
  return { ...emptyDraft }
}

function tournamentPlayer(player: Player, tournamentId: string) {
  return player.tournaments.some((tournament) => tournament.id === tournamentId)
}

function dealOffer(role: Role, players: Player[], data: ProsData): Offer | null {
  const eligible = data.tournaments
    .map((tournament) => {
      const candidates = players.filter((player) => player.role === role && tournamentPlayer(player, tournament.id))
      return { tournament, candidates }
    })
    .filter(({ candidates }) => candidates.length > 0)

  const roll = shuffled(eligible)[0]
  if (!roll) return null

  const strongPool = roll.candidates
    .sort((a, b) => b.rating - a.rating || b.gp - a.gp)
    .slice(0, Math.min(18, roll.candidates.length))
  const options = shuffled(strongPool)
    .slice(0, Math.min(4, strongPool.length))
    .sort((a, b) => b.rating - a.rating || b.gp - a.gp)

  return {
    tournamentId: roll.tournament.id,
    label: roll.tournament.label,
    pool: roll.tournament.pool,
    players: options,
  }
}

function App() {
  const [data, setData] = useState<ProsData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(freshDraft)
  const [offer, setOffer] = useState<Offer | null>(null)
  const [rerollsLeft, setRerollsLeft] = useState(1)

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
  const currentRole = roles.find((role) => !draft[role]) ?? null
  const runComplete = filled === roles.length

  function spin(useReroll = false) {
    if (!data || !currentRole) return
    const nextOffer = dealOffer(currentRole, players, data)
    if (!nextOffer) return
    setOffer(nextOffer)
    if (useReroll) setRerollsLeft((current) => Math.max(0, current - 1))
  }

  function pickPlayer(player: Player) {
    setDraft((current) => ({
      ...current,
      [player.role]: player,
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
          <h1>Win Worlds in five rolls.</h1>
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
        <section className="round-panel" aria-label="Current round">
          <div className="round-kicker">
            <span>Round {runComplete ? roles.length : filled + 1}/5</span>
            <span>{runComplete ? 'Roster locked' : roleLabels[currentRole ?? 'Top']}</span>
          </div>

          <div className="role-orb">
            <img src={currentRole ? roleIcons[currentRole] : roleIcons.Support} alt="" />
          </div>

          <div className="draw-copy">
            <span>{runComplete ? 'Final result' : offer ? offer.pool : 'Roll the draw'}</span>
            <strong>{runComplete ? projection.result : offer ? offer.label : 'Find your next Worlds piece'}</strong>
            <p>
              {runComplete
                ? 'Your roster is locked. Start a new run or chase a cleaner title score.'
                : offer
                  ? 'Pick one pro from this roll to lock the role.'
                  : 'One tournament pool. Four pro options. No spreadsheet hunting.'}
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
            <div className="choice-grid" aria-label={`${roleLabels[currentRole ?? 'Top']} choices`}>
              {offer.players.map((player) => (
                <button type="button" className="choice-card" key={player.id} onClick={() => pickPlayer(player)}>
                  <span className="choice-topline">
                    <span>
                      <strong>{player.name}</strong>
                      <em>{player.team}</em>
                    </span>
                    <b>{player.rating}</b>
                  </span>
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
              const active = currentRole === role && !runComplete
              return (
                <div className={`roster-slot ${active ? 'active' : ''}`} key={role}>
                  <img src={roleIcons[role]} alt="" />
                  <span>
                    <small>{roleLabels[role]}</small>
                    <strong>{player ? player.name : 'Empty'}</strong>
                    <em>{player ? player.team : 'Awaiting roll'}</em>
                  </span>
                  {player ? <b>{player.rating}</b> : null}
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
