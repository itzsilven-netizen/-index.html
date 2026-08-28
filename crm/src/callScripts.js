// Deterministic, no-API-key call script generator — the phone-script sibling
// of emailDrafts.js. Every lead gets a script built from the same fixed
// opener (the 7-second trust bridge, identical on every call by design) plus
// a credibility/problem/solution section personalized from real fields on
// the lead (business_name, niche, city, pitch_angle, rating/review_count),
// then the same CTA, objection handling, and close used across every call.
//
// Kept deterministic (no randomization) unlike emailDrafts' spintax pools —
// a script is read live during a call, not sent as bulk copy, so there's no
// spam-signal reason to vary the wording, and a rep re-opening the same
// lead's script mid-call should see the exact same text they rehearsed with.

const CALLER_NAME = 'Silven'
const COMPANY_NAME = 'Casava'

const OPENER = (lead) =>
  `Hey ${lead.contact_name || 'there'}, it's ${CALLER_NAME} over at ${COMPANY_NAME}. I know I'm catching you out of the blue here, but was hoping to grab a quick half minute. I'll let you know why I called, and you can let me know if it's relevant or not.`

const nicheOrGeneric = (lead) => lead.niche || 'service-based businesses'

const credibilityLine = (lead) =>
  `Quick background on us — I run ${COMPANY_NAME}, we help optimize service-based industries like ${nicheOrGeneric(lead)} with AI receptionists, chatbots, and websites, so businesses stop losing customers to missed calls and slow response times.`

// Problem/solution/impact, keyed off the same pitch_angle field emailDrafts.js
// uses — so a lead's phone script and email pitch stay pointed at the same
// gap instead of contradicting each other.
const PITCH_ANGLE_CONTENT = {
  'AI Receptionist': {
    problem: (l) =>
      `What we're seeing with ${l.business_name} and businesses like it is that calls after hours or during busy periods either go to voicemail or just don't get picked up — and most owners never see that as a lost sale, it just shows up as silence.`,
    solution: () =>
      `So what we do is build a 24/7 AI receptionist that picks up instantly, answers the common questions, and books or routes the call — so nothing falls through the cracks.`,
    impact: 'missed-call recovery and after-hours coverage',
  },
  Website: {
    problem: (l) =>
      `Looked up ${l.business_name} and couldn't find a website — which usually means people searching "${nicheOrGeneric(l)}${l.city ? ' near ' + l.city : ''}" are probably ending up with a competitor instead.`,
    solution: () =>
      `So what we do is build a fast, mobile-ready site built to actually convert those searches into calls, not just sit there looking nice.`,
    impact: 'website lead capture',
  },
  'Website Chatbot': {
    problem: (l) =>
      `Took a look at ${l.business_name}'s site — there's no way for a visitor to get an answer right when they land on it, so if they don't call right away, they probably just leave.`,
    solution: () =>
      `So what we do is add a chatbot that answers instantly the moment someone lands on the site, so that visitor doesn't just bounce to a competitor.`,
    impact: 'website lead capture',
  },
  'Review Automation': {
    problem: (l) =>
      l.rating != null
        ? `${l.business_name} already has a solid ${l.rating}★ rating (${l.review_count || 0} reviews) — more of those would likely bring in more calls, without much extra work on your end.`
        : `${l.business_name} already has a good reputation, but without a steady flow of new reviews, that's harder for new customers to find.`,
    solution: () =>
      `So what we do is automate review requests after every job, so that reputation keeps growing without you having to chase it manually.`,
    impact: 'reputation and review growth',
  },
  'Lead Follow-Up AI': {
    problem: (l) =>
      `Most businesses like ${l.business_name} have old leads sitting untouched — a call that goes to voicemail while you're on a job usually just ends up with the next company that answers.`,
    solution: () =>
      `So what we do is put an AI follow-up system on those old leads, so they get worked automatically instead of going cold.`,
    impact: 'reviving old, unworked leads',
  },
}

const contentFor = (lead) => PITCH_ANGLE_CONTENT[lead.pitch_angle] || PITCH_ANGLE_CONTENT['AI Receptionist']

const CTA = (lead) =>
  `The reason I called is to offer a complimentary look at where ${lead.business_name} is likely leaking leads right now — or if you'd rather keep it high-level, I can just share a few things we're seeing work well for ${nicheOrGeneric(lead)} businesses. Would you be game to hop on a call tomorrow or the next day?`

const OBJECTIONS = [
  {
    q: "We're not interested / already have someone",
    a: 'Totally fair — most people say that until they see what\'s actually slipping through. Worth a quick look, no pressure either way?',
  },
  {
    q: 'Just send me some info',
    a: "I can, but honestly a 2-minute look does more than a PDF ever will. Can I just grab 15 minutes instead — I'll keep it fast and to the point.",
  },
  {
    q: 'How much does this cost?',
    a: "Depends what you actually need — that's exactly what the quick call is for, so I'm not just guessing at a number blind.",
  },
  {
    q: "I'm slammed / bad timing",
    a: "No problem — I can make it easy on you. I'll send a calendar invite so our schedules line up automatically. If something comes up, just propose a new time — no back-and-forth needed.",
  },
]

const CLOSE = (lead) =>
  `Perfect, I've got you down for [day/time]. I'll send a calendar invite to ${lead.phone ? 'this number' : 'your email'} — sound good?`

// Returns { opener, credibility, problem, solution, impact, cta, objections, close }
// — a plain object rather than one flattened string, so the drawer can render
// it as labeled blocks the same way the printed script/artifact does.
export const scriptForLead = (lead) => {
  const content = contentFor(lead)
  return {
    opener: OPENER(lead),
    credibility: credibilityLine(lead),
    problem: content.problem(lead),
    solution: content.solution(lead),
    impact: content.impact,
    cta: CTA(lead),
    objections: OBJECTIONS,
    close: CLOSE(lead),
  }
}

// Flattens scriptForLead's blocks into one plain-text script for the
// clipboard — same content, formatted to paste into notes or print.
export const scriptText = (lead) => {
  const s = scriptForLead(lead)
  const objections = s.objections.map(o => `Q: ${o.q}\nA: ${o.a}`).join('\n\n')
  return [
    `OPENER`,
    s.opener,
    ``,
    `CREDIBILITY`,
    s.credibility,
    ``,
    `PROBLEM`,
    s.problem,
    ``,
    `SOLUTION`,
    s.solution,
    ``,
    `CALL TO ACTION`,
    s.cta,
    ``,
    `OBJECTIONS`,
    objections,
    ``,
    `CLOSE`,
    s.close,
  ].join('\n')
}
