import './NodeNav.css'

// The knowledge-base map: Home in the center, every other page one node
// away, connected by lines — the navigation IS the visual now.
const NODES = [
  { id: 'leads', label: 'Leads', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
  { id: 'pipeline', label: 'Pipeline', icon: 'M4 5h4v14H4V5zm6 4h4v10h-4V9zm6-4h4v14h-4V5z' },
  { id: 'tasks', label: 'Tasks', icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },
  { id: 'calendar', label: 'Calendar', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z' },
  { id: 'callday', label: 'Call Day', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 3v6l5 3 .99-1.73L13 11.4V7z' },
  { id: 'dialqueue', label: 'Dial Queue', icon: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' },
  { id: 'stack', label: 'Stack', icon: 'M12 16 4 10l1.63-1.27L12 13.47l6.37-4.74L20 10l-8 6zM12 3 1 9l11 6 11-6-11-6zM12 20.53 4 14.9l-1.63 1.27L12 23l9.63-6.82L20 14.9l-8 5.63z' },
  { id: 'offers', label: 'Offers', icon: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 12 7zm-1.6 4v6.4h1.8v-1.6h.5c1.77 0 3.1-1.15 3.1-2.9S14.47 10 12.7 10h-2.3zm1.8 1.5h.4c.85 0 1.4.5 1.4 1.4s-.55 1.4-1.4 1.4h-.4v-2.8z' },
]

const CX = 320
const CY = 240
const RADIUS = 178
const NODE_R = 34
const HUB_R = 52

export default function NodeNav({ onNavigate }) {
  const positions = NODES.map((n, i) => {
    const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2
    return { ...n, x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) }
  })

  return (
    <div className="card node-nav">
      <svg viewBox="0 0 640 480" className="node-nav-svg" role="img" aria-label="Navigation map: Home in the center, connected to Leads, Pipeline, Tasks, Calendar, Call Day, Dial Queue, Stack, and Offers">
        {positions.map(n => (
          <line key={n.id} x1={CX} y1={CY} x2={n.x} y2={n.y} className="nn-edge" />
        ))}

        <g className="nn-hub">
          <circle cx={CX} cy={CY} r={HUB_R} />
          <text x={CX} y={CY + 5} textAnchor="middle" className="nn-hub-label">HOME</text>
        </g>

        {positions.map(n => (
          <g
            key={n.id}
            className="nn-node"
            tabIndex={0}
            role="button"
            onClick={() => onNavigate(n.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(n.id) }}
          >
            <circle cx={n.x} cy={n.y} r={NODE_R} />
            <svg x={n.x - 10} y={n.y - 10} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="nn-node-icon">
              <path d={n.icon} />
            </svg>
            <text x={n.x} y={n.y + NODE_R + 16} textAnchor="middle" className="nn-node-label">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
