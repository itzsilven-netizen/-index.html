import './OffersPage.css'

// What Casava (casava.app) actually sells — pulled from their own site, not
// guessed. This is call-reference material: which offer fits which ICP, and
// the specific problem it closes, so it's usable mid-call, not just on file.
const OFFERS = [
  {
    name: 'AI Agents',
    tagline: 'Autonomous agents that handle calls, bookings, lead qualification, and customer inquiries 24/7',
    variants: [
      { name: 'AI Receptionist', desc: 'Answers every inbound call, books/reschedules, routes what it can\'t handle' },
      { name: 'AI Chatbot', desc: 'Website/Instagram/Facebook chat — answers questions, captures the lead' },
      { name: 'SMS Agent', desc: 'Texts back missed calls and web leads, qualifies them by text' },
      { name: 'Outbound / Mass Agent', desc: 'Calls or texts a whole list — reminders, re-engagement, follow-up at volume' },
    ],
    icp: ['HVAC', 'Electrical', 'Plumbing', 'Salons / spas', 'Medical / dental', 'Restaurants', 'Gyms', 'Law firms'],
    problems: [
      'Missed calls — no one picks up during rush or after hours',
      'Unqualified leads eating up staff time',
      'No coverage nights/weekends when bookings actually happen',
    ],
    why: 'These businesses live or die on the phone, and a front desk can\'t cover every ring during rush, after hours, or on a day off. HVAC especially — a no-heat call at 9pm goes to whoever picks up first. Every missed call is a booking that calls the next name on Google instead.',
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
    examples: [
      'A new lead in the booking form auto-creates a CRM record and texts the customer a confirmation — no one retypes it',
      'A job marked "complete" auto-triggers the invoice and a review-request text',
      'Calendar bookings auto-sync to the tech\'s phone and the office schedule at the same time',
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
    examples: [
      'One clean page: what they do, service area, reviews, a click-to-call and a booking form above the fold',
      'Mobile-first — most of these searches happen on a phone standing in a driveway or bathroom',
      'Real photos and real reviews instead of stock art, so it reads as a real local business, not a template',
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
    examples: [
      'A handful of ad variations (different hooks/creative) running at once, cutting whatever underperforms',
      'Targeting narrowed to the actual service area and household income band that can afford the service',
      'Ad leads straight into the AI Agent/chatbot for instant follow-up — not a form that sits for a day',
    ],
    why: 'A good offer with no consistent lead flow stalls out on referrals alone. Most owners running their own ads are guessing at targeting and never testing creative — money spent without a system behind it.',
    pricing: '$697/mo',
    fit: 'ROI-service',
  },
  {
    name: 'Full AI + Web Package',
    tagline: 'The bundle — every piece above, combined into one build',
    icp: ['A business that needs both a real site and call/booking coverage'],
    problems: [
      'No credible site AND missed calls — fixing one alone leaves the other bleeding leads',
      'Buyer wants one deal, one vendor, instead of stitching services together',
    ],
    examples: [
      'Site + AI Agent + the automation connecting them, sold and built as one system instead of three separate deals',
      'Room for custom automation on top — whatever this specific business\'s workflow actually needs, not just the standard package',
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

            {o.variants && (
              <div className="offer-section">
                <span className="offer-section-label">Types of agent</span>
                <ul className="offer-variants">
                  {o.variants.map(v => (
                    <li key={v.name}><b>{v.name}</b> — {v.desc}</li>
                  ))}
                </ul>
              </div>
            )}

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

            {o.examples && (
              <div className="offer-section">
                <span className="offer-section-label">What it actually looks like</span>
                <ul className="offer-problems">
                  {o.examples.map(e => <li key={e}>{e}</li>)}
                </ul>
              </div>
            )}

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
