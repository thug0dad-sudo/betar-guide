import { useMemo, useState } from 'react'
import './App.css'
import { resources, spokenSections } from './data'

function normalize(text) {
  return text.toLowerCase()
}

function App() {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState('All')

  const types = ['All', ...new Set(resources.map((item) => item.type))]

  const filtered = useMemo(() => {
    const q = normalize(query.trim())

    return resources.filter((item) => {
      const matchesType = activeType === 'All' || item.type === activeType
      if (!matchesType) return false
      if (!q) return true

      const haystack = normalize(
        [
          item.title,
          item.type,
          item.period,
          item.summary,
          item.tags.join(' '),
          item.details.join(' '),
        ].join(' ')
      )

      return haystack.includes(q)
    })
  }, [query, activeType])

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Searchable resource guide</p>
        <h1>Zeev Jabotinsky and Betar</h1>
        <p className="hero-copy">
          A compact research app for exploring biography, ideas, movement history, and
          primary texts connected to Jabotinsky and the Betar youth movement.
        </p>

        <div className="controls">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Jabotinsky, Betar, Iron Wall, Revisionist Zionism..."
            aria-label="Search resources"
          />

          <div className="filter-row">
            {types.map((type) => (
              <button
                key={type}
                className={type === activeType ? 'chip active' : 'chip'}
                onClick={() => setActiveType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="voice-panel">
          <div>
            <p className="eyebrow">Audio status</p>
            <h2>Voice upgrade path</h2>
            <p>
              The browser voice has been removed because it sounded too generic. The next
              proper step is a custom hosted audio voice trained or tuned from archival
              recordings you approve for use.
            </p>
            <p className="voice-meta">
              Current state: prepared spoken sections, pending better external voice engine
            </p>
          </div>
        </section>

        <section className="spoken-grid">
          {spokenSections.map((section) => (
            <article key={section.id} className="spoken-card">
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </article>
          ))}
        </section>

        <section className="results-bar">
          <strong>{filtered.length}</strong> resource{filtered.length === 1 ? '' : 's'} found
        </section>

        <section className="card-grid">
          {filtered.map((item) => (
            <article key={item.id} className="card">
              <div className="card-top">
                <span className="badge">{item.type}</span>
                <span className="period">{item.period}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>

              <ul>
                {item.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>

              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="links">
                {item.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App
