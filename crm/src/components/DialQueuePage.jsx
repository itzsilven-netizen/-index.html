import { useMemo, useState } from 'react'
import { useLeadsStore } from '../store'
import CallResultModal from './CallResultModal'
import AddQueueModal from './AddQueueModal'
import './DialQueuePage.css'

// Walks straight down the imported call list, one lead at a time. On a
// phone, tel: opens the native dialer directly — a real one-tap call. On a
// Chromebook/desktop, tel: instead hands off to Chrome's Android-phone-link
// prompt (a dead end without a paired Android device), so Copy stays there
// as the working fallback for pasting into TextNow. Both actions always
// show; which one actually works depends on where Signal is open.
export default function DialQueuePage() {
  const { callLeads } = useLeadsStore()
  const [skipped, setSkipped] = useState(() => new Set())
  const [showResult, setShowResult] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAddQueue, setShowAddQueue] = useState(false)

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
          <p className="page-subtitle">Straight down the imported list, highest priority first. On your phone, tap Call. On a computer, copy the number into TextNow. Log the result — next lead loads automatically.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowAddQueue(true)}>+ Add Queue</button>
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
              <span className="dial-phone">{current.phone}</span>
            </div>

            <div className="dial-actions">
              <a className="btn dial-call-btn" href={`tel:${current.phone}`}>Call {current.phone}</a>
              <button className="btn btn-ghost" onClick={copyNumber}>{copied ? 'Copied' : 'Copy Number'}</button>
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

      {showAddQueue && <AddQueueModal onClose={() => setShowAddQueue(false)} />}

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
