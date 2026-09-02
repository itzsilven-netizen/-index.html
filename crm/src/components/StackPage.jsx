import './StackPage.css'

// Real tools only — pulled from what's actually wired into this repo
// (server.js, render.yaml, store.js), not aspirational. Update this list
// when a tool actually changes, not before.
const GROUPS = [
  {
    stage: 'Scrape',
    desc: 'Lead sourcing, before anything else touches a lead.',
    tools: [
      { name: 'Claude Code Routine', role: 'Sources + scores leads, pushes them in via the import API', layer: 'backend' },
      { name: 'POST /api/import-leads', role: 'Dedupes by phone/email/business+website before insert', layer: 'backend' },
    ],
  },
  {
    stage: 'Email',
    desc: 'The campaign send and the manual per-lead fallback.',
    tools: [
      { name: 'Instantly.ai', role: 'Batch campaign sends (POST /api/send-to-instantly), reply webhook', layer: 'backend' },
      { name: 'Gmail (web compose)', role: 'Manual per-lead send — opens a pre-filled compose tab', layer: 'frontend' },
      { name: 'emailDrafts.js', role: 'Generates the draft (4 tested structures), same one for both paths', layer: 'frontend' },
    ],
  },
  {
    stage: 'Call',
    desc: 'The actual cold call, plus the text follow-up when there\'s no answer.',
    tools: [
      { name: 'Phone (manual dial)', role: 'The call itself — no autodialer', layer: 'manual' },
      { name: 'callScripts.js', role: 'Scripts shown in-app during the call', layer: 'frontend' },
      { name: 'Google Voice', role: 'No-answer text follow-up — number copied, message pasted manually', layer: 'frontend' },
    ],
  },
  {
    stage: 'Close / Pipeline',
    desc: 'Tracking a lead from first touch to closed.',
    tools: [
      { name: 'Zustand store', role: 'Pipeline stage, tasks, calendar, nurture log — client state', layer: 'frontend' },
      { name: 'Supabase (Postgres)', role: 'Leads table — server source of truth, synced on load + every 2 min', layer: 'backend' },
    ],
  },
  {
    stage: 'App',
    desc: 'What Signal itself runs on.',
    tools: [
      { name: 'React 18 + Vite', role: 'Frontend build', layer: 'frontend' },
      { name: 'Node.js + Express', role: 'API service (server.js) — separate from the static frontend', layer: 'backend' },
      { name: 'Render', role: '2 services: lead-crm-api (Node) + claude-crm (static)', layer: 'backend' },
      { name: 'GitHub', role: 'itzsilven-netizen/-index.html, branch feature/lead-crm', layer: 'backend' },
    ],
  },
]

const LAYER_LABEL = { frontend: 'Front End', backend: 'Back End', manual: 'Manual' }

export default function StackPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Stack</h1>
          <p className="page-subtitle">Every tool doing real work in the business, grouped by which part of the signal path it runs.</p>
        </div>
      </div>

      <div className="stack-groups">
        {GROUPS.map(g => (
          <div className="card stack-group" key={g.stage}>
            <div className="stack-group-head">
              <h3>{g.stage}</h3>
              <span className="stack-group-desc">{g.desc}</span>
            </div>
            <div className="stack-tools">
              {g.tools.map(t => (
                <div className="stack-tool" key={t.name}>
                  <div className="stack-tool-top">
                    <span className="stack-tool-name">{t.name}</span>
                    <span className={`stack-layer stack-layer-${t.layer}`}>{LAYER_LABEL[t.layer]}</span>
                  </div>
                  <p className="stack-tool-role">{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
