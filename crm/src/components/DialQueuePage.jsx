import { useMemo, useState } from 'react'
import { useLeadsStore } from '../store'
import CallResultModal from './CallResultModal'
import './DialQueuePage.css'

// Walks straight down the imported call list, one lead at a time — copy the
// number into whatever's actually dialing (TextNow, phone, whatever), log
// the result, auto-advance. No dialer API to hook into (TextNow doesn't
// expose one), so this stays copy-and-paste rather than pretending to
// auto-dial.
export default function DialQueuePage() {
  const { callLeads } = useLeadsStore()
  const [skipped, setSkipped] = useState(() => new Set())
  const [showResult, setShowResult] = useState(false)
  const [copied, setCopied] = useState(false)

  const queue = useMemo(() => {
    return callLeads
      .filter(l => l.phone && (l.status || 'new') === 'new' && !skipped.has(l.id))
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
  }, [callLeads, skipped])

  const current = queue[0]
  const remaining = queue.length
  const totalToday = callLeads.filter(l => l.phone && (l.status || 'new') === 'new').length
  const done = totalToday - remaining

  const copyNumber = () => {
    if (!current?.phone) return
    navigator.clipboard?.writeText(current.phone).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const skip = () => {
    if (!current) return
    setSkipped(prev => new Set(prev).add(current.id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dial Queue</h1>
          <p className="page-subtitle">Straight down the imported list, highest priority first. Copy the number into TextNow (or dial from your phone), log the result, next lead loads automatically.</p>
        </div>
      </div>

      {!current ? (
        <div className="card dial-empty">
          <h3>Queue clear</h3>
          <p>No new leads with a phone number left to call. Import more, or check Leads for anything skipped.</p>
        </div>
      ) : (
        <>
          <div className="dial-progress">
            <div className="dial-progress-track">
              <div className="dial-progress-fill" style={{ width: totalToday ? `${(done / totalToday) * 100}%` : '0%' }} />
            </div>
            <span className="dial-progress-label">{done} of {totalToday} called &middot; {remaining} left</span>
          </div>

          <div className="card dial-card">
            <div className="dial-priority">Priority {current.priority_score ?? '—'}</div>
            <h2 className="dial-business">{current.business_name}</h2>
            <div className="dial-meta">
              {current.niche && <span>{current.niche}</span>}
              {current.city && <span>{current.city}</span>}
              {current.contact_name && <span>{current.contact_name}</span>}
            </div>

            <div className="dial-phone-row">
              <a className="dial-phone" href={`tel:${current.phone}`}>{current.phone}</a>
              <button className="btn btn-ghost dial-copy" onClick={copyNumber}>{copied ? 'Copied' : 'Copy'}</button>
            </div>

            <div className="dial-actions">
              <a className="btn dial-call-btn" href={`tel:${current.phone}`}>Call {current.phone}</a>
              <button className="btn btn-ghost" onClick={() => setShowResult(true)}>Log Result</button>
              <button className="btn btn-ghost" onClick={skip}>Skip</button>
            </div>
          </div>

          {queue.length > 1 && (
            <div className="dial-upnext">
              <span className="dial-upnext-label">Up next</span>
              <div className="dial-upnext-list">
                {queue.slice(1, 6).map(l => (
                  <div className="dial-upnext-item" key={l.id}>
                    <span>{l.business_name}</span>
                    <span className="dial-upnext-score">P{l.priority_score ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showResult && current && (
        <CallResultModal
          lead={current}
          leadType="calls"
          onClose={() => {
            // Covers "No Answer," which doesn't change lead.status — without
            // this it'd reappear at the top of the queue immediately after
            // being logged. Also fine for a cancelled log: still findable
            // in Leads, this queue is a today's-session tool, not the record.
            setSkipped(prev => new Set(prev).add(current.id))
            setShowResult(false)
          }}
        />
      )}
    </div>
  )
}
