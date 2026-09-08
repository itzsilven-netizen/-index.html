import { useMemo, useState } from 'react'
import { useLeadsStore, draftForLead } from '../store'
import './EmailPage.css'

// The real gap in Outreach: sendBatchToInstantly already exists in the
// store (calls the live /api/send-to-instantly endpoint) but had no UI
// anywhere — and Sent Today / Replied had no home after Leads merged into
// Pipeline. This is that home.
export default function EmailPage({ onOpenLead }) {
  const { callLeads, emailLeads, sendBatchToInstantly, verifyLeadsBatch } = useLeadsStore()
  const [limit, setLimit] = useState(25)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [verifyLimit, setVerifyLimit] = useState(25)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [activeFilter, setActiveFilter] = useState('sentToday')

  const allLeads = useMemo(() => [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ], [callLeads, emailLeads])

  const ready = allLeads.filter(l => l.email && !l.emailSentAt && !l.optedOut)
  const unverified = ready.filter(l => l.emailVerified === undefined)
  const verified = ready.filter(l => l.emailVerified === true)
  const sentToday = allLeads.filter(l => {
    if (!l.emailSentAt) return false
    const sent = new Date(l.emailSentAt)
    const now = new Date()
    return sent.toDateString() === now.toDateString()
  }).sort((a, b) => new Date(b.emailSentAt) - new Date(a.emailSentAt))
  const replied = allLeads.filter(l => l.repliedAt).sort((a, b) => new Date(b.repliedAt) - new Date(a.repliedAt))

  // One config object per KPI tile — the tile, the tab button, and the list
  // panel all read from this instead of five parallel branches.
  const FILTERS = {
    ready: { label: 'Ready to Send', leads: ready, empty: 'Nothing ready — every lead is either sent, opted out, or missing an email.' },
    unverified: { label: 'Unverified', leads: unverified, empty: 'Nothing unverified. Run Verify Emails above, or everything ready has already been checked.' },
    verified: { label: 'Verified', leads: verified, empty: 'Nothing verified yet. Run Verify Emails above.' },
    sentToday: { label: 'Sent Today', leads: sentToday, empty: 'Nothing sent today yet. Run a batch above.', timeField: 'emailSentAt', timeLabel: 'sent' },
    replied: { label: 'Replied', leads: replied, empty: 'No replies yet.', timeField: 'repliedAt', timeLabel: 'replied' },
  }

  const runBatch = async () => {
    setSending(true)
    setResult(null)
    try {
      const res = await sendBatchToInstantly(limit, verifiedOnly)
      setResult(res)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setSending(false)
    }
  }

  const runVerify = async () => {
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await verifyLeadsBatch(verifyLimit)
      setVerifyResult(res)
    } catch (err) {
      setVerifyResult({ error: err.message })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Email</h1>
          <p className="page-subtitle">Verify, batch send through Instantly, and click any count below to see those leads.</p>
        </div>
      </div>

      <div className="kpi-grid email-kpis">
        {Object.entries(FILTERS).map(([key, f]) => (
          <button
            key={key}
            type="button"
            className={`card kpi-card kpi-clickable ${activeFilter === key ? 'kpi-active' : ''} ${(key === 'replied' || key === 'verified') ? 'kpi-accent' : ''}`}
            onClick={() => setActiveFilter(key)}
          >
            <div className="kpi-value">{f.leads.length}</div>
            <div className="kpi-label">{f.label}</div>
          </button>
        ))}
      </div>

      <div className="card email-batch">
        <div className="email-batch-head">
          <div>
            <h3>Verify Emails</h3>
            <p className="email-batch-hint">Runs the next N unverified leads through MillionVerifier and saves the result — no send, nothing touches Instantly. Start small.</p>
          </div>
        </div>
        <div className="email-batch-controls">
          <label>
            Limit
            <input type="number" min="1" max="500" value={verifyLimit} onChange={(e) => setVerifyLimit(Number(e.target.value) || 1)} />
          </label>
          <button className="btn" onClick={runVerify} disabled={verifying || unverified.length === 0}>
            {verifying ? 'Verifying…' : 'Verify Emails'}
          </button>
        </div>
        {verifyResult && (
          verifyResult.error ? (
            <div className="email-batch-result email-batch-error">{verifyResult.error}</div>
          ) : (
            <div className="email-batch-result">
              {verifyResult.sendable} sendable, {verifyResult.unsendable} unsendable, out of {verifyResult.checked} checked.
            </div>
          )
        )}
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
          <label className="email-batch-checkbox">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Verified only ({verified.length} available)
          </label>
          <button className="btn" onClick={runBatch} disabled={sending || (verifiedOnly ? verified.length === 0 : ready.length === 0)}>
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

      <EmailQueue
        title={FILTERS[activeFilter].label}
        leads={FILTERS[activeFilter].leads}
        empty={FILTERS[activeFilter].empty}
        expandedId={expandedId}
        onToggle={setExpandedId}
        onOpenLead={onOpenLead}
        timeField={FILTERS[activeFilter].timeField}
        timeLabel={FILTERS[activeFilter].timeLabel}
      />
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
            const time = timeField && lead[timeField]
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
                    <div className="email-queue-meta">{lead.niche || '—'}{time ? ` · ${timeLabel} ${time}` : ''}</div>
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
