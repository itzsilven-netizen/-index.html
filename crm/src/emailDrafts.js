// Deterministic, no-API-key draft generator. Picks one of 5 angles based on the
// lead's pitch_angle (already assigned by the lead-gen routine) and personalizes
// the opening line from real fields on the lead (website presence, rating,
// review_count) instead of a flat mail-merge. Runs entirely client-side.

const buildNotice = (lead) => {
  const { business_name, niche, city, rating, review_count } = lead
  const hasReputation = rating != null && review_count != null

  switch (lead.pitch_angle) {
    case 'Website':
      return `Noticed ${business_name} doesn't have a website up yet, which usually means people searching "${niche} near ${city}" end up at a competitor instead.`

    case 'Website Chatbot':
      return `Checked out ${business_name}'s site — no way for someone to get an answer right when they land on it, so if they don't call immediately they probably just leave.`

    case 'Review Automation':
      return hasReputation
        ? `${business_name}'s already sitting at a solid ${rating}★ rating (${review_count} reviews), which usually means more reviews would move the needle on new calls without you doing much extra.`
        : `${business_name} already has a solid reputation, which usually means more reviews would move the needle on new calls without much extra effort.`

    case 'Lead Follow-Up AI':
      return `Most shops have a stack of old estimates/inquiries nobody followed back up on.`

    case 'AI Receptionist':
    default:
      return hasReputation
        ? `Noticed you've already got a solid reputation (${rating}★, ${review_count} reviews) — hate for a good lead to slip through on a missed call.`
        : `One thing I noticed with shops like yours: calls that hit voicemail while you're on-site usually just go to the next guy who answers.`
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
    body: (l, notice) => `Hey — I run Casava, we work with ${l.niche} companies in ${l.city} on tightening up stuff that's quietly costing them jobs. ${notice} Not pitching anything specific yet — just want to hop on a quick call and see if it's even worth solving for you. You open this week?`,
  },
  Website: {
    subject: () => `your website`,
    body: (l, notice) => `Hey — Casava here, we help local ${l.niche} businesses fix the stuff that's costing them calls. ${notice} Might not even be worth fixing depending on how you get most of your work — figured I'd ask before assuming. Got 10 minutes this week?`,
  },
  'Website Chatbot': {
    subject: () => `your website visitors`,
    body: (l, notice) => `Hey — I run Casava, we look at how local service businesses are leaking leads without realizing it. ${notice} Could be a non-issue for you, could be a few jobs a month. Want to jump on a quick call and figure out which?`,
  },
  'Review Automation': {
    subject: () => `your reviews`,
    body: (l, notice) => `Hey — Casava here. ${notice} Not sure if that's actually a priority for you right now — wanted to ask before pitching anything. Open to a quick call?`,
  },
  'Lead Follow-Up AI': {
    subject: () => `your old leads`,
    body: (l, notice) => `Hey — I run Casava, we help ${l.niche} businesses in ${l.city} plug the gaps where jobs quietly slip through. ${notice} Might be nothing for you — figured it's worth a quick call to see if that's actually costing you money before I say more.`,
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
