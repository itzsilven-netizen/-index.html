import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id: 'leads', label: 'Leads', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
  { id: 'pipeline', label: 'Pipeline', icon: 'M4 5h4v14H4V5zm6 4h4v10h-4V9zm6-4h4v14h-4V5z' },
  { id: 'tasks', label: 'Tasks', icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },
  { id: 'calendar', label: 'Calendar', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z' },
  { id: 'automations', label: 'Automations', icon: 'M7 2v11h3v9l7-12h-4l4-8z' },
  { id: 'inbox', label: 'Inbox', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.34 3-3 3s-3-1.34-3-3H5V5h14v10z' },
  { id: 'reports', label: 'Reports', icon: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z' },
]

function NavIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d={path} />
    </svg>
  )
}

function Starburst({ size = 22 }) {
  const rays = []
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const r1 = 4.2
    const r2 = 10
    rays.push(
      <line
        key={i}
        x1={12 + r1 * Math.cos(a)}
        y1={12 + r1 * Math.sin(a)}
        x2={12 + r2 * Math.cos(a)}
        y2={12 + r2 * Math.sin(a)}
      />
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="var(--accent)"
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
      className="logo-star"
    >
      {rays}
    </svg>
  )
}

export default function Sidebar({ activePage, onNavigate, user, onLogout, open, onClose }) {
  const navigate = (id) => {
    onNavigate(id)
    onClose?.()
  }

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Starburst />
          <span>Claude CRM</span>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">×</button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-accent" />
              <NavIcon path={item.icon} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('settings')}
          >
            <span className="nav-accent" />
            <NavIcon path="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            <span className="nav-label">Settings</span>
          </button>

          <div className="sidebar-user">
            <div className="user-avatar">{(user?.email || '?')[0].toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.email?.split('@')[0] || 'User'}</div>
              <button className="user-logout" onClick={onLogout}>Log out</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
