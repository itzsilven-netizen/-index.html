// Deterministic, no-API-key draft generator. Every lead gets a personalized
// `notice` line built from real fields on it (website presence, rating,
// review_count — whatever its pitch_angle points at), then that notice gets
// arranged into one of 5 named cold-email structures below. Format is
// assigned per-lead by a stable rotation (lead.id % 5), not randomly on every
// open, so it's evenly split across the lead pool and reproducible — the
// point is to compare reply rates by FORMAT, with personalization held
// constant, not to re-roll the format every time someone reopens a lead.
//
// Every fixed (non-notice) sentence is spintax: composed from an opener + a
// closer, each picked from a pool of 5, giving 5x5 = 25 distinct wordings per
// sentence — so two leads sharing a pitch_angle + format don't get anywhere
// close to identical boilerplate text (mass-identical wording across many
// sends is itself a spam/bulk-sender signal). Composing from two independent
// 5-option pools instead of hand-writing 25 full sentences per slot keeps the
// copy quality consistent and the file maintainable. Each half is picked by
// hashing the lead's id + a per-sentence, per-half slot name, so it's stable
// per lead (same wording on reopen) and decorrelated from format selection
// and from every other sentence's picks.
//
// Copy is deliberately short-sentence, plain-word, ~5th-7th grade reading
// level — research on cold email response rates found copy at that level
// gets 53% more replies than denser writing. Keep edits at that same level.

// FNV-1a — a multiply-by-31 rolling hash mod'd straight down to 5 turned out
// badly distributed here (31 ≡ 1 mod 5, which collapses most of the position
// weighting and starves the variant pools of real variety). FNV-1a doesn't
// have that pathology.
const hashStr = (s) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Two independently-picked pools of 5 combined into one sentence — 25 total
// wordings from 10 short phrases instead of 25 full hand-written sentences.
const spinCombo = (lead, slot, openers, closers, join = ' ') => {
  const a = openers[hashStr(`${lead.id}:${slot}:A`) % openers.length](lead)
  const b = closers[hashStr(`${lead.id}:${slot}:B`) % closers.length](lead)
  return `${a}${join}${b}`
}

// A single stable 5-way pick, for the cases (like the PAS disclaimer below)
// that don't need spinCombo's opener+closer composition.
const pickOne = (lead, slot, pool) => pool[hashStr(`${lead.id}:${slot}`) % pool.length](lead)

const NOTICE_POOLS = {
  website: {
    openers: [
      (l) => `Noticed ${l.business_name} doesn't have a website yet.`,
      (l) => `Looked up ${l.business_name} and didn't find a website.`,
      (l) => `Couldn't find a website for ${l.business_name}.`,
      (l) => `${l.business_name} doesn't seem to have a website yet.`,
      (l) => `Checked around for ${l.business_name}'s website and didn't find one.`,
    ],
    closers: [
      (l) => `That usually means people searching "${l.niche} near ${l.city}" end up calling someone else instead.`,
      (l) => `That usually means people searching "${l.niche} near ${l.city}" probably end up at a competitor instead.`,
      (l) => `That usually means folks searching "${l.niche} near ${l.city}" call someone else first.`,
      (l) => `People searching "${l.niche} near ${l.city}" likely go with a competitor instead.`,
      (l) => `That means a lot of people searching "${l.niche} near ${l.city}" end up going elsewhere.`,
    ],
  },
  websiteChatbot: {
    openers: [
      (l) => `Checked out ${l.business_name}'s site.`,
      (l) => `Took a look at ${l.business_name}'s website.`,
      (l) => `Checked ${l.business_name}'s site out.`,
      (l) => `Visited ${l.business_name}'s website.`,
      (l) => `Had a look at ${l.business_name}'s site.`,
    ],
    closers: [
      () => `There's no way to get an answer right when someone lands on it. If they don't call right away, they probably just leave.`,
      () => `No way for a visitor to get an answer right away — if they don't call right off, they probably leave.`,
      () => `Nobody can get an answer the moment they land on it, so if they don't call right then, they likely just move on.`,
      () => `There's nothing there to answer a question on the spot, so visitors who don't call right away probably leave.`,
      () => `A visitor can't get an answer right when they land on it, so if they don't call fast, they probably move on.`,
    ],
  },
  reviewsWithRating: {
    openers: [
      (l) => `${l.business_name} already has a solid ${l.rating}★ rating (${l.review_count} reviews).`,
      (l) => `${l.business_name}'s already got a solid ${l.rating}★ rating (${l.review_count} reviews).`,
      (l) => `Noticed ${l.business_name} has a strong ${l.rating}★ rating (${l.review_count} reviews).`,
      (l) => `${l.business_name} is sitting at a solid ${l.rating}★ (${l.review_count} reviews).`,
      (l) => `${l.business_name} already has a strong ${l.rating}★ rating from ${l.review_count} reviews.`,
    ],
    closers: [
      () => `More reviews would likely bring in more calls, without much extra work on your end.`,
      () => `More reviews would likely mean more calls, without much extra work.`,
      () => `A few more reviews would likely bring in more calls, without much extra effort.`,
      () => `More of those would likely mean more calls coming in, without much extra work.`,
      () => `Getting more reviews would likely mean more calls, without much extra effort on your part.`,
    ],
  },
  reviewsNoRating: {
    openers: [
      (l) => `${l.business_name} already has a solid reputation.`,
      (l) => `${l.business_name} already has a good reputation.`,
      (l) => `Noticed ${l.business_name} already has a solid reputation.`,
      (l) => `${l.business_name}'s already built up a solid reputation.`,
      (l) => `${l.business_name} already has a strong reputation around town.`,
    ],
    closers: [
      () => `More reviews would likely bring in more calls, without much extra effort.`,
      () => `A few more reviews would likely bring in more calls, without much extra work.`,
      () => `More reviews would likely mean more calls, without much extra effort.`,
      () => `Getting a few more reviews would likely bring in more calls, without much extra work.`,
      () => `More reviews would probably mean more calls coming in, without much extra effort.`,
    ],
  },
  leadFollowUp: {
    openers: [
      () => `Most shops`,
      () => `A lot of shops`,
      () => `Most businesses like yours`,
      () => `A lot of businesses like yours`,
      () => `Plenty of shops`,
    ],
    closers: [
      () => `have a stack of old estimates and inquiries nobody followed back up on.`,
      () => `end up with a pile of old estimates and inquiries nobody ever followed up on.`,
      () => `have old estimates and inquiries sitting around that nobody followed back up on.`,
      () => `have a stack of old leads nobody circled back to.`,
      () => `have old estimates and inquiries that nobody ever followed up on.`,
    ],
  },
  aiReceptionistWithRating: {
    openers: [
      (l) => `Noticed you already have a solid reputation (${l.rating}★, ${l.review_count} reviews).`,
      (l) => `Noticed ${l.business_name} already has a solid reputation (${l.rating}★, ${l.review_count} reviews).`,
      (l) => `You've already got a strong reputation (${l.rating}★, ${l.review_count} reviews).`,
      (l) => `${l.business_name} already has a strong reputation (${l.rating}★, ${l.review_count} reviews).`,
      (l) => `Noticed you've built up a solid reputation already (${l.rating}★, ${l.review_count} reviews).`,
    ],
    closers: [
      () => `It'd be a shame to lose a good lead to a missed call.`,
      () => `Would be a shame to lose a good lead over a missed call.`,
      () => `Hate to see a good lead slip away over a missed call.`,
      () => `Be a shame for a good lead to slip away over a missed call.`,
      () => `Would hate for a good lead to be lost to a missed call.`,
    ],
  },
  aiReceptionistNoRating: {
    openers: [
      () => `One thing I've noticed with shops like yours:`,
      () => `Something I see a lot with shops like yours:`,
      () => `One thing I've noticed with businesses like yours:`,
      () => `Here's something common with shops like yours:`,
      () => `One pattern I see a lot with shops like yours:`,
    ],
    closers: [
      () => `calls that go to voicemail while you're on a job usually just go to the next guy who answers.`,
      () => `calls that hit voicemail while you're on a job usually just go to whoever answers next.`,
      () => `a call that goes to voicemail while you're working usually just goes to the next company that picks up.`,
      () => `calls going to voicemail while you're on a job usually just end up with the next company that answers.`,
      () => `a missed call while you're on the job usually just goes to whoever picks up next.`,
    ],
  },
}

const buildNotice = (lead) => {
  const hasReputation = lead.rating != null && lead.review_count != null
  let pool
  switch (lead.pitch_angle) {
    case 'Website': pool = NOTICE_POOLS.website; break
    case 'Website Chatbot': pool = NOTICE_POOLS.websiteChatbot; break
    case 'Review Automation': pool = hasReputation ? NOTICE_POOLS.reviewsWithRating : NOTICE_POOLS.reviewsNoRating; break
    case 'Lead Follow-Up AI': pool = NOTICE_POOLS.leadFollowUp; break
    case 'AI Receptionist':
    default: pool = hasReputation ? NOTICE_POOLS.aiReceptionistWithRating : NOTICE_POOLS.aiReceptionistNoRating
  }
  return spinCombo(lead, 'notice', pool.openers, pool.closers)
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

const CREDIBILITY_OPENERS = [
  () => `I run Casava`,
  () => `I run a company called Casava`,
  () => `My company is Casava`,
  () => `I started Casava`,
  () => `I'm the founder of Casava`,
]
const CREDIBILITY_CLOSERS = [
  (l) => `we help local ${l.niche} businesses fix stuff like this.`,
  (l) => `we work with local ${l.niche} businesses on stuff like this.`,
  (l) => `we help local ${l.niche} businesses with exactly this kind of thing.`,
  (l) => `we fix stuff like this for local ${l.niche} businesses.`,
  (l) => `we help ${l.niche} businesses in your area fix stuff like this.`,
]
const credibilityLine = (l) => spinCombo(l, 'credibility', CREDIBILITY_OPENERS, CREDIBILITY_CLOSERS, ' — ')

// The ask across 4 of the 5 formats: offer something no-cost instead of
// asking for a call. Cleverly's research found low-friction offers (audits,
// benchmarks) outperform demo/call requests, and Tomba found "should I send
// you a document?" beats "give me 30 minutes" on replies — same idea. Says
// "no charge," never the literal word "free": that word is flagged by name
// in multiple sources as a spam-filter trigger, and "no charge" conveys the
// identical thing without it.
//
// What's on offer is picked per pitch_angle, same as the notice above — a
// generic "breakdown" read as templated once someone had seen more than one
// of these, and a specific offer that matches the actual thing flagged in
// the notice ("no site" -> a mockup, "so-so reviews" -> reply templates)
// reads like it was actually written for them.
//
// Website/Chatbot/Reviews are things that can actually be put together
// without the lead's input, so those stay a "send it over" async offer.
// Lead Follow-Up and AI Receptionist can't — there's no way to know how
// many of their old leads are worth chasing or what their missed calls are
// costing without asking them, so those two are a call ask instead of a
// document promise; each gets its own closer to match ("grab 10 minutes"
// rather than "send it over").
const SEND_OFFER_CLOSERS = [
  () => `No charge — want me to send it over?`,
  () => `No charge. Want me to send it your way?`,
  () => `Won't cost you anything — want it?`,
  () => `No charge at all — want me to send it over?`,
  () => `No charge. Want it?`,
]
const CALL_OFFER_CLOSERS = [
  () => `No charge — want to grab 10 minutes and go through it?`,
  () => `No charge. Want to grab 10 minutes together?`,
  () => `Won't cost you anything — want to grab 10 minutes?`,
  () => `No charge at all — want to grab 10 minutes and go through it?`,
  () => `No charge. Want to grab 10 minutes?`,
]
const OFFER_POOLS = {
  website: {
    openers: [
      (l) => `I can put together a quick mockup of what a site could look like for ${l.business_name}.`,
      () => `I can pull together a quick mockup of what your site could look like.`,
      () => `Happy to put together a quick mockup of what a site could look like for you.`,
      () => `I can send over a rough mockup of what your site could look like.`,
      () => `I can pull together a quick sample of what a site could look like for you.`,
    ],
    closers: SEND_OFFER_CLOSERS,
  },
  websiteChatbot: {
    openers: [
      () => `I can put together a quick sample of what instant replies could look like on your site.`,
      () => `I can send over a quick sample of what automatic replies could look like on your site.`,
      () => `I can put together a sample of how instant replies could work on your site.`,
      () => `I can pull together a quick sample of automatic replies for your site.`,
      () => `Happy to put together a sample of what instant replies could look like on your site.`,
    ],
    closers: SEND_OFFER_CLOSERS,
  },
  reviews: {
    openers: [
      () => `I can put together a few reply templates you could use on your reviews.`,
      () => `I can pull together a few reply templates for your reviews.`,
      () => `Happy to put together a few reply templates you could use on your reviews.`,
      () => `I can send over a few reply templates for your reviews.`,
      () => `I can draft up a few reply templates you could use on your reviews.`,
    ],
    closers: SEND_OFFER_CLOSERS,
  },
  leadFollowUp: {
    openers: [
      () => `I can hop on a quick call and take a look at how many of those old leads might still be worth a callback.`,
      () => `Happy to hop on a quick call and go through how many of those old leads might still be worth a callback.`,
      () => `I can jump on a quick call and take a look at how many old leads might still be worth chasing.`,
      () => `I can hop on a call and take a look at how many of those old leads might still be worth a callback.`,
      () => `Happy to jump on a quick call and take a look at how many old leads might still be worth a callback.`,
    ],
    closers: CALL_OFFER_CLOSERS,
  },
  aiReceptionist: {
    openers: [
      () => `I can hop on a quick call and walk through what missed calls might be costing you.`,
      () => `Happy to hop on a quick call and walk through what missed calls might be costing you.`,
      () => `I can jump on a quick call and take a look at what missed calls might be costing you.`,
      () => `I can hop on a call and walk through what this might be costing you.`,
      () => `Happy to jump on a quick call and walk through what missed calls could be costing you.`,
    ],
    closers: CALL_OFFER_CLOSERS,
  },
}
const pickOfferPool = (lead) => {
  switch (lead.pitch_angle) {
    case 'Website': return OFFER_POOLS.website
    case 'Website Chatbot': return OFFER_POOLS.websiteChatbot
    case 'Review Automation': return OFFER_POOLS.reviews
    case 'Lead Follow-Up AI': return OFFER_POOLS.leadFollowUp
    case 'AI Receptionist':
    default: return OFFER_POOLS.aiReceptionist
  }
}
const sendOffer = (l) => {
  const pool = pickOfferPool(l)
  return spinCombo(l, 'sendOffer', pool.openers, pool.closers)
}

const PAS_PROBLEM_OPENERS = [
  () => `Hey — I run Casava.`,
  () => `Hey — I run a company called Casava.`,
  () => `Hey — my company is Casava.`,
  () => `Hi — I run Casava.`,
  () => `Hey there — I run Casava.`,
]
const PAS_PROBLEM_CLOSERS = [
  (l) => `A lot of ${l.niche} businesses lose jobs to stuff like this without noticing.`,
  (l) => `A lot of ${l.niche} businesses lose jobs to stuff like this and never notice.`,
  (l) => `A lot of ${l.niche} businesses are losing jobs to stuff like this without realizing it.`,
  (l) => `Plenty of ${l.niche} businesses lose jobs to stuff like this without noticing.`,
  (l) => `A lot of ${l.niche} businesses lose work to stuff like this and don't even notice.`,
]

// The Solve sentence composes this disclaimer with the same per-pitch-angle
// sendOffer() every other format uses, instead of hand-writing its own
// "breakdown" text — one offer pool to keep on-message, not two.
const PAS_SOLVE_DISCLAIMER = [
  () => `I'm not pitching anything yet —`,
  () => `Not pitching anything yet —`,
  () => `I'm not selling anything here —`,
  () => `Nothing to pitch yet —`,
  () => `I'm not trying to sell you anything yet —`,
]

const BAB_AFTER_OPENERS = [
  () => `Shops that fix this`,
  () => `Businesses that fix this`,
  () => `Shops that get this fixed`,
  () => `Companies that fix this`,
  () => `Shops that take care of this`,
]
const BAB_AFTER_CLOSERS = [
  () => `usually pick up more jobs without much extra work.`,
  () => `usually end up picking up more jobs, without much extra work.`,
  () => `usually see more jobs come in, without doing much extra.`,
  () => `usually pick up more jobs, without a lot of extra work.`,
  () => `usually end up with more jobs, without much extra effort.`,
]

const STORY_HOOK_OPENERS = [
  () => `Hey`,
  () => `Hey there`,
  () => `Hi`,
  () => `Hi there`,
  () => `Hello`,
]
const STORY_HOOK_CLOSERS = [
  (l) => `quick one about ${l.business_name}.`,
  (l) => `quick note about ${l.business_name}.`,
  (l) => `got a quick one about ${l.business_name}.`,
  (l) => `quick thing about ${l.business_name}.`,
  (l) => `a quick one about ${l.business_name}.`,
]

const DIRECT_OFFER_OPENERS = [
  () => `Hey`,
  () => `Hi`,
  () => `Hey there`,
  () => `Hi there`,
  () => `Hello`,
]
const DIRECT_OFFER_CLOSERS = [
  (l) => `if we could connect ${l.business_name} with more ${l.niche} customers in the next couple weeks, would that be worth a quick conversation?`,
  (l) => `if we could get ${l.business_name} more ${l.niche} customers in the next couple weeks, would that be worth a quick conversation?`,
  (l) => `if we could connect you with more ${l.niche} customers over the next couple weeks, would that be worth talking about?`,
  (l) => `if we could bring ${l.business_name} more ${l.niche} customers in the next couple weeks, would that be worth a quick chat?`,
  (l) => `if we could help ${l.business_name} land more ${l.niche} customers in the next couple weeks, would that be worth a quick conversation?`,
]

const OPT_OUT_OPENERS = [
  () => `If you'd rather not hear from us again,`,
  () => `If you'd rather not hear from us,`,
  () => `If you're not interested in hearing from us again,`,
  () => `If you'd rather we didn't email you again,`,
  () => `If you'd prefer not to hear from us again,`,
]
const OPT_OUT_CLOSERS = [
  () => `just reply and say so — we'll take you off the list.`,
  () => `just reply and let us know — we'll take you off the list.`,
  () => `just reply and say so, and we'll take you off the list.`,
  () => `just reply and let me know — I'll take you off the list.`,
  () => `just reply and say so — we'll take you off the list right away.`,
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
      { label: 'Problem', text: spinCombo(l, 'pasProblem', PAS_PROBLEM_OPENERS, PAS_PROBLEM_CLOSERS) },
      { label: 'Agitate', text: notice },
      { label: 'Solve', text: `${pickOne(l, 'pasSolveDisclaimer', PAS_SOLVE_DISCLAIMER)} ${sendOffer(l)}` },
    ],
  },
  {
    id: 'bab',
    name: 'BAB',
    structure: 'Before → After → Bridge',
    wordRange: '100-140 words',
    build: (l, notice) => [
      { label: 'Before', text: notice },
      { label: 'After', text: spinCombo(l, 'babAfter', BAB_AFTER_OPENERS, BAB_AFTER_CLOSERS) },
      { label: 'Bridge', text: `${credibilityLine(l)} ${sendOffer(l)}` },
    ],
  },
  {
    id: 'story',
    name: 'Story',
    structure: 'Hook → Pain Point → Credibility → CTA',
    wordRange: '60-90 words',
    build: (l, notice) => [
      { label: 'Hook', text: spinCombo(l, 'storyHook', STORY_HOOK_OPENERS, STORY_HOOK_CLOSERS, ' — ') },
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
      { label: 'Direct Offer', text: spinCombo(l, 'directOffer', DIRECT_OFFER_OPENERS, DIRECT_OFFER_CLOSERS, ' — ') },
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
  const optOut = spinCombo(lead, 'optOut', OPT_OUT_OPENERS, OPT_OUT_CLOSERS)
  const body = `${sentences.map(s => s.text).join('\n\n')}\n\n${optOut}`
  const draft = `Subject: ${subject}\n\n${body}`
  return { draft, sentences, format }
}
