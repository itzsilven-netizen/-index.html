import './OffersPage.css'

// What Casava (casava.app) actually sells — pulled from their own site, not
// guessed. This is call-reference material: which offer fits which ICP, and
// the specific problem it closes, so it's usable mid-call, not just on file.
const OFFERS = [
  {
    name: 'AI Agents',
    tagline: 'Autonomous agents that handle calls, bookings, lead qualification, and customer inquiries 24/7',
    icp: ['Salons / spas', 'Medical / dental', 'Restaurants', 'Gyms', 'Law firms'],
    problems: [
      'Missed calls — no one picks up during rush or after hours',
      'Unqualified leads eating up staff time',
      'No coverage nights/weekends when bookings actually happen',
    ],
    pricing: null,
    fit: 'ROI-service',
  },
  {
    name: 'Workflow Automation',
    tagline: 'Custom pipelines connecting business tools, syncing data, eliminating manual processes',
    icp: ['Contractors', 'Real estate', 'Retail', 'Any business running on 3+ disconnected tools'],
    problems: [
      'Manual data entry between systems',
      'Data silos — nothing talks to anything else',
      'Operational drag from repetitive manual work',
    ],
    pricing: null,
    fit: 'ROI-service',
  },
  {
    name: 'Web Design',
    tagline: 'Fast, conversion-focused websites — built to earn trust on the first scroll',
    icp: ['Any business without a credible web presence'],
    problems: [
      'Poor or outdated online presence',
      'Low conversion on existing site',
      'Lack of professional credibility at first click',
    ],
    pricing: '$97/mo — hosting, SSL, domain, 5 monthly updates',
    fit: 'default push',
  },
  {
    name: 'Facebook Ads Management',
    tagline: 'Done-for-you campaigns with creative testing and audience targeting',
    icp: ['Any business with a real offer but no reliable inbound'],
    problems: [
      'Low customer acquisition',
      'Ad spend going nowhere without testing/targeting',
    ],
    pricing: '$697/mo',
    fit: 'ROI-service',
  },
]

export default function OffersPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Offers</h1>
          <p className="page-subtitle">What Casava actually sells — by ICP and the problem each one closes. Reference this on the call.</p>
        </div>
      </div>

      <div className="offers-grid">
        {OFFERS.map(o => (
          <div className="card offer-card" key={o.name}>
            <div className="offer-head">
              <h3>{o.name}</h3>
              {o.fit === 'ROI-service' && <span className="offer-fit-tag">Lead with this</span>}
            </div>
            <p className="offer-tagline">{o.tagline}</p>

            <div className="offer-section">
              <span className="offer-section-label">Best ICP</span>
              <div className="offer-chips">
                {o.icp.map(i => <span className="offer-chip" key={i}>{i}</span>)}
              </div>
            </div>

            <div className="offer-section">
              <span className="offer-section-label">Problems it solves</span>
              <ul className="offer-problems">
                {o.problems.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>

            {o.pricing && (
              <div className="offer-pricing">{o.pricing}</div>
            )}
          </div>
        ))}
      </div>

      <div className="card offer-note">
        <p><b>Working rule:</b> lead with AI Agents, Workflow Automation, or Facebook Ads — the ROI-driven services — over Web Design, which is Casava's default push. A closed ROI service beats a website sale for both the client's results and the case study it builds.</p>
      </div>
    </div>
  )
}
