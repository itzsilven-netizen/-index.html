import { useMemo, useState } from 'react'
import { useLeadsStore, draftForLead } from '../store'
import './EmailPage.css'

// The real gap in Outreach: sendBatchToInstantly already exists in the
// store (calls the live /api/send-to-instantly endpoint) but had no UI
// anywhere — and Sent Today / Replied had no home after Leads merged into
// Pipeline. This is that home.
export default function EmailPage({ onOpenLead }) {
  const { callLeads, emailLeads, sendBatchToInstantly } = useLeadsStore()
  const [limit, setLimit] = useState(25)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const allLeads = useMemo(() => [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ], [callLeads, emailLeads])

  const ready = allLeads.filter(l => l.email && !l.emailSentAt && !l.optedOut)
  const sentToday = allLeads.filter(l => {
    if (!l.emailSentAt) return false
    const sent = new Date(l.emailSentAt)
    const now = new Date()
    return sent.toDateString() === now.toDateString()
  }).sort((a, b) => new Date(b.emailSentAt) - new Date(a.emailSentAt))
  const replied = allLeads.filter(l => l.repliedAt).sort((a, b) => new Date(b.repliedAt) - new Date(a.repliedAt))

  const runBatch = async () => {
    setSending(true)
    setResult(null)
    try {
      const res = await sendBatchToInstantly(limit)
      setResult(res)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Email</h1>
          <p className="page-subtitle">Batch send through Instantly, plus what went out today and who replied.</p>
        </div>
      </div>

      <div className="kpi-grid email-kpis">
        <div className="card kpi-card">
          <div className="kpi-value">{ready.length}</div>
          <div className="kpi-label">Ready to Send</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">{sentToday.length}</div>
          <div className="kpi-label">Sent Today</div>
        </div>
        <div className="card kpi-card kpi-accent">
          <div className="kpi-value">{replied.length}</div>
          <div className="kpi-label">Replied</div>
        </div>
      </div>

      <div className="card email-batch">
        <div className="email-batch-head">
          <div>
            <h3>Batch Send</h3>
            <p className="email-batch-hint">Pushes the next N unsent, has-email leads into Instantly, ranked by priority score.</p>
          </div>
        </div>
        <div className="email-batch-controls">
          <label>
            Limit
            <input type="number" min="1" max="200" value={limit} onChange={(e) => setLimit(Number(e.target.value) || 1)} />
          </label>
          <button className="btn" onClick={runBatch} disabled={sending || ready.length === 0}>
            {sending ? 'Sending…' : `Send to Instantly`}
          </button>
        </div>
        {result && (
          result.error ? (
            <div className="email-batch-result email-batch-error">{result.error}</div>
          ) : (
            <div className="email-batch-result">
              {result.pushed} sent, {result.failed} failed, out of {result.candidates} candidates.
            </div>
          )
        )}
      </div>

      <div className="email-grid">
        <EmailQueue
          title="Sent Today"
          leads={sentToday}
          empty="Nothing sent today yet. Run a batch above."
          expandedId={expandedId}
          onToggle={setExpandedId}
          onOpenLead={onOpenLead}
          timeField="emailSentAt"
          timeLabel="sent"
        />
        <EmailQueue
          title="Replied"
          leads={replied}
          empty="No replies yet."
          expandedId={expandedId}
          onToggle={setExpandedId}
          onOpenLead={onOpenLead}
          timeField="repliedAt"
          timeLabel="replied"
        />
      </div>
    </div>
  )
}

function EmailQueue({ title, leads, empty, expandedId, onToggle, onOpenLead, timeField, timeLabel }) {
  return (
    <div className="card email-queue">
      <h3 className="email-queue-title">{title} <span>{leads.length}</span></h3>
      {leads.length === 0 ? (
        <div className="panel-empty">{empty}</div>
      ) : (
        <div className="email-queue-list">
          {leads.map(lead => {
            const isOpen = expandedId === `${title}-${lead.id}`
            const { draft } = draftForLead(lead)
            const time = lead[timeField]
              ? new Date(lead[timeField]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : ''
            return (
              <div key={`${lead._type}-${lead.id}`} className="email-queue-item">
                <div
                  className="email-queue-row"
                  onClick={() => onToggle(isOpen ? null : `${title}-${lead.id}`)}
                >
                  <div className="email-queue-info">
                    <div className="email-queue-name">{lead.business_name}</div>
                    <div className="email-queue-meta">{lead.niche || '—'} &middot; {timeLabel} {time}</div>
                  </div>
                  <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); onOpenLead({ ...lead }) }}>Open</button>
                </div>
                {isOpen && <pre className="email-queue-draft">{draft}</pre>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
