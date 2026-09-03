import { useMemo } from 'react'
import { useLeadsStore } from '../store'
import NodeNav from './NodeNav'
import './Dashboard.css'

const STAGES = ['new', 'contacted', 'qualified', 'booked', 'closed']
const STAGE_LABELS = { new: 'New Lead', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }
const STAGE_COLORS = { new: 'var(--border)', contacted: 'var(--warning)', qualified: 'var(--warning)', booked: 'var(--accent)', closed: 'var(--success)' }

export default function Dashboard({ onNavigate, onOpenLead }) {
  const { callLeads, emailLeads, nurtureLogs, tasks, completeTask } = useLeadsStore()

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

  const todaysTasks = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0))
    .slice(0, 5)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Signal</h1>
          <p className="page-subtitle">Business optimization for service companies &mdash; fixing workflows and tech so owners buy back their time.</p>
        </div>
      </div>

      <NodeNav onNavigate={onNavigate} />

      <div className="card signal-brief">
        <div className="signal-brief-grid">
          <div className="signal-stat">
            <div className="signal-stat-k">Role</div>
            <div className="signal-stat-v">Closer</div>
            <div className="signal-stat-d">Not a builder &mdash; commission-based</div>
          </div>
          <div className="signal-stat">
            <div className="signal-stat-k">Partner</div>
            <div className="signal-stat-v accent">Casava</div>
            <div className="signal-stat-d">casava.app &middot; cold-call channel</div>
          </div>
          <div className="signal-stat">
            <div className="signal-stat-k">Commission</div>
            <div className="signal-stat-v accent">50%</div>
            <div className="signal-stat-d">Per closed deal</div>
          </div>
          <div className="signal-stat">
            <div className="signal-stat-k">ICP min. value</div>
            <div className="signal-stat-v">$500&ndash;$1K+</div>
            <div className="signal-stat-d">Per client, service trades</div>
          </div>
        </div>

        <div className="signal-casava">
          <div className="signal-casava-head">
            <h3>About Casava</h3>
            <button className="panel-link" onClick={() => onNavigate('offers')}>Full offers &rarr;</button>
          </div>
          <p>
            Casava (casava.app) is a Long Island tech services firm, est. 2024, that automates business
            operations with AI and digital tooling. Four offers: <b>AI Agents</b> (call handling, bookings,
            lead qualification, 24/7 — salons, medical/dental, restaurants, gyms, law firms),{' '}
            <b>Workflow Automation</b> (connects tools, kills manual work — any multi-tool business),{' '}
            <b>Web Design</b> ($97/mo, conversion-focused sites — Casava's default push), and{' '}
            <b>Facebook Ads Management</b> ($697/mo, done-for-you campaigns). This is who I close deals
            through, on a 50% commission, cold-call channel.
          </p>
        </div>

        <div className="signal-brief-body">
          <div className="signal-rules">
            <h3>Operating Rules</h3>
            <ul>
              <li><b>Business optimization, not tech.</b> The pitch is buying back the owner's time by fixing workflows &mdash; AI/automation is how, not what's being sold.</li>
              <li><b>Outcome, not mechanism.</b> Prospects don't care what the system is &mdash; they care what it fixes for them.</li>
              <li><b>ROI service over website.</b> A closed AI-systems deal beats a website sale, even if it's what gets pushed by default.</li>
              <li><b>Email is underrated.</b> Scalable and time-efficient &mdash; run it in parallel with calling, not instead of it.</li>
              <li><b>Reputation before scale.</b> No proof yet, only word. Bank results in trades first, then move up to real estate.</li>
              <li><b>Price signals value.</b> Untested hypothesis: raising price can raise close rate, not just margin. Test with real data.</li>
            </ul>
            <div className="signal-tags">
              <span>HVAC</span><span>Electrical</span><span>Roofing</span><span>Plumbing</span><span>&rarr; Real Estate (later)</span>
            </div>
          </div>
          <div className="signal-log">
            <h3>Decision Log</h3>
            <ul>
              <li><span className="signal-log-date">2026-09-02</span><span>Model pivot: closer role via Casava, 50% commission, ICP set to high-ticket trades.</span></li>
              <li><span className="signal-log-date">2026-09-02</span><span>Signal and the CRM merged into one app &mdash; the CRM was already the dashboard.</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Leads" value={total} icon="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        <KpiCard label="Contacted" value={contacted} icon="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        <KpiCard label="Qualified" value={stageCounts.qualified} icon="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        <KpiCard label="Closed Won" value={closed} icon="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" accent />
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

      <div className="card dash-panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <h3>Today's Tasks</h3>
          <button className="panel-link" onClick={() => onNavigate('tasks')}>All tasks →</button>
        </div>
        {todaysTasks.length === 0 ? (
          <div className="panel-empty">No open tasks. Nice.</div>
        ) : (
          <div className="dash-task-list">
            {todaysTasks.map(task => (
              <div className="dash-task-item" key={task.id}>
                <button className="task-check" onClick={() => completeTask(task.id)} />
                <div className="dash-task-info">
                  <div className="dash-task-title">{task.title}</div>
                  {task.dueAt && (
                    <div className="dash-task-due">
                      {new Date(task.dueAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <span className={`priority-tag priority-${task.priority}`}>{task.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card dash-panel">
        <div className="panel-header">
          <h3>Top Priority — Call These Next</h3>
          <button className="panel-link" onClick={() => onNavigate('pipeline')}>All leads →</button>
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
      <div className="kpi-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d={icon} />
        </svg>
      </div>
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
