// Deterministic, no-API-key draft generator. Every lead gets a personalized
// `notice` line built from real fields on it (website presence, rating,
// review_count — whatever its pitch_angle points at), then that notice gets
// arranged into one of 5 named cold-email structures below. Format is
// assigned per-lead by a stable rotation (lead.id % 5), not randomly on every
// open, so it's evenly split across the lead pool and reproducible — the
// point is to compare reply rates by FORMAT, with personalization held
// constant, not to re-roll the format every time someone reopens a lead.
//
// Every fixed (non-notice) sentence also has 3-5 spintax-style wording
// variants, so two leads sharing the same pitch_angle + format don't get
// byte-identical boilerplate text — mass-identical wording across many sends
// is itself a spam/bulk-sender signal. Variant choice is a hash of the
// lead's id + a per-sentence slot name, so it's stable per lead (same
// wording on reopen) but decorrelated from format selection and from other
// sentences' picks.
//
// Copy is deliberately short-sentence, plain-word, ~5th-7th grade reading
// level — research on cold email response rates found copy at that level
// gets 53% more replies than denser writing. Keep edits at that same level.

const hashStr = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// variants: array of (lead) => string. Picks one deterministically per
// lead+slot so the same lead always sees the same wording once generated.
const spin = (lead, slot, variants) => variants[hashStr(`${lead.id}:${slot}`) % variants.length](lead)

const NOTICE_VARIANTS = {
  website: [
    (l) => `Noticed ${l.business_name} doesn't have a website yet. That usually means people searching "${l.niche} near ${l.city}" end up calling someone else instead.`,
    (l) => `Looked up ${l.business_name} and didn't find a website. People searching "${l.niche} near ${l.city}" probably end up at a competitor instead.`,
    (l) => `Couldn't find a website for ${l.business_name}. That usually means people searching "${l.niche} near ${l.city}" call someone else first.`,
    (l) => `${l.business_name} doesn't seem to have a website yet. People searching "${l.niche} near ${l.city}" likely go with a competitor instead.`,
  ],
  websiteChatbot: [
    (l) => `Checked out ${l.business_name}'s site. There's no way to get an answer right when someone lands on it. If they don't call right away, they probably just leave.`,
    (l) => `Took a look at ${l.business_name}'s website. No way for a visitor to get an answer right away — if they don't call right off, they probably leave.`,
    (l) => `Checked ${l.business_name}'s site out. Nobody can get an answer the moment they land on it, so if they don't call right then, they likely just move on.`,
    (l) => `Visited ${l.business_name}'s website. There's nothing there to answer a question on the spot, so visitors who don't call right away probably leave.`,
  ],
  reviewsWithRating: [
    (l) => `${l.business_name} already has a solid ${l.rating}★ rating (${l.review_count} reviews). More reviews would likely bring in more calls, without much extra work on your end.`,
    (l) => `${l.business_name}'s already got a solid ${l.rating}★ rating (${l.review_count} reviews). More reviews would likely mean more calls, without much extra work.`,
    (l) => `Noticed ${l.business_name} has a strong ${l.rating}★ rating (${l.review_count} reviews). A few more reviews would likely bring in more calls, without much extra effort.`,
    (l) => `${l.business_name} is sitting at a solid ${l.rating}★ (${l.review_count} reviews). More of those would likely mean more calls, without much extra work.`,
  ],
  reviewsNoRating: [
    (l) => `${l.business_name} already has a solid reputation. More reviews would likely bring in more calls, without much extra effort.`,
    (l) => `${l.business_name} already has a good reputation. A few more reviews would likely bring in more calls, without much extra work.`,
    (l) => `Noticed ${l.business_name} already has a solid reputation. More reviews would likely mean more calls, without much extra effort.`,
  ],
  leadFollowUp: [
    () => `Most shops have a stack of old estimates and inquiries nobody followed back up on.`,
    () => `Most shops end up with a pile of old estimates and inquiries nobody ever followed up on.`,
    () => `A lot of shops have old estimates and inquiries sitting around that nobody followed back up on.`,
    () => `Most businesses like yours have a stack of old leads nobody circled back to.`,
  ],
  aiReceptionistWithRating: [
    (l) => `Noticed you already have a solid reputation (${l.rating}★, ${l.review_count} reviews). It'd be a shame to lose a good lead to a missed call.`,
    (l) => `Noticed ${l.business_name} already has a solid reputation (${l.rating}★, ${l.review_count} reviews). Would be a shame to lose a good lead over a missed call.`,
    (l) => `You've already got a strong reputation (${l.rating}★, ${l.review_count} reviews). Hate to see a good lead slip away over a missed call.`,
  ],
  aiReceptionistNoRating: [
    () => `One thing I've noticed with shops like yours: calls that go to voicemail while you're on a job usually just go to the next guy who answers.`,
    () => `Something I see a lot with shops like yours: calls that hit voicemail while you're on a job usually just go to whoever answers next.`,
    () => `One thing I've noticed with businesses like yours: a call that goes to voicemail while you're working usually just goes to the next company that picks up.`,
  ],
}

const buildNotice = (lead) => {
  const hasReputation = lead.rating != null && lead.review_count != null

  switch (lead.pitch_angle) {
    case 'Website':
      return spin(lead, 'notice', NOTICE_VARIANTS.website)
    case 'Website Chatbot':
      return spin(lead, 'notice', NOTICE_VARIANTS.websiteChatbot)
    case 'Review Automation':
      return spin(lead, 'notice', hasReputation ? NOTICE_VARIANTS.reviewsWithRating : NOTICE_VARIANTS.reviewsNoRating)
    case 'Lead Follow-Up AI':
      return spin(lead, 'notice', NOTICE_VARIANTS.leadFollowUp)
    case 'AI Receptionist':
    default:
      return spin(lead, 'notice', hasReputation ? NOTICE_VARIANTS.aiReceptionistWithRating : NOTICE_VARIANTS.aiReceptionistNoRating)
  }
}

// Subject lines kept to 2-4 lowercase, colleague-style words — research on cold
// email opens (Gong's 85M-email analysis) found short, low-key subjects that
// reference the prospect's own situation outperform longer or marketing-toned
// ones by a wide margin, and phrases like "partnership," "exclusive," or
// "introducing" measurably hurt opens. Subject varies by pitch_angle only —
// format (below) is a separate, independently-tested variable, so mixing the
// two together would make it impossible to tell which one moved the numbers.
const SUBJECTS = {
  'AI Receptionist': 'quick question',
  Website: 'your website',
  'Website Chatbot': 'your website visitors',
  'Review Automation': 'your reviews',
  'Lead Follow-Up AI': 'your old leads',
}

const CREDIBILITY_VARIANTS = [
  (l) => `I run Casava — we help local ${l.niche} businesses fix stuff like this.`,
  (l) => `I run Casava. We work with local ${l.niche} businesses on stuff like this.`,
  (l) => `I run a company called Casava — we help local ${l.niche} businesses with exactly this kind of thing.`,
  (l) => `My company, Casava, helps local ${l.niche} businesses fix stuff like this.`,
]
const credibilityLine = (l) => spin(l, 'credibility', CREDIBILITY_VARIANTS)

// The ask across 4 of the 5 formats: offer a no-cost breakdown instead of
// asking for a call. Cleverly's research found low-friction offers (audits,
// benchmarks) outperform demo/call requests, and Tomba found "should I send
// you a document?" beats "give me 30 minutes" on replies — same idea. Says
// "no charge," never the literal word "free": that word is flagged by name
// in multiple sources as a spam-filter trigger, and "no charge" conveys the
// identical thing without it.
const SEND_OFFER_VARIANTS = [
  () => `Want me to send over a quick breakdown of what this could be costing you? No charge.`,
  () => `Want me to put together a quick breakdown of what this could be costing you? No charge.`,
  () => `I can send over a quick breakdown of what this might be costing you, no charge. Want me to?`,
  () => `Happy to send a quick breakdown of what this could be costing you, no charge — want me to?`,
]
const sendOffer = (l) => spin(l, 'sendOffer', SEND_OFFER_VARIANTS)

const PAS_PROBLEM_VARIANTS = [
  (l) => `Hey — I run Casava. A lot of ${l.niche} businesses lose jobs to stuff like this without noticing.`,
  (l) => `Hey — I run Casava. A lot of ${l.niche} businesses lose jobs to stuff like this and never notice.`,
  (l) => `Hey — I run a company called Casava. A lot of ${l.niche} businesses are losing jobs to stuff like this without realizing it.`,
]

const PAS_SOLVE_VARIANTS = [
  (l) => `I'm not pitching anything yet — I put together a quick breakdown of what this could be costing ${l.business_name}. Want me to send it over? No charge.`,
  (l) => `Not pitching anything yet — I put together a quick breakdown of what this could be costing ${l.business_name}. Want it sent over? No charge.`,
  (l) => `I'm not selling anything here — just put together a quick breakdown of what this might be costing ${l.business_name}. Want me to send it? No charge.`,
]

const BAB_AFTER_VARIANTS = [
  () => `Shops that fix this usually pick up more jobs without much extra work.`,
  () => `Businesses that fix this usually end up picking up more jobs, without much extra work.`,
  () => `Shops that get this fixed usually see more jobs come in, without doing much extra.`,
]

const STORY_HOOK_VARIANTS = [
  (l) => `Hey — quick one about ${l.business_name}.`,
  (l) => `Hey — quick note about ${l.business_name}.`,
  (l) => `Hey — got a quick one about ${l.business_name}.`,
  (l) => `Hi — quick thing about ${l.business_name}.`,
]

const DIRECT_OFFER_VARIANTS = [
  (l) => `Hey — if we could connect ${l.business_name} with more ${l.niche} customers in the next couple weeks, would that be worth a quick conversation?`,
  (l) => `Hey — if we could get ${l.business_name} more ${l.niche} customers in the next couple weeks, would that be worth a quick conversation?`,
  (l) => `Hi — if we could connect you with more ${l.niche} customers over the next couple weeks, would that be worth talking about?`,
]

const OPT_OUT_VARIANTS = [
  () => `If you'd rather not hear from us again, just reply and say so — we'll take you off the list.`,
  () => `If you'd rather not hear from us again, just reply and let us know — we'll take you off the list.`,
  () => `Not interested in hearing from us again? Just reply and say so, and we'll take you off the list.`,
]

// 5 named structures pulled from the cold-email copywriting research (plus
// one direct-offer format from outside advice). Each `build` returns the
// email as labeled sentences/beats, so the role of every line is explicit
// rather than implied. `sentences` is for display only (e.g. showing the
// structure in the UI) — the actual draft is always sent as plain text.
export const FORMATS = [
  {
    id: 'three_sentence',
    name: '3-Sentence',
    structure: 'Observation → Credibility → Ask',
    wordRange: '45-75 words',
    build: (l, notice) => [
      { label: 'Observation', text: notice },
      { label: 'Credibility', text: credibilityLine(l) },
      { label: 'Ask', text: sendOffer(l) },
    ],
  },
  {
    id: 'pas',
    name: 'PAS',
    structure: 'Problem → Agitate → Solve',
    wordRange: '90-120 words',
    build: (l, notice) => [
      { label: 'Problem', text: spin(l, 'pasProblem', PAS_PROBLEM_VARIANTS) },
      { label: 'Agitate', text: notice },
      { label: 'Solve', text: spin(l, 'pasSolve', PAS_SOLVE_VARIANTS) },
    ],
  },
  {
    id: 'bab',
    name: 'BAB',
    structure: 'Before → After → Bridge',
    wordRange: '100-140 words',
    build: (l, notice) => [
      { label: 'Before', text: notice },
      { label: 'After', text: spin(l, 'babAfter', BAB_AFTER_VARIANTS) },
      { label: 'Bridge', text: `${credibilityLine(l)} ${sendOffer(l)}` },
    ],
  },
  {
    id: 'story',
    name: 'Story',
    structure: 'Hook → Pain Point → Credibility → CTA',
    wordRange: '60-90 words',
    build: (l, notice) => [
      { label: 'Hook', text: spin(l, 'storyHook', STORY_HOOK_VARIANTS) },
      { label: 'Pain Point', text: notice },
      { label: 'Credibility', text: credibilityLine(l) },
      { label: 'CTA', text: sendOffer(l) },
    ],
  },
  {
    // Single-sentence direct offer — if we could connect you with more
    // customers in the next couple weeks, worth a conversation? No
    // observation/notice at all, deliberately as short as this gets.
    id: 'direct_offer',
    name: 'Direct Offer',
    structure: 'Direct Offer (single sentence)',
    wordRange: '20-30 words',
    build: (l) => [
      { label: 'Direct Offer', text: spin(l, 'directOffer', DIRECT_OFFER_VARIANTS) },
    ],
  },
]

const pickFormat = (lead) => FORMATS[Math.abs(Number(lead.id) || 0) % FORMATS.length]

// Returns { draft, sentences, format } — draft is the plain-text email ready
// to send, sentences is the labeled breakdown (Hook/Pain Point/CTA/etc.) for
// display, format is which of the 5 structures this lead was assigned.
export const generateEmailDraft = (lead) => {
  const format = pickFormat(lead)
  const notice = buildNotice(lead)
  const subject = SUBJECTS[lead.pitch_angle] || SUBJECTS['AI Receptionist']
  const sentences = format.build(lead, notice)
  const optOut = spin(lead, 'optOut', OPT_OUT_VARIANTS)
  const body = `${sentences.map(s => s.text).join('\n\n')}\n\n${optOut}`
  const draft = `Subject: ${subject}\n\n${body}`
  return { draft, sentences, format }
}
