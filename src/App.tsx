import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  emptyDraft,
  formatStat,
  pickBestRoster,
  pickContenderRoster,
  projectRoster,
  roleIcons,
  roleLabels,
  roles,
  type Draft,
  type Player,
  type ProsData,
  type Role,
} from './game'

function App() {
  const [data, setData] = useState<ProsData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [activeRole, setActiveRole] = useState<Role>('Top')
  const [query, setQuery] = useState('')
  const [poolFilter, setPoolFilter] = useState('All')
  const [sortBy, setSortBy] = useState('rating')

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

  const projection = useMemo(() => projectRoster(draft), [draft])

  const pools = useMemo(() => {
    if (!data) return ['All']
    const poolNames = new Set(data.tournaments.map((tournament) => tournament.pool))
    return ['All', ...Array.from(poolNames)]
  }, [data])

  const players = useMemo(() => data?.players ?? [], [data])

  const candidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = players.filter((player) => {
      const matchesRole = player.role === activeRole
      const matchesPool =
        poolFilter === 'All' || player.tournaments.some((tournament) => tournament.pool === poolFilter)
      const matchesQuery =
        normalizedQuery.length === 0 ||
        player.name.toLowerCase().includes(normalizedQuery) ||
        player.team.toLowerCase().includes(normalizedQuery)
      return matchesRole && matchesPool && matchesQuery
    })

    return filtered.sort((a, b) => {
      if (sortBy === 'kda') return (b.stats.kda ?? 0) - (a.stats.kda ?? 0)
      if (sortBy === 'dpm') return (b.stats.dpm ?? 0) - (a.stats.dpm ?? 0)
      if (sortBy === 'vision') return (b.stats.vision ?? 0) - (a.stats.vision ?? 0)
      if (sortBy === 'lane') return (b.stats.lane ?? 0) - (a.stats.lane ?? 0)
      return b.rating - a.rating || b.gp - a.gp
    })
  }, [activeRole, players, poolFilter, query, sortBy])

  function draftPlayer(player: Player) {
    setDraft((current) => ({
      ...current,
      [player.role]: player,
    }))
    const nextRole = roles.find((role) => role !== player.role && !draft[role])
    if (nextRole) setActiveRole(nextRole)
  }

  function clearRole(role: Role) {
    setDraft((current) => ({
      ...current,
      [role]: null,
    }))
    setActiveRole(role)
  }

  function resetFilters() {
    setActiveRole('Top')
    setQuery('')
    setPoolFilter('All')
    setSortBy('rating')
  }

  function setGlobalDraft(nextDraft: Draft) {
    setDraft(nextDraft)
    resetFilters()
  }

  function resetDraft() {
    setDraft(emptyDraft)
    resetFilters()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">LoL esports roster lab</p>
          <h1>Worlds Run</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => setGlobalDraft(pickBestRoster(players))} disabled={!data}>
            Autodraft ceiling
          </button>
          <button type="button" onClick={() => setGlobalDraft(pickContenderRoster(players))} disabled={!data}>
            Shuffle contenders
          </button>
          <button type="button" className="ghost" onClick={resetDraft}>
            Reset
          </button>
        </div>
      </header>

      <section className="score-band">
        <div className="score-main">
          <span className="score-label">Worlds projection</span>
          <strong>{projection.result}</strong>
        </div>
        <div className="score-meter" aria-label={`Worlds score ${projection.score}`}>
          <div style={{ width: `${projection.score}%` }} />
        </div>
        <div className="score-stats">
          <span>
            <strong>{projection.score}</strong>
            score
          </span>
          <span>
            <strong>{projection.titleOdds}%</strong>
            title odds
          </span>
          <span>
            <strong>{projection.filled}/5</strong>
            locked
          </span>
        </div>
      </section>

      {loadError ? <div className="notice">Data load failed: {loadError}</div> : null}
      {!data && !loadError ? <div className="notice">Loading pro data...</div> : null}

      <section className="workspace">
        <aside className="draft-panel" aria-label="Draft board">
          <div className="panel-heading">
            <h2>Roster</h2>
            <span>{data ? `${data.players.length} pros` : '-'}</span>
          </div>

          <div className="role-tabs">
            {roles.map((role) => (
              <button
                type="button"
                key={role}
                className={activeRole === role ? 'active' : ''}
                onClick={() => setActiveRole(role)}
              >
                <img src={roleIcons[role]} alt="" />
                {roleLabels[role]}
              </button>
            ))}
          </div>

          <div className="draft-slots">
            {roles.map((role) => {
              const player = draft[role]
              return (
                <button
                  type="button"
                  key={role}
                  className={`draft-slot ${activeRole === role ? 'selected' : ''}`}
                  onClick={() => setActiveRole(role)}
                >
                  <img src={roleIcons[role]} alt="" />
                  <span>
                    <small>{roleLabels[role]}</small>
                    <strong>{player ? player.name : 'Open slot'}</strong>
                    <em>{player ? player.team : 'Pick a pro'}</em>
                  </span>
                  {player ? <b>{player.rating}</b> : null}
                </button>
              )
            })}
          </div>

          <div className="projection-grid">
            {projection.breakdown.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="pool-panel" aria-label="Player pool">
          <div className="panel-heading pool-heading">
            <div>
              <h2>{roleLabels[activeRole]} pool</h2>
              <span>{candidates.length} matching pros</span>
            </div>
            <div className="filters">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search player or team"
              />
              <select value={poolFilter} onChange={(event) => setPoolFilter(event.target.value)}>
                {pools.map((pool) => (
                  <option key={pool}>{pool}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="rating">Rating</option>
                <option value="kda">KDA</option>
                <option value="dpm">DPM</option>
                <option value="vision">Vision</option>
                <option value="lane">Lane</option>
              </select>
            </div>
          </div>

          <div className="player-grid">
            {candidates.map((player) => {
              const drafted = draft[player.role]?.id === player.id
              return (
                <article key={player.id} className={`player-card ${drafted ? 'drafted' : ''}`}>
                  <button type="button" className="card-main" onClick={() => draftPlayer(player)}>
                    <span className="avatar">
                      <img src={roleIcons[player.role]} alt="" />
                    </span>
                    <span className="identity">
                      <strong>{player.name}</strong>
                      <em>{player.team}</em>
                    </span>
                    <span className="rating">{player.rating}</span>
                  </button>

                  <div className="stat-row">
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
                  </div>

                  <div className="card-actions">
                    <span>{player.tournaments[0]?.label ?? 'Tournament data'}</span>
                    {drafted ? (
                      <button type="button" onClick={() => clearRole(player.role)}>
                        Remove
                      </button>
                    ) : (
                      <button type="button" onClick={() => draftPlayer(player)}>
                        Draft
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
            {data && candidates.length === 0 ? (
              <div className="empty-pool">
                <strong>No matching pros</strong>
                <span>Clear search or change the pool.</span>
              </div>
            ) : null}
          </div>
        </section>
      </section>

      <footer className="source-note">
        <span>
          Data: Oracle's Elixir aggregated player stats. Generated{' '}
          {data ? new Date(data.generatedAt).toLocaleDateString() : '-'}.
        </span>
        <span>Unofficial fan prototype. Not endorsed by Riot Games.</span>
      </footer>
    </main>
  )
}

export default App
