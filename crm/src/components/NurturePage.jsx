import { useMemo, useState } from 'react'
import { useLeadsStore } from '../store'
import './NurturePage.css'

const TYPE_LABELS = { status: 'Status', note: 'Note' }

// First pass — every nurture-touch already recorded across the app (call
// results, status moves, email sends, texts, replies) in one timeline, so
// there's somewhere to actually look at follow-up activity instead of just
// the 6-item preview on Dashboard.
export default function NurturePage({ onOpenLead }) {
  const { callLeads, emailLeads, nurtureLogs } = useLeadsStore()
  const [filter, setFilter] = useState('all')

  const allLeads = useMemo(() => [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ], [callLeads, emailLeads])

  const leadFor = (log) => allLeads.find(l => l.id === log.leadId && l._type === log.leadType)

  const logs = useMemo(() => {
    return [...nurtureLogs]
      .filter(l => filter === 'all' || l.type === filter)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [nurtureLogs, filter])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Nurture</h1>
          <p className="page-subtitle">Every follow-up touch across every lead — call results, status moves, emails, texts, replies — in one timeline.</p>
        </div>
      </div>

      <div className="nurture-filters">
        {['all', 'status', 'note'].map(f => (
          <button key={f} className={`nurture-filter ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="card nurture-list">
        {logs.length === 0 ? (
          <div className="panel-empty">Nothing logged yet. Call results, status changes, and follow-ups will show up here.</div>
        ) : (
          logs.map(log => {
            const lead = leadFor(log)
            return (
              <button
                key={log.id}
                className="nurture-item"
                onClick={() => lead && onOpenLead(lead)}
                disabled={!lead}
              >
                <span className={`nurture-dot nurture-dot-${log.type}`} />
                <div className="nurture-item-body">
                  <div className="nurture-item-top">
                    <span className="nurture-lead">{lead?.business_name || 'Deleted lead'}</span>
                    <span className="nurture-time">{new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <div className="nurture-msg">{log.message}</div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
