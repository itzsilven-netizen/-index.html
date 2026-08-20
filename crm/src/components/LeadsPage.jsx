import { useState, useMemo, useRef } from 'react'
import { useLeadsStore } from '../store'
import AddLeadForm from './AddLeadForm'
import './LeadsPage.css'

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }

export default function LeadsPage({ onOpenLead }) {
  const { callLeads, emailLeads, updateCallLead, updateEmailLead, importCallLeads, importEmailLeads } = useLeadsStore()
  const [subTab, setSubTab] = useState('calls')
  const [statusFilter, setStatusFilter] = useState('all')
  const [nicheFilter, setNicheFilter] = useState('all')
  const [emailFilter, setEmailFilter] = useState('all')
  const [hasEmailFilter, setHasEmailFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const fileInputRef = useRef(null)

  const leads = subTab === 'calls' ? callLeads : emailLeads
  const updateLead = subTab === 'calls' ? updateCallLead : updateEmailLead

  const niches = useMemo(() => [...new Set(leads.map(l => l.niche).filter(Boolean))].sort(), [leads])

  const filtered = useMemo(() => leads.filter(l => {
    if (statusFilter !== 'all' && (l.status || 'new') !== statusFilter) return false
    if (nicheFilter !== 'all' && l.niche !== nicheFilter) return false
    if (subTab === 'emails' && emailFilter !== 'all') {
      if (emailFilter === 'sent' && !l.emailSentAt) return false
      if (emailFilter === 'not_sent' && l.emailSentAt) return false
      if (emailFilter === 'replied' && !l.repliedAt) return false
      if (emailFilter === 'opted_out' && !l.optedOut) return false
    }
    if (subTab === 'calls' && hasEmailFilter !== 'all') {
      if (hasEmailFilter === 'has_email' && !l.email) return false
      if (hasEmailFilter === 'no_email' && l.email) return false
    }
    return true
  }), [leads, statusFilter, nicheFilter, emailFilter, hasEmailFilter, subTab])

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        if (subTab === 'calls') importCallLeads(imported)
        else importEmailLeads(imported)
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
        <div className="leads-subtabs">
          <button className={`subtab ${subTab === 'calls' ? 'active' : ''}`} onClick={() => setSubTab('calls')}>
            Calls <span className="subtab-count">{callLeads.length}</span>
          </button>
          <button className={`subtab ${subTab === 'emails' ? 'active' : ''}`} onClick={() => setSubTab('emails')}>
            Emails <span className="subtab-count">{emailLeads.length}</span>
          </button>
        </div>

        <div className="leads-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
            <option value="all">All niches</option>
            {niches.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {subTab === 'emails' && (
            <select value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)}>
              <option value="all">All emails</option>
              <option value="sent">Sent</option>
              <option value="not_sent">Not sent</option>
              <option value="replied">Replied</option>
              <option value="opted_out">Opted out</option>
            </select>
          )}
          {subTab === 'calls' && (
            <select value={hasEmailFilter} onChange={(e) => setHasEmailFilter(e.target.value)}>
              <option value="all">All leads</option>
              <option value="has_email">Has email</option>
              <option value="no_email">No email</option>
            </select>
          )}
          {(statusFilter !== 'all' || nicheFilter !== 'all' || emailFilter !== 'all' || hasEmailFilter !== 'all') && (
            <button className="btn-clear" onClick={() => { setStatusFilter('all'); setNicheFilter('all'); setEmailFilter('all'); setHasEmailFilter('all') }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card leads-empty">
          <h3>No leads found</h3>
          <p>{leads.length === 0 ? 'Import a batch or add your first lead to get started.' : 'No leads match the current filters.'}</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                {subTab === 'emails' && <th>Contact</th>}
                <th>Niche</th>
                <th>{subTab === 'calls' ? 'Phone' : 'Email'}</th>
                {subTab === 'calls' && <th>Priority</th>}
                {subTab === 'calls' && <th>Email</th>}
                {subTab === 'emails' && <th>Sent</th>}
                <th>Status</th>
                <th>Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => onOpenLead({ ...lead, _type: subTab })}>
                  <td className="cell-lead">{lead.business_name}</td>
                  {subTab === 'emails' && <td className="cell-muted">{lead.contact_name || '—'}</td>}
                  <td className="cell-muted">{lead.niche || '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {subTab === 'calls'
                      ? (lead.phone ? <a className="cell-link" href={`tel:${lead.phone}`}>{lead.phone}</a> : '—')
                      : (lead.email ? <a className="cell-link" href={`mailto:${lead.email}`}>{lead.email}</a> : '—')}
                  </td>
                  {subTab === 'calls' && (
                    <td>
                      <span className={`score score-${lead.priority_score || 0}`}>{lead.priority_score ?? 0}</span>
                    </td>
                  )}
                  {subTab === 'calls' && (
                    <td onClick={(e) => e.stopPropagation()}>
                      {lead.email ? (
                        <a className="cell-link" href={`mailto:${lead.email}`} title={lead.email}>✓ Email</a>
                      ) : (
                        <span className="cell-muted">No email available</span>
                      )}
                    </td>
                  )}
                  {subTab === 'emails' && (
                    <td>
                      {lead.optedOut ? (
                        <span className="badge badge-optedout">Opted out</span>
                      ) : lead.repliedAt ? (
                        <span className="badge badge-replied">Replied</span>
                      ) : lead.emailSentAt ? (
                        <span className="badge badge-sent">Sent</span>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>
                  )}
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className={`status-pill status-${lead.status || 'new'}`}
                      value={lead.status || 'new'}
                      onChange={(e) => updateLead(lead.id, { status: e.target.value, lastContact: new Date().toLocaleString() })}
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

      {showAddForm && (
        <AddLeadForm type={subTab} onClose={() => setShowAddForm(false)} />
      )}
    </div>
  )
}
