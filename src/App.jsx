import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { resources, spokenSections } from './data'

function normalize(text) {
  return text.toLowerCase()
}

function pickVoice(voices, preset) {
  const presets = {
    balanced: ['english', 'en-', 'daniel', 'alex', 'fred', 'male', 'uk', 'google us english'],
    speech: ['english', 'en-', 'uk', 'male', 'daniel', 'alex', 'narrator'],
  }

  const preferredMatches = presets[preset] || presets.balanced

  for (const token of preferredMatches) {
    const match = voices.find((voice) => {
      const haystack = `${voice.name} ${voice.lang}`.toLowerCase()
      return haystack.includes(token)
    })
    if (match) return match
  }

  return voices[0] || null
}

function App() {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [voices, setVoices] = useState([])
  const [currentSection, setCurrentSection] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voicePreset, setVoicePreset] = useState('speech')
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)

  useEffect(() => {
    if (!synthRef.current) return undefined

    const loadVoices = () => setVoices(synthRef.current.getVoices())
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
      window.speechSynthesis.cancel()
    }
  }, [])

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

  const selectedVoice = useMemo(() => pickVoice(voices, voicePreset), [voices, voicePreset])

  const speakSection = (section) => {
    if (!synthRef.current) return

    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(section.text)
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.lang = selectedVoice?.lang || 'en-US'
    utterance.rate = voicePreset === 'speech' ? 0.78 : 0.84
    utterance.pitch = voicePreset === 'speech' ? 0.66 : 0.72
    utterance.volume = 1
    utterance.onstart = () => {
      setCurrentSection(section.id)
      setIsSpeaking(true)
    }
    utterance.onend = () => {
      setCurrentSection('')
      setIsSpeaking(false)
    }
    utterance.onerror = () => {
      setCurrentSection('')
      setIsSpeaking(false)
    }
    synthRef.current.speak(utterance)
  }

  const stopSpeaking = () => {
    synthRef.current?.cancel()
    setCurrentSection('')
    setIsSpeaking(false)
  }

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
            <p className="eyebrow">Live audio reading</p>
            <h2>Historically inspired narration mode</h2>
            <p>
              Refined using cues from surviving recordings, with slower pacing and a more
              formal public-speaking cadence. This is presented as an interpretation, not
              as Jabotinsky’s literal voice.
            </p>
            <p className="voice-meta">
              Voice: {selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : 'Browser default'}
            </p>
          </div>

          <div className="voice-actions">
            <div className="filter-row compact">
              <button
                className={voicePreset === 'speech' ? 'chip active' : 'chip'}
                onClick={() => setVoicePreset('speech')}
              >
                Speech mode
              </button>
              <button
                className={voicePreset === 'balanced' ? 'chip active' : 'chip'}
                onClick={() => setVoicePreset('balanced')}
              >
                Balanced mode
              </button>
            </div>
            <button className="stop-button" onClick={stopSpeaking} disabled={!isSpeaking}>
              Stop audio
            </button>
          </div>
        </section>

        <section className="spoken-grid">
          {spokenSections.map((section) => (
            <article key={section.id} className="spoken-card">
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              <button
                className={currentSection === section.id ? 'speak-button active' : 'speak-button'}
                onClick={() => speakSection(section)}
              >
                {currentSection === section.id ? 'Playing…' : 'Read aloud'}
              </button>
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
