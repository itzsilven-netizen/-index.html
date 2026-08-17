import './ComingSoon.css'

const COPY = {
  tasks: {
    title: 'Tasks',
    subtitle: 'Stay on top of what needs to get done.',
    body: 'Task management is coming next — follow-ups, due dates, priorities, and quick call logging, all tied to your leads.',
  },
  calendar: {
    title: 'Calendar',
    subtitle: 'Manage your schedule and appointments.',
    body: 'A weekly calendar for calls, demos, and follow-ups is on the way.',
  },
  automations: {
    title: 'Automations',
    subtitle: 'Save time with automatic CRM workflows.',
    body: 'Automatic follow-up tasks, stage-change triggers, and re-engagement flows are coming soon. (Your lead-gen routines already sync in automatically.)',
  },
  inbox: {
    title: 'Inbox',
    subtitle: 'One place for conversations with leads.',
    body: 'Unified conversation history — calls, emails, and notes per lead — is planned for a later phase.',
  },
  reports: {
    title: 'Reports',
    subtitle: 'Track performance and understand what is driving sales.',
    body: 'Conversion funnels, call analytics, and source performance reports are coming soon.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Profile, CRM preferences, and integrations.',
    body: 'Settings will live here — for now, everything works out of the box.',
  },
}

export default function ComingSoon({ pageId }) {
  const copy = COPY[pageId] || { title: pageId, subtitle: '', body: 'Coming soon.' }
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p className="page-subtitle">{copy.subtitle}</p>
        </div>
      </div>
      <div className="card coming-soon-card">
        <div className="coming-soon-glow" />
        <h3>Coming soon</h3>
        <p>{copy.body}</p>
      </div>
    </div>
  )
}
