import { useEffect, useState, type ChangeEvent } from 'react'
import {
  Accessibility, ArrowLeft, Camera, Check, ChevronRight, CircleAlert,
  Crosshair, FileText, ImagePlus, MapPin, Plus, ShieldCheck, Trash2, X,
} from 'lucide-react'

type Report = {
  id: number
  title: string
  category: string
  description: string
  location: string
  status: 'Open' | 'Resolved' | 'Reported' | 'In review'
  date: string
  image?: string
  demo?: boolean
}

type View = 'home' | 'new' | 'detail' | 'about'

const categories = [
  'Blocked curb ramp', 'Stairs-only entrance', 'Obstructed pathway',
  'Uneven surface', 'Heavy or difficult door', 'Missing signage', 'Other',
]

type AiSuggestion = { observation: string; suggested_category: string; draft_description: string; uncertainty: string }

function readReports(): Report[] {
  try {
    const saved = localStorage.getItem('accesslens-reports-v1')
    const parsed = saved ? JSON.parse(saved) as Report[] : []
    return Array.isArray(parsed)
      ? parsed.filter((report) => report && typeof report === 'object' && report.demo !== true && typeof report.id === 'number')
      : []
  } catch {
    return []
  }
}

function reportDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export default function App() {
  const [reports, setReports] = useState<Report[]>(readReports)
  const [view, setView] = useState<View>('home')
  const [selected, setSelected] = useState<Report | null>(null)
  const [image, setImage] = useState<string>()
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [formError, setFormError] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
  const [aiConsent, setAiConsent] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null)

  useEffect(() => {
    fetch('/api/status').then((response) => response.json()).then((data: { available?: boolean }) => setAiAvailable(data.available === true)).catch(() => setAiAvailable(false))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('accesslens-reports-v1', JSON.stringify(reports))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [reports])

  function resetForm() {
    setImage(undefined)
    setCategory(categories[0])
    setDescription('')
    setLocation('')
    setLocationError('')
    setFormError('')
    setAiConsent(false)
    setAiError('')
    setAiSuggestion(null)
  }

  function startNewReport() {
    resetForm()
    setView('new')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFormError('Choose a JPG or PNG photo.')
      event.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Choose a photo under 10 MB.')
      event.target.value = ''
      return
    }
    setFormError('')
    setAiError('')
    setAiSuggestion(null)
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      const compressed = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image conversion failed')), 'image/jpeg', 0.7)
      })
      const reader = new FileReader()
      reader.onload = () => setImage(String(reader.result))
      reader.onerror = () => setFormError('Could not read that photo. Please choose another one.')
      reader.readAsDataURL(compressed)
    } catch {
      setFormError('Could not prepare that photo. Please choose a JPG or PNG image.')
    }
  }

  async function analyzePhoto() {
    if (!image || !aiConsent || analyzing) return
    setAnalyzing(true)
    setAiError('')
    setAiSuggestion(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await response.json() as { suggestion?: AiSuggestion; error?: string }
      if (!response.ok || !data.suggestion) throw new Error(data.error || 'Could not analyze this photo. Please try again.')
      setAiSuggestion(data.suggestion)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Could not analyze this photo. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  function useCurrentLocation() {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Location is unavailable in this browser. Enter a nearby building or entrance instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
        setLocation((current) => current.trim() ? `${current.trim()} · ${coordinates}` : coordinates)
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Location permission is off. You can enter the place by hand.'
          : 'Could not get a GPS fix. This browser may need a secure HTTPS link for location access.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }

  function saveReport() {
    if (!image) { setFormError('Add a photo before saving.'); return }
    if (!location.trim()) { setFormError('Add a public location or campus entrance.'); return }
    if (!description.trim()) { setFormError('Add a short description of what you observed.'); return }
    const report: Report = {
      id: Date.now(), title: category, category, description: description.trim(),
      location: location.trim(), status: 'Open', date: new Date().toISOString(), image,
    }
    setReports((current) => [report, ...current])
    setSelected(report)
    setView('detail')
    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openReport(report: Report) {
    setSelected(report)
    setCopied(false)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateStatus(report: Report, status: 'Open' | 'Resolved') {
    const updated = { ...report, status }
    setSelected(updated)
    setReports((items) => items.map((item) => item.id === report.id ? updated : item))
  }

  async function copyReport(report: Report) {
    const text = `AccessLens observation: ${report.category} at ${report.location}. ${report.description}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  function deleteReport(report: Report) {
    if (!window.confirm('Delete this observation and its photo from this browser? This cannot be undone.')) return
    setReports((items) => items.filter((item) => item.id !== report.id))
    setSelected(null)
    setView('home')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('home')} aria-label="AccessLens home">
          <span className="brand-mark"><Accessibility size={19} strokeWidth={2.2} /></span>
          <span>AccessLens</span>
        </button>
        <nav className="top-nav" aria-label="Main navigation">
          <button className={view === 'home' || view === 'detail' ? 'active' : ''} onClick={() => setView('home')}>My observations</button>
          <button className={view === 'about' ? 'active' : ''} onClick={() => setView('about')}>About</button>
        </nav>
        <button className="top-cta" onClick={startNewReport}><Plus size={17} /> New observation</button>
      </header>

      <main className="main-content">
        {view === 'home' && <section className="home-view">
          <div className="home-intro">
            <div className="intro-copy">
              <p className="eyebrow">ACCESSIBILITY FIELD NOTES</p>
              <h1>Notice a barrier.<br /><span>Make it visible.</span></h1>
              <p className="intro-lede">Capture what you see, add a little context, and keep a clear record of the route.</p>
              <button className="button-primary new-button" onClick={startNewReport}><Camera size={18} /> Record an observation</button>
            </div>
            <div className="privacy-card">
              <span className="privacy-icon"><ShieldCheck size={22} /></span>
              <div><b>Your notes stay yours</b><p>Saved in this browser on this device. Nothing is shared automatically.</p></div>
            </div>
          </div>

          <section className="observations-section" aria-labelledby="observations-title">
            <div className="section-heading">
              <div><p className="eyebrow">YOUR FIELD NOTES</p><h2 id="observations-title">Observations <span className="count-badge">{reports.length}</span></h2></div>
              {reports.length > 0 && <button className="quiet-button" onClick={startNewReport}><Plus size={16} /> Add note</button>}
            </div>
            {reports.length === 0 ? <div className="empty-state">
              <span className="empty-icon"><ImagePlus size={25} /></span>
              <h3>Nothing here yet</h3>
              <p>Your observations will appear here after you save them.</p>
              <button className="button-secondary" onClick={startNewReport}>Create your first note <ChevronRight size={16} /></button>
            </div> : <div className="report-grid">
              {reports.map((report) => <button className="observation-card" key={report.id} onClick={() => openReport(report)}>
                <span className="card-image">{report.image ? <img src={report.image} alt="" /> : <ImagePlus size={24} />}</span>
                <span className="card-info"><span className="card-category">{report.category}</span><b>{report.location}</b><small>{reportDate(report.date)}</small></span>
                <span className={`state-pill ${report.status === 'Resolved' ? 'resolved' : ''}`}><i />{report.status === 'Resolved' ? 'Resolved' : 'Open'}</span>
                <ChevronRight className="card-chevron" size={19} />
              </button>)}
            </div>}
          </section>
          <p className="home-footnote"><CircleAlert size={15} /> These are personal observations, not accessibility or compliance assessments.</p>
        </section>}

        {view === 'new' && <section className="editor-view">
          <button className="back-button" onClick={() => setView('home')}><ArrowLeft size={17} /> My observations</button>
          <div className="editor-heading"><p className="eyebrow">NEW FIELD NOTE</p><h1>What did you notice?</h1><p>Document the route as you found it. Stick to what you can see.</p></div>
          <div className="editor-layout">
            <div className="editor-card">
              <div className="field-title"><span>01</span><div><h2>Add a photo</h2><p>Frame the barrier and nearby path. Avoid faces and identifying details.</p></div></div>
              <label className={`photo-picker ${image ? 'with-image' : ''}`}>
                {image ? <><img src={image} alt="Preview of your observation" /><span className="photo-replace"><Camera size={16} /> Change photo</span></> : <><span className="picker-icon"><Camera size={24} /></span><b>Take a photo</b><small>or choose one from your library · JPG or PNG</small></>}
                <input type="file" accept="image/jpeg,image/png" capture="environment" onChange={onImageChange} aria-label="Take a photo or choose an image" />
              </label>

              <section className="ai-panel" aria-labelledby="ai-heading">
                <div className="ai-panel-heading"><span className="ai-sparkle">✦</span><div><h3 id="ai-heading">GPT photo assist <span>Optional</span></h3><p>Get a draft description from what’s visible in your photo.</p></div></div>
                {aiAvailable === false ? <p className="ai-setup-note">GPT is not connected yet. Add an OpenAI API key to <code>.env.local</code> on the computer hosting AccessLens, then restart the app.</p> : <>
                  <label className="ai-consent"><input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} /><span>I agree to send this photo to OpenAI for analysis. The place and GPS fields are not sent.</span></label>
                  <p className="ai-privacy-note">Only the photo is sent, after you tap Analyze. Avoid faces and private details. API usage may incur a charge.</p>
                  <button className="button-secondary ai-button" type="button" disabled={!image || !aiConsent || aiAvailable !== true || analyzing} onClick={() => void analyzePhoto()}>{analyzing ? 'Analyzing photo…' : 'Analyze photo with GPT'}</button>
                </>}
                {aiError && <p className="inline-error" role="alert">{aiError}</p>}
                {aiSuggestion && <div className="ai-result"><p className="ai-result-label">DRAFT SUGGESTION · REVIEW BEFORE USING</p><b>{aiSuggestion.observation}</b><p>{aiSuggestion.draft_description}</p><small>{aiSuggestion.uncertainty}</small><button type="button" className="button-secondary" onClick={() => { setCategory(aiSuggestion.suggested_category); setDescription(aiSuggestion.draft_description) }}>Use draft in my note</button></div>}
              </section>

              <div className="field-title second"><span>02</span><div><h2>Add context</h2><p>A few details help you remember exactly what you saw.</p></div></div>
              <label className="input-label">Type of barrier<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="input-label">Place<input required placeholder="Building, entrance, or intersection" value={location} onChange={(event) => { setLocation(event.target.value); setLocationError('') }} /><small>Use a public place. Don’t enter a home address.</small></label>
              <button className="location-action" type="button" onClick={useCurrentLocation} disabled={locating}><Crosshair size={16} />{locating ? 'Finding your location…' : 'Add current coordinates'}<span>Optional</span></button>
              {locationError && <p className="inline-error" role="status">{locationError}</p>}
              <label className="input-label description-label">What happened?<textarea required placeholder="Describe what is visible and how it affects the route." value={description} onChange={(event) => setDescription(event.target.value)} rows={4} /></label>
              {formError && <p className="inline-error" role="alert">{formError}</p>}
              {storageError && <p className="inline-error" role="alert">This browser is out of storage space. Remove older observations before saving another photo.</p>}
              <div className="save-row"><span><ShieldCheck size={16} /> Saved on this device only</span><button className="button-primary" onClick={saveReport} disabled={storageError}><Check size={17} /> Save observation</button></div>
            </div>
            <aside className="editor-aside"><div className="aside-icon"><ShieldCheck size={21} /></div><h3>Private by default</h3><p>Your photo and notes stay in this browser unless you choose GPT analysis. They are not sent to an agency or uploaded to a shared map.</p><div className="aside-divider" /><p className="aside-small">GPT suggestions are drafts about visible details, not accessibility or compliance assessments.</p></aside>
          </div>
        </section>}

        {view === 'detail' && selected && <section className="detail-view">
          <button className="back-button" onClick={() => setView('home')}><ArrowLeft size={17} /> My observations</button>
          <article className="detail-card">
            <div className="detail-image">{selected.image ? <img src={selected.image} alt={`Photo: ${selected.category}`} /> : <div className="detail-image-empty"><ImagePlus size={28} /></div>}</div>
            <div className="detail-body">
              <div className="detail-topline"><p className="eyebrow">FIELD NOTE · {reportDate(selected.date).toUpperCase()}</p><button className="icon-button" aria-label="Delete observation" onClick={() => deleteReport(selected)}><Trash2 size={17} /></button></div>
              <div className="detail-title-row"><h1>{selected.category}</h1><span className={`state-pill ${selected.status === 'Resolved' ? 'resolved' : ''}`}><i />{selected.status === 'Resolved' ? 'Resolved' : 'Open'}</span></div>
              <p className="detail-location"><MapPin size={16} />{selected.location}</p>
              <p className="detail-description">{selected.description}</p>
              <div className="detail-actions"><button className="button-secondary" onClick={() => void copyReport(selected)}><FileText size={16} />{copied ? 'Copied' : 'Copy summary'}</button><button className="button-primary" onClick={() => updateStatus(selected, selected.status === 'Resolved' ? 'Open' : 'Resolved')}><Check size={16} /> Mark {selected.status === 'Resolved' ? 'open' : 'resolved'}</button></div>
            </div>
          </article>
          <p className="detail-footnote"><ShieldCheck size={16} /> Stored in this browser on this device. It has not been shared.</p>
        </section>}

        {view === 'about' && <section className="about-view">
          <button className="back-button" onClick={() => setView('home')}><ArrowLeft size={17} /> My observations</button>
          <div className="editor-heading"><p className="eyebrow">ABOUT ACCESSLENS</p><h1>A record of what you see.</h1><p>AccessLens helps people document possible barriers along public routes and entrances.</p></div>
          <div className="about-steps">
            <article><span>01</span><h2>Capture</h2><p>Take a photo that shows the barrier and the surrounding route.</p></article>
            <article><span>02</span><h2>Add context</h2><p>Choose a barrier type, note the place, and describe what you observed.</p></article>
            <article><span>03</span><h2>Keep your notes</h2><p>Review observations on this device and copy a summary if you choose to share one.</p></article>
          </div>
          <div className="about-note"><ShieldCheck size={19} /><p><b>Private by default.</b> Photos and notes are saved in this browser. If configured, optional GPT analysis sends a photo to OpenAI only after you opt in and press Analyze. There is no live map, cloud sync, or agency submission.</p></div>
        </section>}
      </main>

      <footer className="app-footer"><span>AccessLens</span><span>Field notes for more accessible routes.</span></footer>
    </div>
  )
}
