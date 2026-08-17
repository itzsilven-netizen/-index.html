import { useState, useMemo } from 'react'
import { useLeadsStore } from '../store'
import './PipelinePage.css'

const STAGES = ['new', 'contacted', 'qualified', 'booked', 'closed']
const STAGE_LABELS = { new: 'New Lead', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }

export default function PipelinePage({ onOpenLead }) {
  const { callLeads, emailLeads, updateCallLead, updateEmailLead, addNurtureLog } = useLeadsStore()
  const [dragOverStage, setDragOverStage] = useState(null)

  const allLeads = useMemo(() => [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ], [callLeads, emailLeads])

  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGES.map(s => [s, []]))
    allLeads.forEach(l => { map[l.status || 'new']?.push(l) })
    return map
  }, [allLeads])

  const total = allLeads.length
  const closed = byStage.closed.length
  const closeRate = total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0'

  const moveLead = (lead, stage) => {
    if ((lead.status || 'new') === stage) return
    const updates = { status: stage, lastContact: new Date().toLocaleString() }
    if (lead._type === 'calls') updateCallLead(lead.id, updates)
    else updateEmailLead(lead.id, updates)
    addNurtureLog({
      leadId: lead.id,
      leadType: lead._type,
      message: `Moved to ${STAGE_LABELS[stage]}`,
      type: 'status',
    })
  }

  const handleDrop = (e, stage) => {
    e.preventDefault()
    setDragOverStage(null)
    try {
      const lead = JSON.parse(e.dataTransfer.getData('application/json'))
      moveLead(lead, stage)
    } catch { /* ignore invalid drops */ }
  }

  return (
    <div className="page pipeline-page">
      <div className="page-header">
        <div>
          <h1>Sales Pipeline</h1>
          <p className="page-subtitle">Track and manage your sales opportunities.</p>
        </div>
      </div>

      <div className="kpi-grid pipeline-kpis">
        <div className="card kpi-card">
          <div className="kpi-value">{total}</div>
          <div className="kpi-label">Total Leads</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">{byStage.qualified.length}</div>
          <div className="kpi-label">Qualified</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">{closed}</div>
          <div className="kpi-label">Closed Won</div>
        </div>
        <div className="card kpi-card kpi-accent">
          <div className="kpi-value">{closeRate}%</div>
          <div className="kpi-label">Close Rate</div>
        </div>
      </div>

      <div className="kanban">
        {STAGES.map(stage => (
          <div
            key={stage}
            className={`kanban-col stage-${stage} ${dragOverStage === stage ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage) }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="kanban-header">
              <span className="kanban-title">{STAGE_LABELS[stage]}</span>
              <span className="kanban-count">{byStage[stage].length}</span>
            </div>

            <div className="kanban-cards">
              {byStage[stage].length === 0 && (
                <div className="kanban-empty">
                  {stage === 'new' ? 'No new leads.' : `Drag leads here as they become ${STAGE_LABELS[stage].toLowerCase()}.`}
                </div>
              )}
              {byStage[stage].map(lead => (
                <div
                  key={`${lead._type}-${lead.id}`}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(lead))}
                  onClick={() => onOpenLead(lead)}
                >
                  <div className="kcard-name">{lead.business_name}</div>
                  <div className="kcard-meta">
                    {lead.contact_name || lead.niche || '—'}
                  </div>
                  <div className="kcard-footer">
                    {lead._type === 'calls'
                      ? <span className="kcard-contact">{lead.phone}</span>
                      : <span className="kcard-contact">{lead.email}</span>}
                    {lead.priority_score != null && lead.priority_score >= 3 && (
                      <span className="kcard-priority">P{lead.priority_score}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
