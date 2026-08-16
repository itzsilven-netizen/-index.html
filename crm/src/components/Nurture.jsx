import { useState } from 'react'
import { useLeadsStore } from '../store'
import './Nurture.css'

export default function Nurture() {
  const { callLeads, emailLeads, addNurtureLog, nurtureLogs } = useLeadsStore()
  const [selectedLead, setSelectedLead] = useState(null)
  const [followUpMessage, setFollowUpMessage] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const templates = {
    callFollow: `Hi {name}, following up on our conversation about {niche}. Would you have 15 minutes next week to discuss how we can help? Looking forward to connecting!`,
    emailFollow: `Hi {name}, hope this email finds you well. I wanted to follow up on the message I sent earlier about {niche}. Let me know if you'd like to schedule a quick call!`,
    demoInvite: `Hi {name}, thanks for your interest! We'd love to show you a quick demo on {date}. Does that time work for you?`,
  }

  const allLeads = [
    ...callLeads.map(l => ({ ...l, type: 'call', email: l.phone })),
    ...emailLeads.map(l => ({ ...l, type: 'email' })),
  ].filter(l => l.status === 'contacted' || l.status === 'qualified')

  const handleAddFollowUp = () => {
    if (!selectedLead || !followUpMessage) return

    addNurtureLog({
      leadId: selectedLead.id,
      leadType: selectedLead.type,
      message: followUpMessage,
      type: 'follow-up',
    })

    setFollowUpMessage('')
    alert('Follow-up logged!')
  }

  return (
    <div className="content-section">
      <div className="nurture-header">
        <h2>Nurture Campaigns</h2>
        <p>Manage follow-ups, track responses, and send automated messages</p>
      </div>

      <div className="nurture-grid">
        <div className="nurture-panel">
          <div className="panel-header">
            <h3>Active Leads</h3>
            <span className="badge">{allLeads.length}</span>
          </div>
          <div className="leads-list">
            {allLeads.length === 0 ? (
              <div className="empty-list">No leads to nurture. Contact some leads first!</div>
            ) : (
              allLeads.map(lead => (
                <div
                  key={lead.id}
                  className={`lead-item ${selectedLead?.id === lead.id ? 'active' : ''}`}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="lead-name">{lead.business_name}</div>
                  <div className="lead-meta">{lead.contact_name || lead.niche}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="nurture-panel">
          <div className="panel-header">
            <h3>Follow-up Details</h3>
          </div>
          {selectedLead ? (
            <div className="follow-up-form">
              <div className="lead-info">
                <div className="info-row">
                  <span className="label">Business:</span>
                  <span>{selectedLead.business_name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Contact:</span>
                  <span>{selectedLead.contact_name || selectedLead.phone}</span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className="status-badge">{selectedLead.status}</span>
                </div>
              </div>

              <div className="template-quick-access">
                <button
                  className="template-btn"
                  onClick={() => setFollowUpMessage(templates.callFollow.replace('{name}', selectedLead.contact_name || 'there').replace('{niche}', selectedLead.niche))}
                >
                  Call Follow-up
                </button>
                <button
                  className="template-btn"
                  onClick={() => setFollowUpMessage(templates.demoInvite.replace('{name}', selectedLead.contact_name || 'there').replace('{date}', 'Monday'))}
                >
                  Demo Invite
                </button>
              </div>

              <div className="form-group">
                <label>Follow-up Message</label>
                <textarea
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  placeholder="Type your follow-up message..."
                  rows={6}
                />
              </div>

              <div className="form-actions">
                <button className="btn" onClick={handleAddFollowUp}>
                  Log Follow-up
                </button>
                <button className="btn btn-secondary">
                  Send Message
                </button>
              </div>

              <div className="follow-up-history">
                <h4>Follow-up History</h4>
                {nurtureLogs
                  .filter(log => log.leadId === selectedLead.id)
                  .map(log => (
                    <div key={log.id} className="history-item">
                      <div className="history-time">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="history-message">{log.message}</div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Select a lead to view follow-up details</p>
            </div>
          )}
        </div>
      </div>

      <div className="automation-card">
        <h3>🤖 AI-Powered Suggestions</h3>
        <p>Claude AI can:</p>
        <ul>
          <li>Generate personalized follow-up messages based on lead history</li>
          <li>Suggest optimal follow-up timing</li>
          <li>Auto-categorize lead interest level from responses</li>
          <li>Draft next steps based on conversation context</li>
        </ul>
      </div>
    </div>
  )
}
