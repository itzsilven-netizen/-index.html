import './VisualPage.css'

// Static system map — no live data needed, just showing how the business fits
// together: who's involved, the signal path (scrape -> email -> call -> close),
// which CRM pages are modules of the same system, and where the ICP grows next.
const NODES = {
  kassava:    { x: 110,  y: 300, r: 42, label: 'Kassava',    sub: 'Closer' },
  casava:     { x: 320,  y: 300, r: 46, label: 'Casava',     sub: 'casava.app', accent: true },
  signal:     { x: 640,  y: 300, r: 64, label: 'SIGNAL',     sub: 'the system', hub: true },
  scrape:     { x: 900,  y: 130, r: 36, label: 'Scrape',     sub: 'leads' },
  email:      { x: 1050, y: 130, r: 36, label: 'Email',      sub: 'campaign' },
  call:       { x: 1200, y: 130, r: 36, label: 'Call',       sub: 'cold call' },
  close:      { x: 1200, y: 300, r: 42, label: 'Close',      sub: 'deal won', accent: true },
  leads:      { x: 420,  y: 540, r: 32, label: 'Leads',      sub: '' },
  pipeline:   { x: 560,  y: 570, r: 32, label: 'Pipeline',   sub: '' },
  tasks:      { x: 700,  y: 540, r: 32, label: 'Tasks',      sub: '' },
  calendar:   { x: 840,  y: 570, r: 32, label: 'Calendar',   sub: '' },
  callday:    { x: 980,  y: 540, r: 32, label: 'Call Day',   sub: '' },
  icp:        { x: 1200, y: 460, r: 44, label: 'ICP',        sub: 'HVAC · Electrical · Roofing · Plumbing' },
  realestate: { x: 1200, y: 610, r: 38, label: 'Real Estate', sub: 'later', ghost: true },
}

const FLOW_EDGES = [
  ['kassava', 'casava', '50%'],
  ['casava', 'signal', 'cold call channel'],
  ['signal', 'scrape', ''],
  ['scrape', 'email', ''],
  ['email', 'call', ''],
  ['call', 'close', ''],
  ['close', 'icp', ''],
]

const MODULE_EDGES = ['leads', 'pipeline', 'tasks', 'calendar', 'callday']

const GHOST_EDGES = [['icp', 'realestate']]

function Node({ id, x, y, r, label, sub, accent, hub, ghost }) {
  return (
    <g className={`vnode ${hub ? 'vnode-hub' : ''} ${accent ? 'vnode-accent' : ''} ${ghost ? 'vnode-ghost' : ''}`}>
      <circle cx={x} cy={y} r={r} />
      <text x={x} y={y - (sub ? 3 : -5)} textAnchor="middle" className="vnode-label">{label}</text>
      {sub && <text x={x} y={y + 15} textAnchor="middle" className="vnode-sub">{sub}</text>}
    </g>
  )
}

function edgePath(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len, uy = dy / len
  const x1 = a.x + ux * a.r, y1 = a.y + uy * a.r
  const x2 = b.x - ux * b.r, y2 = b.y - uy * b.r
  return { x1, y1, x2, y2 }
}

export default function VisualPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Visual</h1>
          <p className="page-subtitle">How the business actually fits together — one system, one signal path, one CRM underneath it.</p>
        </div>
      </div>

      <div className="card visual-card">
        <svg viewBox="0 0 1300 700" className="visual-svg" role="img" aria-label="Business system map: Kassava closes for Casava; Signal runs the scrape, email, call, close path; the CRM pages are modules of Signal; ICP is service trades now, real estate later.">
          {/* module spokes (drawn first, sit behind flow edges) */}
          {MODULE_EDGES.map(id => {
            const p = edgePath(NODES.signal, NODES[id])
            return <line key={id} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} className="vedge vedge-module" />
          })}

          {/* main flow */}
          {FLOW_EDGES.map(([a, b, label], i) => {
            const p = edgePath(NODES[a], NODES[b])
            const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2
            return (
              <g key={i}>
                <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} className="vedge vedge-flow" markerEnd="url(#arrow)" />
                {label && (
                  <text x={mx} y={my - 10} textAnchor="middle" className="vedge-label">{label}</text>
                )}
              </g>
            )
          })}

          {/* ghost / future edges */}
          {GHOST_EDGES.map(([a, b], i) => {
            const p = edgePath(NODES[a], NODES[b])
            return <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} className="vedge vedge-ghost" />
          })}

          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="varrow" />
            </marker>
          </defs>

          {Object.entries(NODES).map(([id, n]) => <Node key={id} id={id} {...n} />)}

          <text x={640} y={470} textAnchor="middle" className="vgroup-label">CRM MODULES — LIVE INSIDE SIGNAL</text>
        </svg>

        <div className="visual-legend">
          <span><i className="v-swatch v-swatch-flow" /> the signal path</span>
          <span><i className="v-swatch v-swatch-module" /> CRM module (same app)</span>
          <span><i className="v-swatch v-swatch-ghost" /> not built yet</span>
        </div>
      </div>
    </div>
  )
}
