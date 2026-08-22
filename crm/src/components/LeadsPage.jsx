import { useState, useMemo, useRef } from 'react'
import { useLeadsStore } from '../store'
import { FORMATS } from '../emailDrafts'
import AddLeadForm from './AddLeadForm'
import './LeadsPage.css'

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }

export default function LeadsPage({ onOpenLead }) {
  const { callLeads, updateCallLead, importCallLeads } = useLeadsStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [nicheFilter, setNicheFilter] = useState('all')
  const [hasEmailFilter, setHasEmailFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const fileInputRef = useRef(null)

  const niches = useMemo(() => [...new Set(callLeads.map(l => l.niche).filter(Boolean))].sort(), [callLeads])

  const filtered = useMemo(() => callLeads.filter(l => {
    if (statusFilter !== 'all' && (l.status || 'new') !== statusFilter) return false
    if (nicheFilter !== 'all' && l.niche !== nicheFilter) return false
    if (hasEmailFilter === 'has_email' && !l.email) return false
    if (hasEmailFilter === 'no_email' && l.email) return false
    if (hasEmailFilter === 'sent' && !l.emailSentAt) return false
    if (hasEmailFilter === 'not_sent' && (!l.email || l.emailSentAt)) return false
    if (hasEmailFilter === 'replied' && !l.repliedAt) return false
    if (hasEmailFilter === 'opted_out' && !l.optedOut) return false
    if (formatFilter !== 'all' && l.emailFormat !== formatFilter) return false
    return true
  }), [callLeads, statusFilter, nicheFilter, hasEmailFilter, formatFilter])

  // Sent/replied counts per format, so it's possible to see which of the 4
  // tested structures is actually performing without leaving the list.
  const formatStats = useMemo(() => FORMATS.map(f => {
    const leads = callLeads.filter(l => l.emailFormat === f.id)
    const sent = leads.filter(l => l.emailSentAt).length
    const replied = leads.filter(l => l.repliedAt).length
    return { ...f, sent, replied, replyRate: sent ? Math.round((replied / sent) * 100) : null }
  }), [callLeads])

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        importCallLeads(imported)
        alert(`Imported ${imported.length} leads`)
      } catch (err) {
        alert('Error parsing file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          <p className="page-subtitle">All your leads in one place.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button className="btn" onClick={() => setShowAddForm(true)}>+ Add Lead</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="leads-toolbar">
        <div className="leads-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
            <option value="all">All niches</option>
            {niches.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={hasEmailFilter} onChange={(e) => setHasEmailFilter(e.target.value)}>
            <option value="all">All leads</option>
            <option value="has_email">Has email</option>
            <option value="no_email">No email</option>
            <option value="sent">Sent</option>
            <option value="not_sent">Not sent (has email)</option>
            <option value="replied">Replied</option>
            <option value="opted_out">Opted out</option>
          </select>
          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
            <option value="all">All formats</option>
            {FORMATS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {(statusFilter !== 'all' || nicheFilter !== 'all' || hasEmailFilter !== 'all' || formatFilter !== 'all') && (
            <button className="btn-clear" onClick={() => { setStatusFilter('all'); setNicheFilter('all'); setHasEmailFilter('all'); setFormatFilter('all') }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="card format-stats">
        {formatStats.map(f => (
          <button
            key={f.id}
            className={`format-stat ${formatFilter === f.id ? 'active' : ''}`}
            onClick={() => setFormatFilter(formatFilter === f.id ? 'all' : f.id)}
          >
            <div className="format-stat-name">{f.name}</div>
            <div className="format-stat-structure">{f.structure}</div>
            <div className="format-stat-numbers">
              {f.sent} sent · {f.replied} replied{f.replyRate != null && ` · ${f.replyRate}%`}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card leads-empty">
          <h3>No leads found</h3>
          <p>{callLeads.length === 0 ? 'Import a batch or add your first lead to get started.' : 'No leads match the current filters.'}</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Niche</th>
                <th>Phone</th>
                <th>Priority</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => onOpenLead({ ...lead, _type: 'calls' })}>
                  <td className="cell-lead">{lead.business_name}</td>
                  <td className="cell-muted">{lead.niche || '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {lead.phone ? <a className="cell-link" href={`tel:${lead.phone}`}>{lead.phone}</a> : '—'}
                  </td>
                  <td>
                    <span className={`score score-${lead.priority_score || 0}`}>{lead.priority_score ?? 0}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {!lead.email ? (
                      <span className="cell-muted">No email available</span>
                    ) : lead.optedOut ? (
                      <span className="badge badge-optedout">Opted out</span>
                    ) : lead.repliedAt ? (
                      <span className="badge badge-replied">Replied</span>
                    ) : lead.emailSentAt ? (
                      <span className="badge badge-sent">Sent</span>
                    ) : (
                      <a className="cell-link" href={`mailto:${lead.email}`} title={lead.email}>✓ Email</a>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className={`status-pill status-${lead.status || 'new'}`}
                      value={lead.status || 'new'}
                      onChange={(e) => updateCallLead(lead.id, { status: e.target.value, lastContact: new Date().toLocaleString() })}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="cell-muted">{lead.lastContact || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="leads-mobile">
          {filtered.map(lead => (
            <div className="lead-card" key={lead.id} onClick={() => onOpenLead({ ...lead, _type: 'calls' })}>
              <div className="lead-card-top">
                <span className="cell-lead">{lead.business_name}</span>
                <span className={`score score-${lead.priority_score || 0}`}>{lead.priority_score ?? 0}</span>
              </div>
              <div className="lead-card-niche">{lead.niche || '—'}</div>
              <div className="lead-card-bottom" onClick={(e) => e.stopPropagation()}>
                {lead.phone ? (
                  <a className="lead-card-call" href={`tel:${lead.phone}`}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    {lead.phone}
                  </a>
                ) : (
                  <span className="cell-muted">No phone</span>
                )}
                <select
                  className={`status-pill status-${lead.status || 'new'}`}
                  value={lead.status || 'new'}
                  onChange={(e) => updateCallLead(lead.id, { status: e.target.value, lastContact: new Date().toLocaleString() })}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {lead.email && (
                <div className="lead-card-email">
                  {lead.optedOut ? (
                    <span className="badge badge-optedout">Opted out</span>
                  ) : lead.repliedAt ? (
                    <span className="badge badge-replied">Replied</span>
                  ) : lead.emailSentAt ? (
                    <span className="badge badge-sent">Email sent</span>
                  ) : (
                    <span className="cell-muted">✓ Email on file</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <AddLeadForm type="calls" onClose={() => setShowAddForm(false)} />
      )}
    </div>
  )
}
