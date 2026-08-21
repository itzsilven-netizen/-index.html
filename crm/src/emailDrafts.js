// Deterministic, no-API-key draft generator. Picks one of 5 angles based on the
// lead's pitch_angle (already assigned by the lead-gen routine) and personalizes
// the opening line from real fields on the lead (website presence, rating,
// review_count) instead of a flat mail-merge. Runs entirely client-side.
//
// Copy is deliberately short-sentence, plain-word, ~5th-7th grade reading level —
// research on cold email response rates found copy at that level gets 53% more
// replies than denser writing. Keep edits to this file at that same level: short
// sentences, common words, no subordinate clauses.

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
// "introducing" measurably hurt opens.
const TEMPLATES = {
  'AI Receptionist': {
    subject: () => `quick question`,
    body: (l, notice) => `Hey — I run Casava. We help ${l.niche} companies in ${l.city} stop losing jobs to small stuff that adds up. ${notice} I'm not selling anything yet. I just want to hop on a quick call and see if this is even worth fixing for you. You free this week?`,
  },
  Website: {
    subject: () => `your website`,
    body: (l, notice) => `Hey — Casava here. We help local ${l.niche} businesses fix the stuff that's costing them calls. ${notice} This might not even matter, depending on how you get most of your work. I didn't want to assume. Got 10 minutes this week?`,
  },
  'Website Chatbot': {
    subject: () => `your website visitors`,
    body: (l, notice) => `Hey — I run Casava. We look at how local service businesses lose leads without knowing it. ${notice} This might be nothing for you. Or it could be a few jobs a month. Want to hop on a quick call and find out?`,
  },
  'Review Automation': {
    subject: () => `your reviews`,
    body: (l, notice) => `Hey — Casava here. ${notice} Not sure if that's a priority for you right now. I wanted to ask before pitching anything. Open to a quick call?`,
  },
  'Lead Follow-Up AI': {
    subject: () => `your old leads`,
    body: (l, notice) => `Hey — I run Casava. We help ${l.niche} businesses in ${l.city} plug the gaps where jobs slip through. ${notice} This might be nothing for you. But it's worth a quick call to check if it's costing you money before I say more.`,
  },
}

const OPT_OUT_LINE = "If you'd rather not hear from us again, just reply and say so — we'll take you off the list."

export const generateEmailDraft = (lead) => {
  const template = TEMPLATES[lead.pitch_angle] || TEMPLATES['AI Receptionist']
  const notice = buildNotice(lead)
  const subject = template.subject(lead)
  const body = `${template.body(lead, notice)}\n\n${OPT_OUT_LINE}`
  return `Subject: ${subject}\n\n${body}`
}
