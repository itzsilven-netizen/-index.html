import './Sidebar.css'

const TOP_ITEM = { id: 'dashboard', label: 'Home', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' }

// The three O's — Offer / Outreach / Optimization — each a labeled group in
// the nav instead of one flat list. Pipeline absorbed Leads (same data,
// same drawer actions — add/email/text all still live there); Tasks and
// Calendar sit outside all three groups, not under any of them.
const GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'pipeline', label: 'Pipeline', icon: 'M4 5h4v14H4V5zm6 4h4v10h-4V9zm6-4h4v14h-4V5z' },
    ],
  },
  {
    label: 'Offer',
    items: [
      { id: 'offers', label: 'Offers', icon: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 12 7zm-1.6 4v6.4h1.8v-1.6h.5c1.77 0 3.1-1.15 3.1-2.9S14.47 10 12.7 10h-2.3zm1.8 1.5h.4c.85 0 1.4.5 1.4 1.4s-.55 1.4-1.4 1.4h-.4v-2.8z' },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { id: 'dialqueue', label: 'Dial', icon: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' },
      { id: 'callday', label: 'Call Day', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 3v6l5 3 .99-1.73L13 11.4V7z' },
    ],
  },
  {
    label: 'Optimization',
    items: [
      { id: 'stack', label: 'Stack', icon: 'M12 16 4 10l1.63-1.27L12 13.47l6.37-4.74L20 10l-8 6zM12 3 1 9l11 6 11-6-11-6zM12 20.53 4 14.9l-1.63 1.27L12 23l9.63-6.82L20 14.9l-8 5.63z' },
      { id: 'nurture', label: 'Nurture', icon: 'M12 21s-7.5-4.7-10.2-9.1C.3 9 1.4 5.4 4.8 4.4 7 3.8 9 4.6 12 7.3c3-2.7 5-3.5 7.2-2.9 3.4 1 4.5 4.6 3 7.5C19.5 16.3 12 21 12 21z' },
    ],
  },
]

const BOTTOM_ITEMS = [
  { id: 'tasks', label: 'Tasks', icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },
  { id: 'calendar', label: 'Calendar', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z' },
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
          <span>Home</span>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">×</button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activePage === TOP_ITEM.id ? 'active' : ''}`}
            onClick={() => navigate(TOP_ITEM.id)}
          >
            <span className="nav-accent" />
            <NavIcon path={TOP_ITEM.icon} />
            <span className="nav-label">{TOP_ITEM.label}</span>
          </button>

          {GROUPS.map(group => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(item => (
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
            </div>
          ))}

          <div className="nav-divider" />

          {BOTTOM_ITEMS.map(item => (
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
