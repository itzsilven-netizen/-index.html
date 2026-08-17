import { useState } from 'react'
import { useLeadsStore } from '../store'
import './LeadDrawer.css'

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'booked', 'closed']
const STATUS_LABELS = { new: 'New Lead', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }

export default function LeadDrawer({ lead, type, onClose }) {
  const { updateCallLead, updateEmailLead, addNurtureLog, nurtureLogs } = useLeadsStore()
  const [tab, setTab] = useState('activity')
  const [noteText, setNoteText] = useState('')

  if (!lead) return null

  const update = (updates) => {
    if (type === 'calls') updateCallLead(lead.id, updates)
    else updateEmailLead(lead.id, updates)
  }

  const logs = nurtureLogs.filter(l => l.leadId === lead.id)

  const handleAddNote = () => {
    if (!noteText.trim()) return
    addNurtureLog({ leadId: lead.id, leadType: type, message: noteText, type: 'note' })
    setNoteText('')
  }

  const handleStatusChange = (status) => {
    update({ status, lastContact: new Date().toLocaleString() })
    addNurtureLog({ leadId: lead.id, leadType: type, message: `Status changed to ${STATUS_LABELS[status]}`, type: 'status' })
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div className="drawer-title-row">
            <h2>{lead.business_name}</h2>
            <button className="drawer-close" onClick={onClose}>×</button>
          </div>
          <div className="drawer-badges">
            <span className={`badge badge-${lead.status || 'new'}`}>{STATUS_LABELS[lead.status] || 'New Lead'}</span>
            {lead.niche && <span className="drawer-niche">{lead.niche}</span>}
            {lead.priority_score != null && <span className="drawer-niche">Priority {lead.priority_score}</span>}
          </div>

          <div className="drawer-meta">
            {lead.contact_name && <MetaRow label="Contact" value={lead.contact_name} />}
            {lead.phone && <MetaRow label="Phone" value={<a href={`tel:${lead.phone}`}>{lead.phone}</a>} />}
            {lead.email && <MetaRow label="Email" value={<a href={`mailto:${lead.email}`}>{lead.email}</a>} />}
            {lead.website && <MetaRow label="Website" value={<a href={lead.website} target="_blank" rel="noreferrer">{lead.website.replace(/^https?:\/\//, '')}</a>} />}
            {lead.city && <MetaRow label="Location" value={`${lead.city}${lead.state ? ', ' + lead.state : ''}`} />}
            {lead.pitch_angle && <MetaRow label="Pitch" value={lead.pitch_angle} />}
            {lead.rating != null && <MetaRow label="Rating" value={`${lead.rating} ★ (${lead.review_count || 0} reviews)`} />}
          </div>

          <div className="drawer-actions">
            {lead.phone && <a className="btn" href={`tel:${lead.phone}`}>Call</a>}
            {lead.email && <a className="btn btn-ghost" href={`mailto:${lead.email}`}>Email</a>}
            <select
              className="drawer-status-select"
              value={lead.status || 'new'}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="drawer-tabs">
          {['activity', 'notes', 'info'].map(t => (
            <button
              key={t}
              className={`drawer-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'activity' ? 'Activity' : t === 'notes' ? 'Notes' : 'Information'}
            </button>
          ))}
        </div>

        <div className="drawer-body">
          {tab === 'activity' && (
            <div className="timeline">
              {logs.length === 0 && (
                <div className="drawer-empty">No activity yet. Calls, notes, and status changes will show up here.</div>
              )}
              {[...logs].reverse().map(log => (
                <div className="timeline-item" key={log.id}>
                  <div className={`timeline-dot ${log.type}`} />
                  <div className="timeline-content">
                    <div className="timeline-message">{log.message}</div>
                    <div className="timeline-time">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {lead.notes && (
                <div className="timeline-item">
                  <div className="timeline-dot note" />
                  <div className="timeline-content">
                    <div className="timeline-message">{lead.notes}</div>
                    <div className="timeline-time">From lead import</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div className="notes-panel">
              <textarea
                rows={4}
                placeholder="Write a note about this lead…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button className="btn" onClick={handleAddNote}>Add Note</button>
              <div className="notes-list">
                {[...logs].reverse().filter(l => l.type === 'note').map(log => (
                  <div className="note-item" key={log.id}>
                    <div>{log.message}</div>
                    <div className="timeline-time">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'info' && (
            <div className="info-grid">
              {Object.entries(lead)
                .filter(([k]) => !['id', 'status'].includes(k))
                .map(([k, v]) => (
                  <div className="info-row" key={k}>
                    <span className="info-key">{k.replace(/_/g, ' ')}</span>
                    <span className="info-val">{String(v)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  )
}
