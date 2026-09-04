import { useState, useMemo } from 'react'
import { useLeadsStore } from '../store'
import './PipelinePage.css'

const STAGES = ['new', 'contacted', 'qualified', 'booked', 'closed']
const STAGE_LABELS = { new: 'New Lead', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }
const STAGE_DESCRIPTIONS = {
  new: 'Not touched yet.',
  contacted: 'Reached by call or email — no confirmed interest yet.',
  qualified: 'Confirmed real fit — they have the need and the ability to act, and showed real interest. Ready to push toward booking.',
  booked: 'Meeting or call locked on the calendar.',
  closed: 'Deal won.',
}

const FILTER_LABELS = { all: 'Total Leads', ...STAGE_LABELS }

export default function PipelinePage({ onOpenLead, onAddLead }) {
  const { callLeads, emailLeads, updateCallLead, updateEmailLead, addNurtureLog } = useLeadsStore()
  const [dragOverStage, setDragOverStage] = useState(null)
  const [listFilter, setListFilter] = useState(null)

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
          <p className="page-subtitle">Track and manage your sales opportunities. Click a card to call, email, or text — same lead, same drawer.</p>
        </div>
        <button className="btn btn-outline-accent" onClick={onAddLead}>+ Add Lead</button>
      </div>

      <div className="kpi-grid pipeline-kpis">
        <button className="card kpi-card kpi-clickable" onClick={() => setListFilter('all')}>
          <div className="kpi-value">{total}</div>
          <div className="kpi-label">Total Leads</div>
        </button>
        <button className="card kpi-card kpi-clickable" onClick={() => setListFilter('contacted')}>
          <div className="kpi-value">{byStage.contacted.length}</div>
          <div className="kpi-label">Contacted</div>
        </button>
        <button className="card kpi-card kpi-clickable" onClick={() => setListFilter('qualified')}>
          <div className="kpi-value">{byStage.qualified.length}</div>
          <div className="kpi-label">Qualified</div>
        </button>
        <button className="card kpi-card kpi-clickable" onClick={() => setListFilter('booked')}>
          <div className="kpi-value">{byStage.booked.length}</div>
          <div className="kpi-label">Booked</div>
        </button>
        <button className="card kpi-card kpi-clickable" onClick={() => setListFilter('closed')}>
          <div className="kpi-value">{closed}</div>
          <div className="kpi-label">Closed Won</div>
        </button>
        <div className="card kpi-card kpi-accent">
          <div className="kpi-value">{closeRate}%</div>
          <div className="kpi-label">Close Rate</div>
        </div>
      </div>

      {listFilter && (
        <LeadListView
          filter={listFilter}
          leads={listFilter === 'all' ? allLeads : byStage[listFilter]}
          onOpenLead={onOpenLead}
          onClose={() => setListFilter(null)}
        />
      )}

      {!listFilter && (
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
                <span className="kanban-title"><i className="kanban-dot" />{STAGE_LABELS[stage]}</span>
                <span className="kanban-count">{byStage[stage].length}</span>
              </div>
              <p className="kanban-desc">{STAGE_DESCRIPTIONS[stage]}</p>

              <div className="kanban-cards">
                {byStage[stage].length === 0 && (
                  <div className="kanban-empty">
                    {stage === 'new' ? 'No new leads.' : `Drag leads here as they become ${STAGE_LABELS[stage].toLowerCase()}.`}
                  </div>
                )}
                {stage === 'contacted' ? (
                  <>
                    <ContactedGroup label="Calls" leads={byStage.contacted.filter(l => l._type === 'calls')} onOpenLead={onOpenLead} />
                    <ContactedGroup label="Emails" leads={byStage.contacted.filter(l => l._type === 'emails')} onOpenLead={onOpenLead} />
                  </>
                ) : (
                  byStage[stage].map(lead => <LeadCard key={`${lead._type}-${lead.id}`} lead={lead} onOpenLead={onOpenLead} />)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactedGroup({ label, leads, onOpenLead }) {
  if (leads.length === 0) return null
  return (
    <div className="kanban-subgroup">
      <div className="kanban-subgroup-label">{label} <span>{leads.length}</span></div>
      {leads.map(lead => <LeadCard key={`${lead._type}-${lead.id}`} lead={lead} onOpenLead={onOpenLead} />)}
    </div>
  )
}

function LeadCard({ lead, onOpenLead }) {
  return (
    <div
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
        <span className="kcard-badges">
          {lead.emailSentAt && <span className="kcard-tag kcard-tag-sent">✉ sent</span>}
          {lead.priority_score != null && lead.priority_score >= 3 && (
            <span className="kcard-priority">P{lead.priority_score}</span>
          )}
        </span>
      </div>
    </div>
  )
}

function LeadListView({ filter, leads, onOpenLead, onClose }) {
  return (
    <div className="card lead-list-view">
      <div className="lead-list-head">
        <h3>{FILTER_LABELS[filter]} <span className="lead-list-count">{leads.length}</span></h3>
        <button className="btn btn-ghost" onClick={onClose}>&larr; Back to board</button>
      </div>
      {leads.length === 0 ? (
        <div className="panel-empty">No leads here yet.</div>
      ) : (
        <div className="lead-list-table-wrap">
          <table className="lead-list-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Niche</th>
                <th>Contact</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={`${lead._type}-${lead.id}`} onClick={() => onOpenLead(lead)}>
                  <td className="lead-list-name">{lead.business_name}</td>
                  <td>{lead.niche || '—'}</td>
                  <td>{lead._type === 'calls' ? (lead.phone || '—') : (lead.email || '—')}</td>
                  <td>{lead.priority_score ?? '—'}</td>
                  <td><span className={`badge badge-${lead.status || 'new'}`}>{STAGE_LABELS[lead.status] || 'New Lead'}</span></td>
                  <td>{lead.lastContact || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
