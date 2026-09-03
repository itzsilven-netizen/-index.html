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
    why: 'These businesses live or die on the phone, and a front desk can\'t cover every ring during rush, after hours, or on a day off. Every missed call is a booking that calls the next name on Google instead.',
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
    why: 'Once a business runs on more than a couple of tools, someone\'s job quietly becomes re-typing the same information into each one. That\'s paid time spent on zero new revenue — the exact hours this pitch is about buying back.',
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
    why: 'A prospect Googles the business before they ever call. An outdated or missing site loses that prospect in the first three seconds, before the phone even rings — no amount of ad spend or referrals fixes that first impression.',
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
    why: 'A good offer with no consistent lead flow stalls out on referrals alone. Most owners running their own ads are guessing at targeting and never testing creative — money spent without a system behind it.',
    pricing: '$697/mo',
    fit: 'ROI-service',
  },
  {
    name: 'Full AI + Web Package',
    tagline: 'The bundle — AI Agents plus a Web Design build, sold together',
    icp: ['A business that needs both a real site and call/booking coverage'],
    problems: [
      'No credible site AND missed calls — fixing one alone leaves the other bleeding leads',
      'Buyer wants one deal, one vendor, instead of stitching services together',
    ],
    why: 'Fixing only the site or only the phones leaves the other leak wide open — a beautiful site behind a phone nobody answers, or a sharp AI agent booking calls off a page that loses trust in three seconds. This closes both leaks in one deal.',
    pricing: null,
    fit: 'bundle',
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
              {o.fit === 'bundle' && <span className="offer-fit-tag offer-fit-bundle">Bundle</span>}
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

            <div className="offer-section">
              <span className="offer-section-label">Why they need it</span>
              <p className="offer-why">{o.why}</p>
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
