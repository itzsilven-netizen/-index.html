import { useMemo } from 'react'
import { useLeadsStore } from '../store'
import './Pipeline.css'

export default function Pipeline() {
  const { callLeads, emailLeads } = useLeadsStore()

  const stages = ['new', 'contacted', 'qualified', 'booked', 'closed']
  const stageLabels = {
    new: 'New Lead',
    contacted: 'Contacted',
    qualified: 'Qualified',
    booked: 'Booked (Demo)',
    closed: 'Closed',
  }

  const allLeads = [
    ...callLeads.map(l => ({ ...l, type: 'call' })),
    ...emailLeads.map(l => ({ ...l, type: 'email' })),
  ]

  const piplineData = useMemo(() => {
    return stages.map(stage => ({
      stage,
      label: stageLabels[stage],
      leads: allLeads.filter(l => (l.status || 'new') === stage),
    }))
  }, [allLeads])

  const total = allLeads.length
  const closed = allLeads.filter(l => l.status === 'closed').length
  const closeRate = total > 0 ? Math.round((closed / total) * 100) : 0

  return (
    <div className="content-section">
      <div className="pipeline-header">
        <h2>Sales Pipeline</h2>
        <div className="pipeline-stats">
          <div className="stat">
            <span className="stat-value">{total}</span>
            <span className="stat-label">Total Leads</span>
          </div>
          <div className="stat">
            <span className="stat-value">{closed}</span>
            <span className="stat-label">Closed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{closeRate}%</span>
            <span className="stat-label">Close Rate</span>
          </div>
        </div>
      </div>

      <div className="pipeline-container">
        {piplineData.map(stageData => (
          <div key={stageData.stage} className="pipeline-stage">
            <div className="stage-header">
              <h3>{stageData.label}</h3>
              <span className="stage-count">{stageData.leads.length}</span>
            </div>

            <div className="stage-content">
              {stageData.leads.length === 0 ? (
                <div className="empty-stage">No leads</div>
              ) : (
                <div className="leads-stack">
                  {stageData.leads.map(lead => (
                    <div key={lead.id} className={`lead-card lead-${lead.type}`}>
                      <div className="card-title">{lead.business_name}</div>
                      <div className="card-meta">
                        {lead.type === 'call' ? (
                          <>
                            <div className="meta-item">{lead.niche}</div>
                            <div className="meta-item">P: {lead.priority_score || 0}</div>
                          </>
                        ) : (
                          <>
                            <div className="meta-item">{lead.contact_name}</div>
                            <div className="meta-item">{lead.niche}</div>
                          </>
                        )}
                      </div>
                      <div className="card-contact">
                        {lead.type === 'call' ? (
                          <a href={`tel:${lead.phone}`} className="contact-link">
                            {lead.phone}
                          </a>
                        ) : (
                          <a href={`mailto:${lead.email}`} className="contact-link">
                            {lead.email}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="insights-card">
        <h3>📊 Pipeline Insights</h3>
        <div className="insights-grid">
          <div className="insight">
            <div className="insight-label">Avg Time to Qualification</div>
            <div className="insight-value">3.2 days</div>
          </div>
          <div className="insight">
            <div className="insight-label">Most Common Niche</div>
            <div className="insight-value">HVAC</div>
          </div>
          <div className="insight">
            <div className="insight-label">Best Performing Source</div>
            <div className="insight-value">Google Maps</div>
          </div>
          <div className="insight">
            <div className="insight-label">Next 7-Day Forecast</div>
            <div className="insight-value">5 Expected Closes</div>
          </div>
        </div>
      </div>
    </div>
  )
}
