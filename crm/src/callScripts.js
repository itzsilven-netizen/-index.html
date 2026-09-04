// Deterministic, no-API-key call script generator — the phone-script sibling
// of emailDrafts.js. Every lead gets a script built from the same fixed
// opener (the 7-second trust bridge, identical on every call by design),
// then credibility + a leading question + their problem, then whichever of
// the 3 offers matches the lead's pitch_angle (leading question, solution,
// a free live demo, and a CTA), objections, and the close.
//
// Kept deterministic (no randomization) unlike emailDrafts' spintax pools —
// a script is read live during a call, not sent as bulk copy, so there's no
// spam-signal reason to vary the wording, and a rep re-opening the same
// lead's script mid-call should see the exact same text they rehearsed with.

const CALLER_NAME = 'Silven'
const COMPANY_NAME = 'Casava'

// "Still to Fill In" from the script doc — a real proof point (client
// count, result, or credential) for the credibility line. One line to
// update here once you have one; every call picks it up automatically.
const PROOF_POINT = null // e.g. "12 local businesses" or "$40K in recovered bookings"

const OPENER = (lead) =>
  `Hey ${lead.contact_name || 'there'}, it's ${CALLER_NAME} over at ${COMPANY_NAME}. I know I'm catching you out of the blue here, but was hoping to grab a quick half minute. I'll let you know why I called, and you can let me know if it's relevant or not.`

const nicheOrGeneric = (lead) => lead.niche || 'service-based businesses'

const credibilityLine = (lead) =>
  `Quick background — I run ${COMPANY_NAME}${PROOF_POINT ? ` (${PROOF_POINT})` : ''}. We fix this exact thing for service-based businesses in ${nicheOrGeneric(lead)}: missed calls, cold website traffic, and thin review counts, all quietly costing you customers.`

const LEADING_Q =
  "Let me ask you something — when a call comes in after you're closed, or someone lands on your site with a question, or a happy customer walks out without leaving a review... what actually happens?"

const problemAck = (lead) =>
  `Yeah — that's the exact same blind spot we see across ${nicheOrGeneric(lead)}. It happens constantly, and most owners don't realize how much it's costing them until they actually see it.`

// Problem/solution/impact, keyed off the same pitch_angle field emailDrafts.js
// uses — so a lead's phone script and email pitch stay pointed at the same
// gap instead of contradicting each other. The 3 primary offers (matching
// the current script doc) also carry leadingQ/freeDemo/offerCta for the
// fuller call flow; the rest keep the legacy problem/solution/impact shape.
const PITCH_ANGLE_CONTENT = {
  'AI Receptionist': {
    leadingQ: "Right now, if a call comes in while you're on the other line, or after you've closed for the day — where does it go?",
    problem: (l) =>
      `What we're seeing with ${l.business_name} and businesses like it is that calls after hours or during busy periods either go to voicemail or just don't get picked up — and most owners never see that as a lost sale, it just shows up as silence.`,
    solution: () =>
      `So what we do is build a 24/7 AI receptionist that picks up instantly, answers the common questions, and books or routes the call — so nothing falls through the cracks.`,
    freeDemo: 'Easiest way to show you — I can literally call your business right now, live, on this call, and let you hear exactly what the AI receptionist sounds like answering. Takes two minutes, no charge.',
    offerCta: 'Want me to run that demo right now, or would you rather I show you on a quick call tomorrow?',
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
    leadingQ: 'When someone lands on your website with a question right now — do they actually get an answer, or do they just leave?',
    problem: (l) =>
      `Took a look at ${l.business_name}'s site — there's no way for a visitor to get an answer right when they land on it, so if they don't call right away, they probably just leave.`,
    solution: () =>
      `So what we do is add a chatbot to your site that answers the second someone lands on it — so a visitor who wouldn't have called doesn't just bounce to a competitor.`,
    freeDemo: "I can pull up a live version of the chatbot right now and show you exactly how it'd respond to your own visitors — no charge, right here on the call.",
    offerCta: 'Want to see that now, or should I walk you through it on a quick call tomorrow?',
    impact: 'website lead capture',
  },
  'Review Automation': {
    leadingQ: "Out of everyone you've done a good job for this month — how many do you think actually went and left you a review without being asked?",
    problem: (l) =>
      l.rating != null
        ? `${l.business_name} already has a solid ${l.rating}★ rating (${l.review_count || 0} reviews) — more of those would likely bring in more calls, without much extra work on your end.`
        : `${l.business_name} already has a good reputation, but without a steady flow of new reviews, that's harder for new customers to find.`,
    solution: () =>
      `So what we do is automate review requests after every job, so that rating keeps climbing without you having to chase it manually.`,
    freeDemo: "I can show you the exact text a customer would get right after a job — takes thirty seconds, no charge, and you'll see exactly how it reads.",
    offerCta: 'Want me to show you that now, or should I just send over a set of reply templates for your current reviews — no charge either way?',
    offerCtaNote: 'Easiest "yes" of the three — closes as a no-meeting deliverable, good fallback when someone\'s hesitant about booking.',
    impact: 'reputation and review growth',
  },
  'Lead Follow-Up AI': {
    problem: (l) =>
      `Most businesses like ${l.business_name} have old leads sitting untouched — a call that goes to voicemail while you're on a job usually just ends up with the next company that answers.`,
    solution: () =>
      `So what we do is put an AI follow-up system on those old leads, so they get worked automatically instead of going cold.`,
    impact: 'reviving old, unworked leads',
  },
  'AI SMS Sales Chat': {
    problem: (l) =>
      `Most businesses like ${l.business_name} get texts from customers that sit unanswered for hours — and a text that doesn't get a fast reply usually just goes to whoever answers first.`,
    solution: () =>
      `So what we do is put an AI sales chat on your texts, so inbound messages get answered, qualified, and booked instantly instead of sitting in the inbox.`,
    impact: 'text-based lead conversion',
  },
  'Appointment Reminders': {
    problem: (l) =>
      `A lot of businesses like ${l.business_name} lose real revenue to no-shows and late cancellations that a simple reminder would've caught.`,
    solution: () =>
      `So what we do is automate appointment reminders by text and call, so no-shows drop without anyone having to manually chase people down.`,
    impact: 'cutting no-shows and late cancellations',
  },
}

const contentFor = (lead) => PITCH_ANGLE_CONTENT[lead.pitch_angle] || PITCH_ANGLE_CONTENT['AI Receptionist']

// Generic CTA — used only when a pitch angle has no offerCta of its own
// (the 4 legacy angles outside the 3 primary offers).
const CTA = (lead) =>
  `The reason I called is to offer a complimentary look at where ${lead.business_name} is likely leaking leads right now — or if you'd rather keep it high-level, I can just share a few things we're seeing work well for ${nicheOrGeneric(lead)} businesses. Would you be game to hop on a call tomorrow or the next day?`

const OBJECTIONS = [
  {
    q: "We're not interested / already have someone",
    a: "Fair enough — most people say that right up until they see what's actually slipping through. Let's just look — two minutes, right now.",
  },
  {
    q: 'Just send me some info',
    a: "I can, but a two-minute look beats a PDF every time. Give me fifteen minutes instead — I'll keep it fast.",
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

// Voicemail / pattern-interrupt drop — for voicemail, or when the standard
// opener gets brushed off fast. Specific and personalized enough to trigger
// curiosity instead of a sales-defense reflex.
const voicemailLine = (lead) =>
  `Hey ${lead.business_name}, I'm calling about ${lead.pitch_angle ? contentFor(lead).impact : 'something specific I noticed'}. Give me a call back.`

// Returns { opener, credibility, leadingQ, problemAck, problem, solution,
// freeDemo, cta, offerCtaNote, objections, close, voicemail } — a plain
// object rather than one flattened string, so the drawer can render it as
// labeled blocks the same way the printed script/artifact does.
export const scriptForLead = (lead) => {
  const content = contentFor(lead)
  return {
    opener: OPENER(lead),
    credibility: credibilityLine(lead),
    leadingQ: content.leadingQ || LEADING_Q,
    problemAck: content.leadingQ ? null : problemAck(lead),
    problem: content.problem(lead),
    solution: content.solution(lead),
    freeDemo: content.freeDemo || null,
    cta: content.offerCta || CTA(lead),
    offerCtaNote: content.offerCtaNote || null,
    objections: OBJECTIONS,
    close: CLOSE(lead),
    voicemail: voicemailLine(lead),
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
    `LEADING QUESTION`,
    s.leadingQ,
    ...(s.problemAck ? ['', 'PROBLEM ACK', s.problemAck] : []),
    ``,
    `PROBLEM`,
    s.problem,
    ``,
    `SOLUTION`,
    s.solution,
    ...(s.freeDemo ? ['', 'FREE DEMO', s.freeDemo] : []),
    ``,
    `CALL TO ACTION`,
    s.cta,
    ``,
    `OBJECTIONS`,
    objections,
    ``,
    `CLOSE`,
    s.close,
    ``,
    `VOICEMAIL / PATTERN-INTERRUPT`,
    s.voicemail,
  ].join('\n')
}
