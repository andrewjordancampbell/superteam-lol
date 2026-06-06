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
  teamCode?: string
  teamLogo?: string
  players: Player[]
}

type Difficulty = 'easy' | 'normal' | 'hard'

const difficultyOptions: Record<Difficulty, { label: string; hint: string; rerolls: number }> = {
  easy: {
    label: 'Easy',
    hint: '2 rerolls',
    rerolls: 2,
  },
  normal: {
    label: 'Normal',
    hint: '1 reroll',
    rerolls: 1,
  },
  hard: {
    label: 'Hard',
    hint: 'No rerolls',
    rerolls: 0,
  },
}

const roleAbbrevs = {
  Top: 'TOP',
  Jungle: 'JNG',
  Mid: 'MID',
  Bot: 'BOT',
  Support: 'SUP',
}

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function freshDraft(): Draft {
  return { ...emptyDraft }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function tournamentEntry(player: Player, tournamentId: string) {
  return player.tournaments.find((tournament) => tournament.id === tournamentId)
}

function DraftMap({ draft, preview = false }: { draft?: Draft; preview?: boolean }) {
  return (
    <div className={`draft-map ${preview ? 'draft-map-preview' : ''}`} aria-label="Summoner's Rift draft map">
      <span className="map-base map-blue-base" />
      <span className="map-base map-red-base" />
      <span className="map-lane map-lane-top" />
      <span className="map-lane map-lane-mid" />
      <span className="map-lane map-lane-bot" />
      <span className="map-river" />
      <span className="map-objective map-baron" />
      <span className="map-objective map-dragon" />

      {roles.map((role) => {
        const player = draft?.[role]
        return (
          <span className={`map-role map-role-${role.toLowerCase()}`} key={role}>
            <span className="map-role-icon">
              {player?.image ? <img src={player.image} alt="" /> : <img src={roleIcons[role]} alt="" />}
            </span>
            <strong>{player ? player.name : roleAbbrevs[role]}</strong>
          </span>
        )
      })}
    </div>
  )
}

function dealOffer(draft: Draft, players: Player[], data: ProsData): Offer | null {
  const openRoles = new Set(roles.filter((role) => !draft[role]))
  const eligible = data.tournaments.flatMap((tournament) => {
    const playersByTeam = players.reduce((teams, player) => {
      const entry = tournamentEntry(player, tournament.id)
      if (!openRoles.has(player.role) || !entry?.team) return teams
      const teamRoll = teams.get(entry.team) ?? {
        players: [],
        teamCode: entry.teamCode,
        teamLogo: entry.teamLogo,
      }
      teamRoll.players.push(player)
      teams.set(entry.team, teamRoll)
      return teams
    }, new Map<string, { players: Player[]; teamCode?: string; teamLogo?: string }>())

    return Array.from(playersByTeam.entries()).map(([team, roll]) => ({
      tournament,
      team,
      teamCode: roll.teamCode,
      teamLogo: roll.teamLogo,
      candidates: roll.players.sort((a, b) => b.rating - a.rating || b.gp - a.gp),
    }))
  })

  const roll = shuffled(eligible)[0]
  if (!roll) return null

  return {
    tournamentId: roll.tournament.id,
    timeframe: roll.tournament.label,
    pool: roll.tournament.pool,
    team: roll.team,
    teamCode: roll.teamCode,
    teamLogo: roll.teamLogo,
    players: roll.candidates,
  }
}

function App() {
  const [data, setData] = useState<ProsData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(freshDraft)
  const [offer, setOffer] = useState<Offer | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
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
  const difficultyOption = difficultyOptions[difficulty]

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
        draftTeamCode: offer?.teamCode,
        draftTeamLogo: offer?.teamLogo,
        draftTimeframe: offer?.timeframe,
      },
    }))
    setOffer(null)
  }

  function startRun() {
    setDraft(freshDraft())
    setOffer(null)
    setRerollsLeft(difficultyOption.rerolls)
    setGameStarted(true)
  }

  function newRun() {
    setDraft(freshDraft())
    setOffer(null)
    setRerollsLeft(difficultyOption.rerolls)
  }

  const statusNotice = (
    <>
      {loadError ? <div className="notice">Data load failed: {loadError}</div> : null}
      {!data && !loadError ? <div className="notice">Loading pro data...</div> : null}
    </>
  )

  const sourceNote = (
    <footer className="source-note">
      <span>
        Oracle&apos;s Elixir stats · {data ? `${data.players.length} pros` : '-'} · Generated{' '}
        {data ? new Date(data.generatedAt).toLocaleDateString() : '-'}
      </span>
      <span>
        Worlds Run was created under Riot Games&apos; Legal Jibber Jabber policy using assets owned by Riot Games. Riot
        Games does not endorse or sponsor this project.
      </span>
    </footer>
  )

  if (!gameStarted) {
    return (
      <main className="game-shell lobby-shell">
        <section className="lobby-hero" aria-label="Worlds Run setup">
          <div className="lobby-copy">
            <p className="eyebrow">Worlds Run · League esports · current form</p>
            <div className="brand-score" aria-label="18-0">
              <span>18</span>
              <i />
              <span>0</span>
            </div>
            <h1>Build a roster that can win Worlds.</h1>
            <p>
              Spin a team and timeframe, steal one pro who was actually there, fill the Rift, then see if the lineup
              clears the title test.
            </p>
            <div className="lobby-actions">
              <button type="button" className="primary-action big-action" onClick={startRun} disabled={!data}>
                Start draft
              </button>
              <span>{data ? `${data.players.length} pros · ${data.tournaments.length} timeframes` : 'Loading pro pool'}</span>
            </div>
          </div>

          <aside className="lobby-map-panel" aria-label="Draft board preview">
            <DraftMap preview />
            <div className="map-caption">
              <strong>Top · Jungle · Mid · Bot · Support</strong>
              <span>Five roles. Five rolls. One Worlds run.</span>
            </div>
          </aside>
        </section>

        {statusNotice}

        <section className="setup-panel" aria-label="Run settings">
          <div className="setup-group difficulty-group">
            <p className="panel-title">Difficulty</p>
            <div className="option-row">
              {(Object.keys(difficultyOptions) as Difficulty[]).map((option) => (
                <button
                  type="button"
                  className={`option-card ${difficulty === option ? 'active' : ''}`}
                  key={option}
                  onClick={() => setDifficulty(option)}
                >
                  <strong>{difficultyOptions[option].label}</strong>
                  <span>{difficultyOptions[option].hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup-group">
            <p className="panel-title">Show ratings</p>
            <div className="option-row two-up">
              <button type="button" className={`option-card ${showStats ? 'active purple' : ''}`} onClick={() => setShowStats(true)}>
                <strong>On</strong>
                <span>Stats visible</span>
              </button>
              <button type="button" className={`option-card ${!showStats ? 'active purple' : ''}`} onClick={() => setShowStats(false)}>
                <strong>Off</strong>
                <span>Blind scout mode</span>
              </button>
            </div>
          </div>

          <div className="setup-summary">
            <span>Draft mode</span>
            <strong>Team first</strong>
            <p>Spin a roster, pick one player, choose their role by locking them.</p>
          </div>
        </section>

        {sourceNote}
      </main>
    )
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

      {statusNotice}

      <section className="playmat">
        <section className={`round-panel ${offer ? 'has-offer' : ''}`} aria-label="Current round">
          <div className="rift-backdrop" aria-hidden="true">
            <span className="rift-base rift-blue-base" />
            <span className="rift-base rift-red-base" />
            <span className="rift-lane rift-lane-top" />
            <span className="rift-lane rift-lane-mid" />
            <span className="rift-lane rift-lane-bot" />
            <span className="rift-river" />
            <span className="rift-brush rift-brush-top" />
            <span className="rift-brush rift-brush-bot" />
            <span className="rift-objective rift-baron" />
            <span className="rift-objective rift-dragon" />
          </div>

          <div className="round-kicker">
            <span>Round {runComplete ? roles.length : filled + 1}/5</span>
            <span>{runComplete ? 'Roster locked' : `${difficultyOption.label} · ${showStats ? 'Stats' : 'Blind'}`}</span>
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
            <div className={offer ? 'roll-team-card' : undefined}>
              {offer?.teamLogo ? (
                <img className="team-logo" src={offer.teamLogo} alt="" />
              ) : offer ? (
                <span className="team-fallback">{initials(offer.team)}</span>
              ) : null}
              <span>Team</span>
              <strong>{offer ? offer.team : '?'}</strong>
              {offer?.teamCode ? <em>{offer.teamCode}</em> : null}
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
                    <span className="choice-identity">
                      <span className="player-avatar">
                        {player.image ? <img src={player.image} alt="" /> : <span>{initials(player.name)}</span>}
                        {offer.teamLogo ? <img className="avatar-team-logo" src={offer.teamLogo} alt="" /> : null}
                      </span>
                      <span className="choice-copy">
                        <small>
                          <img src={roleIcons[player.role]} alt="" />
                          {roleLabels[player.role]}
                        </small>
                        <strong>{player.name}</strong>
                        <em>{offer.team}</em>
                      </span>
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

          <DraftMap draft={draft} />

          <div className="roster-slots">
            {roles.map((role) => {
              const player = draft[role]
              const active = !player && !runComplete
              return (
                <div className={`roster-slot ${active ? 'active' : ''}`} key={role}>
                  <span className="roster-avatar">
                    {player?.image ? <img src={player.image} alt="" /> : <img src={roleIcons[role]} alt="" />}
                    {player?.draftTeamLogo ? <img className="roster-team-logo" src={player.draftTeamLogo} alt="" /> : null}
                  </span>
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

      {sourceNote}
    </main>
  )
}

export default App
