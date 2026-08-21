// Deterministic, no-API-key draft generator. Every lead gets a personalized
// `notice` line built from real fields on it (website presence, rating,
// review_count — whatever its pitch_angle points at), then that notice gets
// arranged into one of 4 named cold-email structures below. Format is
// assigned per-lead by a stable rotation (lead.id % 4), not randomly on every
// open, so it's evenly split across the lead pool and reproducible — the
// point is to compare reply rates by FORMAT, with personalization held
// constant, not to re-roll the format every time someone reopens a lead.
//
// Copy is deliberately short-sentence, plain-word, ~5th-7th grade reading
// level — research on cold email response rates found copy at that level
// gets 53% more replies than denser writing. Keep edits at that same level.

const buildNotice = (lead) => {
  const { business_name, niche, city, rating, review_count } = lead
  const hasReputation = rating != null && review_count != null

  switch (lead.pitch_angle) {
    case 'Website':
      return `Noticed ${business_name} doesn't have a website yet. That usually means people searching "${niche} near ${city}" end up calling someone else instead.`

    case 'Website Chatbot':
      return `Checked out ${business_name}'s site. There's no way to get an answer right when someone lands on it. If they don't call right away, they probably just leave.`

    case 'Review Automation':
      return hasReputation
        ? `${business_name} already has a solid ${rating}★ rating (${review_count} reviews). More reviews would likely bring in more calls, without much extra work on your end.`
        : `${business_name} already has a solid reputation. More reviews would likely bring in more calls, without much extra effort.`

    case 'Lead Follow-Up AI':
      return `Most shops have a stack of old estimates and inquiries nobody followed back up on.`

    case 'AI Receptionist':
    default:
      return hasReputation
        ? `Noticed you already have a solid reputation (${rating}★, ${review_count} reviews). It'd be a shame to lose a good lead to a missed call.`
        : `One thing I've noticed with shops like yours: calls that go to voicemail while you're on a job usually just go to the next guy who answers.`
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

const credibilityLine = (l) => `I run Casava — we help local ${l.niche} businesses fix stuff like this.`

// 4 named structures pulled from the cold-email copywriting research. Each
// `build` returns the email as labeled sentences/beats, so the role of every
// line is explicit rather than implied. `sentences` is for display only
// (e.g. showing the structure in the UI) — the actual draft is always sent
// as plain text.
export const FORMATS = [
  {
    id: 'three_sentence',
    name: '3-Sentence',
    structure: 'Observation → Credibility → Ask',
    wordRange: '45-75 words',
    build: (l, notice) => [
      { label: 'Observation', text: notice },
      { label: 'Credibility', text: credibilityLine(l) },
      { label: 'Ask', text: `Worth a quick call to see if it's costing you anything?` },
    ],
  },
  {
    id: 'pas',
    name: 'PAS',
    structure: 'Problem → Agitate → Solve',
    wordRange: '90-120 words',
    build: (l, notice) => [
      { label: 'Problem', text: `Hey — I run Casava. A lot of ${l.niche} businesses lose jobs to stuff like this without noticing.` },
      { label: 'Agitate', text: notice },
      { label: 'Solve', text: `I'm not pitching anything specific yet. I just want to hop on a quick call and see if it's worth fixing for ${l.business_name}. You free this week?` },
    ],
  },
  {
    id: 'bab',
    name: 'BAB',
    structure: 'Before → After → Bridge',
    wordRange: '100-140 words',
    build: (l, notice) => [
      { label: 'Before', text: notice },
      { label: 'After', text: `Shops that fix this usually pick up more jobs without much extra work.` },
      { label: 'Bridge', text: `${credibilityLine(l)} Not pitching anything specific yet. Just want to see if it's worth a quick call.` },
    ],
  },
  {
    id: 'story',
    name: 'Story',
    structure: 'Hook → Pain Point → Credibility → CTA',
    wordRange: '60-90 words',
    build: (l, notice) => [
      { label: 'Hook', text: `Hey — quick one about ${l.business_name}.` },
      { label: 'Pain Point', text: notice },
      { label: 'Credibility', text: credibilityLine(l) },
      { label: 'CTA', text: `Want to jump on a quick call and see if it's worth fixing?` },
    ],
  },
]

const pickFormat = (lead) => FORMATS[Math.abs(Number(lead.id) || 0) % FORMATS.length]

const OPT_OUT_LINE = "If you'd rather not hear from us again, just reply and say so — we'll take you off the list."

// Returns { draft, sentences, format } — draft is the plain-text email ready
// to send, sentences is the labeled breakdown (Hook/Pain Point/CTA/etc.) for
// display, format is which of the 4 structures this lead was assigned.
export const generateEmailDraft = (lead) => {
  const format = pickFormat(lead)
  const notice = buildNotice(lead)
  const subject = SUBJECTS[lead.pitch_angle] || SUBJECTS['AI Receptionist']
  const sentences = format.build(lead, notice)
  const body = `${sentences.map(s => s.text).join(' ')}\n\n${OPT_OUT_LINE}`
  const draft = `Subject: ${subject}\n\n${body}`
  return { draft, sentences, format }
}
