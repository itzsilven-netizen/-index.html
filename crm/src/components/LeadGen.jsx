import { useState } from 'react'
import { useLeadsStore } from '../store'
import './LeadGen.css'

export default function LeadGen() {
  const [routineOutput, setRoutineOutput] = useState(null)
  const [isPasting, setIsPasting] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const syncFromServer = useLeadsStore((s) => s.syncFromServer)

  const handleSync = async () => {
    setSyncStatus('syncing')
    try {
      const { newCallLeads, newEmailLeads } = await syncFromServer()
      setSyncStatus(`✓ Synced ${newCallLeads + newEmailLeads} new leads (${newCallLeads} calls, ${newEmailLeads} emails)`)
    } catch (err) {
      setSyncStatus(`❌ Sync failed: ${err.message}. Is the CRM backend running?`)
    }
  }

  return (
    <div className="content-section">
      <div className="leadgen-header">
        <h2>Lead Generation Feed</h2>
        <p>View and manage leads from your Claude Code routines</p>
      </div>

      <div className="leadgen-card">
        <div className="card-header">
          <h3>Connect Your Routine</h3>
        </div>
        <div className="card-body">
          <p>
            Paste the output from your Claude Code lead-generation routine here.
            The CRM will automatically sync with new leads every morning.
          </p>

          <div className="paste-area">
            <textarea
              placeholder="Paste routine JSON output here..."
              className="paste-input"
              rows={10}
              onChange={(e) => {
                try {
                  setRoutineOutput(JSON.parse(e.target.value))
                  setIsPasting(false)
                } catch (err) {
                  setIsPasting(true)
                }
              }}
            />
          </div>

          <div className="leadgen-info">
            <h4>Expected Format:</h4>
            <pre>{`[
  {
    "business_name": "ABC Plumbing",
    "niche": "plumbing",
    "phone": "555-0123",
    "website": "https://abc-plumbing.com",
    "email": "info@abc.com",
    "priority_score": 4
  }
]`}</pre>
          </div>

          {routineOutput && (
            <div className="success-message">
              ✓ Valid format detected. Click "Import to CRM" to add these leads.
            </div>
          )}
        </div>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <div className="status-number">0</div>
          <div className="status-label">Routines Active</div>
        </div>
        <div className="status-card">
          <div className="status-number">0</div>
          <div className="status-label">Today's Leads</div>
        </div>
        <div className="status-card">
          <div className="status-number">0</div>
          <div className="status-label">Pending Import</div>
        </div>
      </div>

      <div className="integration-card">
        <h3>🔗 Direct API Integration</h3>
        <p>
          Your routine can POST leads directly to <code>/api/import-leads</code>{' '}
          on the CRM backend. Click below to pull in anything it's received.
        </p>
        <button className="btn" onClick={handleSync}>Sync Now</button>
        {syncStatus && <p className="leadgen-info">{syncStatus}</p>}
      </div>
    </div>
  )
}
