import { useMemo } from 'react'
import { useLeadsStore } from '../store'
import './Dashboard.css'

const STAGES = ['new', 'contacted', 'qualified', 'booked', 'closed']
const STAGE_LABELS = { new: 'New Lead', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }
const STAGE_COLORS = { new: 'var(--blue)', contacted: 'var(--purple)', qualified: 'var(--yellow)', booked: 'var(--accent)', closed: 'var(--green)' }

export default function Dashboard({ onNavigate, onOpenLead }) {
  const { callLeads, emailLeads, nurtureLogs } = useLeadsStore()

  const allLeads = useMemo(() => [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ], [callLeads, emailLeads])

  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(STAGES.map(s => [s, 0]))
    allLeads.forEach(l => { counts[l.status || 'new'] = (counts[l.status || 'new'] || 0) + 1 })
    return counts
  }, [allLeads])

  const total = allLeads.length
  const contacted = total - stageCounts.new
  const closed = stageCounts.closed
  const maxStage = Math.max(...STAGES.map(s => stageCounts[s]), 1)

  const recentActivity = [...nurtureLogs].reverse().slice(0, 6)
  const highPriority = allLeads
    .filter(l => (l.status || 'new') === 'new' && (l.priority_score || 0) >= 3)
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 5)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back 👋</h1>
          <p className="page-subtitle">Here's what's happening with your CRM today.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Leads" value={total} icon="👥" />
        <KpiCard label="Contacted" value={contacted} icon="📞" />
        <KpiCard label="Qualified" value={stageCounts.qualified} icon="⭐" />
        <KpiCard label="Closed Won" value={closed} icon="✅" accent />
      </div>

      <div className="dash-grid">
        <div className="card dash-panel">
          <div className="panel-header">
            <h3>Pipeline Overview</h3>
            <button className="panel-link" onClick={() => onNavigate('pipeline')}>View pipeline →</button>
          </div>
          <div className="pipeline-bars">
            {STAGES.map(stage => (
              <button
                key={stage}
                className="pipeline-bar-col"
                onClick={() => onNavigate('pipeline')}
              >
                <div className="bar-count">{stageCounts[stage]}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${Math.max((stageCounts[stage] / maxStage) * 100, 4)}%`,
                      background: STAGE_COLORS[stage],
                    }}
                  />
                </div>
                <div className="bar-label">{STAGE_LABELS[stage]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card dash-panel">
          <div className="panel-header">
            <h3>Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="panel-empty">
              No activity yet. Call results, notes, and status changes will appear here.
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map(log => {
                const lead = allLeads.find(l => l.id === log.leadId)
                return (
                  <div className="activity-item" key={log.id}>
                    <div className="activity-dot" />
                    <div>
                      <div className="activity-lead">{lead?.business_name || 'Lead'}</div>
                      <div className="activity-msg">{log.message}</div>
                      <div className="activity-time">{timeAgo(log.timestamp)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card dash-panel">
        <div className="panel-header">
          <h3>Top Priority — Call These Next</h3>
          <button className="panel-link" onClick={() => onNavigate('leads')}>All leads →</button>
        </div>
        {highPriority.length === 0 ? (
          <div className="panel-empty">No high-priority new leads right now.</div>
        ) : (
          <div className="priority-list">
            {highPriority.map(lead => (
              <button className="priority-item" key={`${lead._type}-${lead.id}`} onClick={() => onOpenLead(lead)}>
                <div className="priority-score" data-score={lead.priority_score}>{lead.priority_score}</div>
                <div className="priority-info">
                  <div className="priority-name">{lead.business_name}</div>
                  <div className="priority-meta">{lead.niche}{lead.city ? ` · ${lead.city}` : ''}</div>
                </div>
                {lead.phone && <span className="priority-phone">{lead.phone}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, accent }) {
  return (
    <div className={`card kpi-card ${accent ? 'kpi-accent' : ''}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
