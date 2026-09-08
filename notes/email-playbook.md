# Email Playbook — Cold Outreach Craft Rules

*Source: distilled from an Alex Hormozi email-marketing framework (2026-09-05),
filtered for cold 1:1 outreach to strangers. His framework is written for a
newsletter/subscriber list — about half of it doesn't apply here and is noted
below so it doesn't get re-added by mistake later.*

## Rules adopted into the Outreach and Follow-up agents

1. **Plain text over HTML.** No heavy formatting, no images, minimal links
   (one — the Calendly link). Looks like a personal email, not a campaign;
   better deliverability and reads as more credible to a business owner.
2. **Under ~150 words, one concept.** One problem, one mechanism, one CTA.
   Already the house rule — this just confirms it and tightens the target
   down from 200.
3. **PS line.** Add a one-line PS after the signature block on cold emails.
   It's disproportionately read. Use it for the actual ask ("PS — even a
   quick reply telling me it's not a fit helps") rather than a second pitch.
4. **Reward-first opening.** Don't warm up for two sentences before the
   point. Open on the actual problem/observation in sentence one.
5. **Subject line sells curiosity, not content.** Short, lowercase-casual,
   makes the reader want to open — not a mini-preview of the whole email.
6. **Mobile-first.** Short lines, no wide layouts — already true of plain
   text, worth stating so it's never violated by a "nicer-looking" template.
7. **Reply-to-engage close.** Where it fits naturally, invite a low-effort
   reply ("reply 'not now' and I'll leave it") instead of only a booking
   link — a reply signals engagement and keeps the thread alive even on a no.

## Explicitly NOT adopted (these are for an opted-in list, not cold outreach)

- **List segmentation** — no subscriber list exists; the equivalent here is
  already handled by tailoring per trade (HVAC vs. pool service vs. roofing).
- **A/B testing subject lines across a % of a list** — needs list volume we
  don't have. The real equivalent: track reply rate by angle/agent in the
  Agent OS Numbers view once real sending volume exists.
- **Batching a year of content in advance** — that's a newsletter calendar.
  Cold outreach is lead-driven (send when there's a new lead), not
  calendar-driven.
- **Google Drive links for deliverability** — irrelevant and would look odd
  in a first-contact cold email; not used.
- **Consistent recurring format subscribers "expect"** — doesn't apply,
  there's no ongoing subscriber relationship in cold outreach.

## Source 2 — cold email agency operator (YouTube, 2026-09-07)

Different source from the Hormozi one above — a real cold-email-agency
operator describing tactics from their own agency, not a newsletter
framework. Worth distinguishing on its own merits rather than lumping in
with the recycled source, and this one's actually a mix of adoptable now
vs. only relevant once there's a first client.

### Adopted into Lead Research and Outreach

- **Case-study/named-client opener.** "Saw you did X for Y — want to
  connect you with more of that" beats a generic pain-point opener because
  it's specific and verifiable, not a guess. Lead Research now flags this
  explicitly as "Case study angle:" when the input actually contains a
  named client/project/review; Outreach leads with it when present. Same
  guardrail as everything else here — never invent one that isn't real.

### Not adopted yet — needs a first client to exist first, not rejected

- **Lookalike-company scraping off a successful client's domain.** A real
  scaling tactic once there's a client getting results to scrape lookalikes
  from. Revisit after the first close, not before.
- **Pre-call warm-up page** (testimonials, case studies, FAQ videos before
  the booked call). Needs testimonials and case studies to exist. Building
  this now would mean faking the proof it depends on.

### Flagged as a real option, not silently adopted — it's a pricing decision

- **60-day trial/pilot offer** (pay-per-meeting or upfront fee, prospect's
  choice) instead of a straight retainer pitch. Directly addresses
  risk-aversion objections ("not sure this'll work for us"). This changes
  the actual offer/pricing, not just the copy — Kassava's call whether this
  fits what Casava allows him to offer, not something to bake into the
  agents unilaterally. See `pricing.md` if this gets decided on.

### Already built, this just confirmed the instinct was right

- CRM/pipeline stage tracking — this is exactly what the Signal integration
  already does.

### Shelved, not urgent yet

- Slack alerts for fast-replying to interested leads. Real tactic at reply
  volume; not the bottleneck at current send volume.

## Source 3 — enterprise-scale outbound operator (YouTube, 2026-09-08)

Third distinct source — an enterprise/agency-scale outbound operation
(25-50 mailbox infra, LinkedIn signal-based sourcing via Triggery/Clay,
SDR-managed responses). Most of it is genuinely built for a bigger
operation and a different ICP than this one; one piece is adopted.

### Adopted

- **Tone calibrated to a traditional-industry ICP, not startup-casual.**
  The source's own framing — formal/longer copy works better for
  traditional industries (insurance, legal, accounting), short/casual
  works for SaaS/startups — maps directly onto Kassava's ICP. HVAC,
  roofing, plumbing, electrical and pool service owners sit in the
  traditional bucket, not the startup one. Outreach's tone rule updated:
  professional and direct, no slang or forced casualness, no exclamation
  points.

### Converges with source 2, still a pricing decision not a copy fix

- **14-day pilot** here vs. the 60-day pilot in source 2 — two
  independent operators landing on the same underlying fix (de-risk the
  ask instead of pitching a straight retainer) is real signal. Still
  Kassava's call against what Casava allows him to offer, not something
  baked into the agents.

### Not adopted — built for a different scale, not wrong, just premature

- **25-50 mailboxes on one domain, Google/Microsoft split, "Hyperdrive."**
  Enterprise-tier sending infra. Revisit once actually volume-constrained
  by 3 mailboxes, not before.
- **Triple-verify + strip Mimecast-filtered domains.** Needs domain
  intelligence tooling that doesn't exist here yet; MillionVerifier
  already covers the actual bad-address risk at this scale.

### Not adopted — ICP mismatch, not a scale issue

- **LinkedIn engagement-based lead sourcing (Triggery/Clay) and the
  LinkedIn→email multi-channel pivot.** This targets people who are
  active and reachable on LinkedIn — SaaS founders, consultants. HVAC/
  roofing/plumbing/pool service owners overwhelmingly aren't. Signal's
  trade+location scrape is the right lead source for this ICP; this is a
  different tool built for a different buyer, not a better version of
  the same thing.

### No change needed, already true

- SDR/human review of responses over full automation — Kassava already
  manually handles every reply himself.
- Optimize for positive reply rate, not raw volume — already the
  Numbers view's framing (reply rate, not counts).

## Source 4 — "39 lessons from 1M+ cold emails" (YouTube, 2026-09-08)

Fourth distinct source, and the most consequential change yet — a real
structural conflict with what was already built, resolved with Kassava's
explicit decision rather than silently overridden.

### The structural change — Kassava's call, not mine

- **No link of any kind (Calendly, PDF, video) anywhere in the cold
  sequence** — opener or any follow-up, before a reply exists. The
  source is specific: an unearned link in an unanswered cold email is a
  spam-filter trigger. This directly conflicted with the standing
  signature block, which put the Calendly link in every cold email.
  **Kassava chose to change it.** The cold sequence's only CTA is now a
  reply; the Calendly link is sent only once a prospect has actually
  replied with real interest — Outreach Agent now has an explicit
  exception path for exactly that case, and that reply is the one place
  in the whole flow the link belongs.

### Adopted

- **Sequence capped at 4 emails total** (opener + up to 3 follow-ups)
  inside a 7-10 day window — down from the previous "steps 2-5" (up to
  6 total). Follow-up Agent updated.
- **Tighter length: ~100 words**, down from 150 — this source's number,
  and consistent with the direction every prior source pointed.
- **Explicit permission to skip a forced personalization.** If there's
  no genuine verified angle, a direct pain-point opener is fine —
  don't manufacture a weak one just to have one.
- **"Spin tax."** Vary greeting/sentence structure across different
  leads rather than converging on one repeated template — sends that
  look identical to each other are exactly what spam filters
  pattern-match on.
- **Expanded banned words:** "free trial", "guarantee"/"guaranteed",
  specific dollar-amount claims — on top of the existing hype-phrase list.
- **Trigger events, translated to this ICP.** The source's "recent
  funding/awards" signal doesn't exist for local trade businesses — the
  real equivalent is a new review, a second location, a hiring post.
  Lead Research now surfaces this as "Timing signal:" alongside the
  existing case-study angle, same verified-only guardrail.

### Not adopted — no tooling/bandwidth, not wrong

- **The 12-step multi-channel follow-up process** (email + SMS +
  LinkedIn + Instagram) for leads showing positive intent, sent as a
  follow-up to this same source. Real principle, no automation platform
  for LinkedIn/IG exists here, and Kassava is at 4 hrs/day pre-first-client
  — building a 12-step cross-platform system now is the wrong use of
  that time. The actual actionable core of it — fast, personal follow-up
  once someone shows real interest, still speaking to outcomes not
  deliverables — is already what Objection Agent and the SMS-for-
  engaged-leads rule do. Revisit the full multi-channel build once
  reply volume is actually the bottleneck.
- **Case studies/proof in the email itself.** Same reason as every prior
  source — zero closed clients, nothing real to cite yet.
- **Reusing an opened-but-no-reply list with a new angle later.** Real
  tactic, but it's a list-management workflow feature, not a prompt
  change — worth building into the Leads view once there's real
  send/open volume to actually recycle.

## Still true from the existing rules (unchanged)

- Never invent a specific about the prospect's business.
- Exactly one CTA, one time commitment.
- No hype language ("5X more leads", "game-changer", etc).
- Standard signature block (Casava systems partner line, Calendly, opt-out,
  PO Box address) on every cold email.
