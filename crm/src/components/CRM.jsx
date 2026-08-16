import { useState, useRef } from 'react'
import { useLeadsStore } from '../store'
import './CRM.css'

export default function CRM() {
  const { callLeads, emailLeads, updateCallLead, updateEmailLead, importCallLeads, importEmailLeads } = useLeadsStore()
  const [activeSubTab, setActiveSubTab] = useState('calls')
  const [editingId, setEditingId] = useState(null)
  const fileInputRef = useRef(null)

  const handleImport = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const leads = JSON.parse(event.target.result)
        if (type === 'calls') {
          importCallLeads(leads)
        } else {
          importEmailLeads(leads)
        }
        alert(`Imported ${leads.length} ${type} leads`)
      } catch (err) {
        alert('Error parsing file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const renderCallLeads = () => (
    <div className="crm-section">
      <div className="section-header">
        <h2>Call Leads</h2>
        <button className="btn" onClick={() => fileInputRef.current?.click()}>
          + Import Leads
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={(e) => handleImport(e, 'calls')}
          style={{ display: 'none' }}
        />
      </div>

      {callLeads.length === 0 ? (
        <div className="empty-state">
          <p>No call leads yet. Import your first batch to get started.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Niche</th>
              <th>Phone</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Last Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {callLeads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.business_name}</td>
                <td>{lead.niche}</td>
                <td>
                  <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                </td>
                <td>
                  <span className={`priority priority-${lead.priority_score || 0}`}>
                    {lead.priority_score || 0}
                  </span>
                </td>
                <td>
                  <select
                    value={lead.status || 'new'}
                    onChange={(e) => updateCallLead(lead.id, { status: e.target.value })}
                    className="status-select"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="booked">Booked</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td>{lead.lastContact || '-'}</td>
                <td>
                  <button
                    className="btn-small"
                    onClick={() => setEditingId(lead.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const renderEmailLeads = () => (
    <div className="crm-section">
      <div className="section-header">
        <h2>Email Leads</h2>
        <button className="btn" onClick={() => fileInputRef.current?.click()}>
          + Import Leads
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={(e) => handleImport(e, 'emails')}
          style={{ display: 'none' }}
        />
      </div>

      {emailLeads.length === 0 ? (
        <div className="empty-state">
          <p>No email leads yet. Import your first batch to get started.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Niche</th>
              <th>Status</th>
              <th>Last Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {emailLeads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.business_name}</td>
                <td>{lead.contact_name || '-'}</td>
                <td>
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                </td>
                <td>{lead.niche}</td>
                <td>
                  <select
                    value={lead.status || 'new'}
                    onChange={(e) => updateEmailLead(lead.id, { status: e.target.value })}
                    className="status-select"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="booked">Booked</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td>{lead.lastContact || '-'}</td>
                <td>
                  <button
                    className="btn-small"
                    onClick={() => setEditingId(lead.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div className="content-section">
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeSubTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('calls')}
        >
          Calls ({callLeads.length})
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'emails' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('emails')}
        >
          Emails ({emailLeads.length})
        </button>
      </div>

      {activeSubTab === 'calls' && renderCallLeads()}
      {activeSubTab === 'emails' && renderEmailLeads()}
    </div>
  )
}
