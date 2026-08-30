import { useMemo, useState } from 'react'
import { useAuthStore } from '../store'
import './CallDayPage.css'

// The day's routine — recovery/mindset prep leading into two call blocks,
// same shape as the standalone Call Day tracker this page replaces.
const BLOCKS = [
  { id: 'wake', start: '6:00', end: '6:15', label: 'Wake Up / Cold Plunge', cat: 'prep' },
  { id: 'train', start: '6:15', end: '7:00', label: 'Stretch, Workout', cat: 'prep' },
  { id: 'sauna', start: '7:00', end: '7:45', label: 'Walk, Sauna, Shower', cat: 'prep' },
  { id: 'dress', start: '7:45', end: '8:00', label: 'Get Dressed, Skincare, Make Coffee', cat: 'prep' },
  { id: 'breath', start: '8:00', end: '8:15', label: 'Wim Hof Breathing', cat: 'mind' },
  { id: 'script', start: '8:15', end: '9:00', label: 'Run Script — Sobriety, Tonality', cat: 'mind' },
  { id: 'email', start: '9:00', end: '9:00', label: 'Send Emails', cat: 'mind' },
  { id: 'amcall', start: '9:00', end: '11:00', label: 'Calls', cat: 'call' },
  { id: 'lunch', start: '11:00', end: '12:00', label: 'Make Lunch', cat: 'reset' },
  { id: 'pmcall1', start: '12:00', end: '13:30', label: 'Cold Calls', cat: 'call' },
  { id: 'workout', start: '13:30', end: '14:30', label: 'Workout', cat: 'reset' },
  { id: 'pmcall2', start: '14:30', end: '15:30', label: 'Cold Calls', cat: 'call' },
]
const CAT_NAMES = { prep: 'Recovery', mind: 'Mindset', call: 'Calls', reset: 'Reset' }
const RING_CIRCUMFERENCE = 169.6 // 2π × r(27), matches the SVG below

const fmtTime = (t) => {
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ap = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ap}`
}
const rangeLabel = (b) => (b.start === b.end ? fmtTime(b.start) : `${fmtTime(b.start)}–${fmtTime(b.end)}`)

const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const emptyDay = () => ({ checks: {}, am: { dials: '', contacts: '', appts: '' }, pm: { dials: '', contacts: '', appts: '' }, notes: '' })

export default function CallDayPage() {
  const { user } = useAuthStore()
  const storageKey = (dateKey) => `callday_${user?.id || 'anon'}_${dateKey}`

  const load = (dateKey) => {
    try {
      const raw = localStorage.getItem(storageKey(dateKey))
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const save = (dateKey, data) => {
    try {
      localStorage.setItem(storageKey(dateKey), JSON.stringify(data))
    } catch {
      // localStorage unavailable — the day just won't persist across reloads
    }
  }

  const [current, setCurrent] = useState(new Date())
  const [day, setDay] = useState(() => load(toKey(new Date())) || emptyDay())

  const goTo = (d) => {
    setCurrent(d)
    setDay(load(toKey(d)) || emptyDay())
  }

  const update = (next) => {
    setDay(next)
    save(toKey(current), next)
  }

  const toggleCheck = (id) => {
    update({ ...day, checks: { ...day.checks, [id]: !day.checks[id] } })
  }

  const setMetric = (period, field, value) => {
    update({ ...day, [period]: { ...day[period], [field]: value } })
  }

  const doneCount = Object.values(day.checks).filter(Boolean).length
  const pct = Math.round((doneCount / BLOCKS.length) * 100)
  const scoreLabel = doneCount === 0 ? 'No blocks logged' : doneCount === BLOCKS.length ? 'Full day, locked in' : `${doneCount} of ${BLOCKS.length} blocks done`

  const totals = {
    dials: (Number(day.am.dials) || 0) + (Number(day.pm.dials) || 0),
    contacts: (Number(day.am.contacts) || 0) + (Number(day.pm.contacts) || 0),
    appts: (Number(day.am.appts) || 0) + (Number(day.pm.appts) || 0),
  }

  // 14-day trend — recomputed whenever the logged day changes, so today's
  // bar/row updates live as checkboxes and metrics are edited.
  const trend = useMemo(() => {
    const days = []
    const base = new Date()
    for (let j = 13; j >= 0; j--) {
      const d = new Date(base)
      d.setDate(base.getDate() - j)
      days.push(d)
    }
    const rows = days.map((d) => {
      const rec = toKey(d) === toKey(current) ? day : load(toKey(d))
      const dials = rec ? (Number(rec.am.dials) || 0) + (Number(rec.pm.dials) || 0) : 0
      return { date: d, rec, dials }
    })
    const maxDials = Math.max(1, ...rows.map((r) => r.dials))
    return { rows, maxDials }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, current])

  return (
    <div className="callday-page">
      <div className="callday-top">
        <div>
          <p className="callday-kicker">6:00 AM &rarr; 3:30 PM</p>
          <h1 className="callday-h1">Call Day</h1>
        </div>
        <div className="callday-datebar">
          <button aria-label="Previous day" onClick={() => { const d = new Date(current); d.setDate(d.getDate() - 1); goTo(d) }}>&larr;</button>
          <span className="callday-dlabel">{current.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <button aria-label="Next day" onClick={() => { const d = new Date(current); d.setDate(d.getDate() + 1); goTo(d) }}>&rarr;</button>
          <button className="callday-today" onClick={() => goTo(new Date())}>Today</button>
        </div>
      </div>

      <div className="callday-grid">
        <div className="card callday-card">
          <h2 className="callday-card-h2">Schedule <span>{doneCount}/{BLOCKS.length}</span></h2>
          <ul className="callday-tl">
            {BLOCKS.map((b) => {
              const checked = !!day.checks[b.id]
              return (
                <li key={b.id} className={checked ? 'done' : ''}>
                  <span className="callday-time">{rangeLabel(b)}</span>
                  <span className="callday-bar" data-cat={b.cat} />
                  <span className="callday-label">
                    {b.label}
                    <span className="callday-cat">{CAT_NAMES[b.cat]}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="callday-chk"
                    checked={checked}
                    onChange={() => toggleCheck(b.id)}
                    aria-label={`Mark ${b.label} done`}
                  />
                </li>
              )
            })}
          </ul>
        </div>

        <div className="callday-side">
          <div className="card callday-card">
            <h2 className="callday-card-h2">Today's Score</h2>
            <div className="callday-score-row">
              <svg className="callday-ring" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--border-strong)" strokeWidth="7" />
                <circle
                  cx="32" cy="32" r="27" fill="none" stroke="var(--accent)" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * pct) / 100}
                  transform="rotate(-90 32 32)"
                />
                <text x="32" y="37" textAnchor="middle" fontSize="16">{pct}%</text>
              </svg>
              <div>
                <div className="callday-score-big">{scoreLabel}</div>
                <div className="callday-score-sub">Routine blocks completed</div>
              </div>
            </div>

            <div className="callday-block-h">9:00 – 11:00 · AM Calls</div>
            <MetricRow period="am" values={day.am} onChange={setMetric} />

            <div className="callday-block-h">12:00–1:30 &amp; 2:30–3:30 · Cold Calls</div>
            <MetricRow period="pm" values={day.pm} onChange={setMetric} />

            <p className="callday-hint">Total: {totals.dials} dials · {totals.contacts} contacts · {totals.appts} appts</p>

            <div className="callday-block-h">Notes</div>
            <textarea
              value={day.notes}
              onChange={(e) => update({ ...day, notes: e.target.value })}
              placeholder="What worked, what to fix tomorrow…"
            />
          </div>

          <div className="card callday-card">
            <h2 className="callday-card-h2">14-Day Trend</h2>
            <div className="callday-spark">
              {trend.rows.map((r) => (
                <i
                  key={toKey(r.date)}
                  className={toKey(r.date) === toKey(current) ? 'today' : ''}
                  style={{ height: `${Math.max(2, Math.round((r.dials / trend.maxDials) * 40))}px` }}
                />
              ))}
            </div>
            <table className="callday-trend-table">
              <thead><tr><th>Day</th><th>Routine</th><th>Dials</th><th>Appts</th></tr></thead>
              <tbody>
                {trend.rows.filter((r) => r.rec).map((r) => {
                  const rec = r.rec
                  const rowDone = Object.values(rec.checks || {}).filter(Boolean).length
                  const rowPct = Math.round((rowDone / BLOCKS.length) * 100)
                  const appts = (Number(rec.am.appts) || 0) + (Number(rec.pm.appts) || 0)
                  return (
                    <tr key={toKey(r.date)}>
                      <td className="date">{r.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                      <td>{rowPct}%</td>
                      <td>{r.dials}</td>
                      <td>{appts}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {trend.rows.every((r) => !r.rec) && <p className="callday-trend-empty">Log a few days to see your trend.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ period, values, onChange }) {
  return (
    <>
      <div className="callday-mrow callday-mrow-head">
        <span>Dials</span><span>Contacts</span><span>Appts</span><span />
      </div>
      <div className="callday-mrow">
        <input type="number" min="0" placeholder="0" value={values.dials} onChange={(e) => onChange(period, 'dials', e.target.value)} />
        <input type="number" min="0" placeholder="0" value={values.contacts} onChange={(e) => onChange(period, 'contacts', e.target.value)} />
        <input type="number" min="0" placeholder="0" value={values.appts} onChange={(e) => onChange(period, 'appts', e.target.value)} />
        <span />
      </div>
    </>
  )
}
