import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { generateEmailDraft } from './src/emailDrafts.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const dedupeKey = (lead) =>
  lead.phone || lead.email || `${lead.business_name}|${lead.website || ''}`

// Same generator the UI uses for a manual per-lead send, so a batch push and
// a solo "Send Email" click read identically to a recipient.
const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID
const INSTANTLY_LEADS_URL = 'https://api.instantly.ai/api/v2/leads'
const COMPANY_MAILING_ADDRESS =
  process.env.COMPANY_MAILING_ADDRESS || 'Apex Standard, PO Box 1093, Willow Creek, CA 95573'

// CAN-SPAM requires a physical mailing address in every commercial email —
// mirrors the same appendMailingAddress used for the manual-send path in
// src/store.js, so batch sends carry it too.
const appendMailingAddress = (draft) => {
  if (!COMPANY_MAILING_ADDRESS || draft.includes(COMPANY_MAILING_ADDRESS)) return draft
  return `${draft.trim()}\n\n${COMPANY_MAILING_ADDRESS}`
}

// generateEmailDraft() returns "Subject: ...\n\n<body>" — split it so the
// subject lands in Instantly's own subject merge-variable instead of the body.
const splitDraftSubject = (draft) => {
  const match = draft.match(/^subject:\s*(.+)\n+([\s\S]*)$/i)
  return match ? { subject: match[1].trim(), body: match[2].trim() } : { subject: '', body: draft }
}

// GET /api/leads - Fetch all leads, grouped by type
app.get('/api/leads', async (req, res) => {
  try {
    const { data, error } = await supabase.from('leads').select('*')
    if (error) throw error

    const calls = data.filter(row => row.type === 'calls').map(row => ({ id: row.id, ...row.data }))
    const emails = data.filter(row => row.type === 'emails').map(row => ({ id: row.id, ...row.data }))

    res.json({ calls, emails })
  } catch (err) {
    console.error('Error fetching leads:', err.message)
    res.status(500).json({ error: 'Failed to fetch leads' })
  }
})

// POST /api/import-leads - Import leads from routine (deduped server-side)
app.post('/api/import-leads', async (req, res) => {
  const { type, leads } = req.body

  if (!type || !Array.isArray(leads)) {
    return res.status(400).json({ error: 'Invalid request. Need "type" (calls/emails) and "leads" array.' })
  }
  if (type !== 'calls' && type !== 'emails') {
    return res.status(400).json({ error: 'Type must be "calls" or "emails"' })
  }

  try {
    const rows = leads.map(lead => ({
      type,
      dedupe_key: dedupeKey(lead),
      data: {
        ...lead,
        status: lead.status || 'new',
        importedAt: new Date().toISOString(),
      },
    }))

    const { data, error } = await supabase
      .from('leads')
      .upsert(rows, { onConflict: 'type,dedupe_key', ignoreDuplicates: true })
      .select()

    if (error) throw error

    const { count: total } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('type', type)

    res.json({
      success: true,
      message: `Imported ${data.length} new ${type} leads (${leads.length - data.length} duplicates skipped)`,
      count: data.length,
      skipped: leads.length - data.length,
      total,
    })
  } catch (err) {
    console.error('Error importing leads:', err.message)
    res.status(500).json({ error: 'Failed to import leads' })
  }
})

// POST /api/update-lead - Update a single lead
app.post('/api/update-lead', async (req, res) => {
  const { type, leadId, updates } = req.body

  if (!type || !leadId || !updates) {
    return res.status(400).json({ error: 'Need type, leadId, and updates' })
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ data: { ...existing.data, ...updates } })
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, lead: { id: data.id, ...data.data } })
  } catch (err) {
    console.error('Error updating lead:', err.message)
    res.status(500).json({ error: 'Failed to update lead' })
  }
})

// POST /api/send-to-instantly - push the next N unsent, has-email "calls"
// leads into an Instantly campaign, ranked by priority_score. Replaces
// clicking "Send Email" one lead at a time: one call handles a whole day's
// ramp batch, marking each lead sent in the same place the manual send does.
app.post('/api/send-to-instantly', async (req, res) => {
  if (!INSTANTLY_API_KEY || !INSTANTLY_CAMPAIGN_ID) {
    return res.status(500).json({
      error: 'INSTANTLY_API_KEY / INSTANTLY_CAMPAIGN_ID not set on the server (Render env vars).',
    })
  }

  const limit = Math.max(1, Math.min(200, Number(req.body?.limit) || 25))

  try {
    const { data, error } = await supabase.from('leads').select('*').eq('type', 'calls')
    if (error) throw error

    const candidates = data
      .map(row => ({ row, lead: { id: row.id, ...row.data } }))
      .filter(({ lead }) => lead.email && !lead.emailSentAt && !lead.optedOut)
      .sort((a, b) => (b.lead.priority_score || 0) - (a.lead.priority_score || 0))
      .slice(0, limit)

    let pushed = 0
    let failed = 0
    const details = []

    for (const { row, lead } of candidates) {
      try {
        const { draft } = generateEmailDraft(lead)
        const { subject, body } = splitDraftSubject(appendMailingAddress(draft))

        const resp = await fetch(INSTANTLY_LEADS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${INSTANTLY_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            // Instantly's Cloudflare front-end fingerprint-blocks the
            // default fetch/undici User-Agent (error 1010) without this.
            'User-Agent': 'Mozilla/5.0 (compatible; claude-crm/1.0)',
          },
          body: JSON.stringify({
            campaign: INSTANTLY_CAMPAIGN_ID,
            email: lead.email,
            company_name: lead.business_name,
            custom_variables: {
              company_name: lead.business_name,
              subject,
              full_body: body,
            },
            // false, not true: "skip if in workspace" checks the whole
            // workspace, not just this campaign — with it on, a lead that
            // already existed anywhere in Instantly (a different campaign,
            // an earlier test push) got silently skipped from actually
            // being enrolled here, while the API still returned success.
            // That mismatch is why the CRM showed way more "sent" than
            // Instantly's campaign ever actually had leads for.
            skip_if_in_workspace: false,
          }),
        })

        if (!resp.ok) {
          const text = await resp.text()
          throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`)
        }

        await supabase
          .from('leads')
          .update({ data: { ...row.data, emailSentAt: new Date().toISOString(), instantlySynced: true } })
          .eq('id', row.id)

        pushed++
        details.push({ id: lead.id, business_name: lead.business_name, status: 'sent' })
      } catch (err) {
        failed++
        details.push({ id: lead.id, business_name: lead.business_name, status: 'failed', error: err.message })
      }
    }

    res.json({ success: true, candidates: candidates.length, pushed, failed, details })
  } catch (err) {
    console.error('Error sending batch to Instantly:', err.message)
    res.status(500).json({ error: 'Failed to send batch to Instantly' })
  }
})

// POST /api/webhooks/instantly-reply - Instantly calls this the moment a
// lead replies (configured as a campaign webhook in the Instantly dashboard,
// event "Reply Received"). Looks the lead up by email across both lead
// types and stamps repliedAt, same field the manual "Mark Replied" button
// sets — so a webhook-driven reply and a manually-logged one look identical
// to the rest of the app, and the Replied panel picks it up on next sync
// with no separate code path.
//
// Instantly's exact payload shape isn't pinned down in code here, so this
// accepts whichever of the common field names shows up (lead_email, email,
// contact_email, or a nested lead.email) rather than a single hardcoded key.
app.post('/api/webhooks/instantly-reply', async (req, res) => {
  const secret = process.env.INSTANTLY_WEBHOOK_SECRET
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const body = req.body || {}
  const email = body.lead_email || body.email || body.contact_email || body.lead?.email
  if (!email) {
    return res.status(400).json({ error: 'No lead email found in webhook payload', received: body })
  }

  try {
    const { data, error } = await supabase.from('leads').select('*')
    if (error) throw error

    const row = data.find(r => (r.data.email || '').toLowerCase() === email.toLowerCase())
    if (!row) {
      return res.status(404).json({ error: 'No lead found with that email', email })
    }

    if (!row.data.repliedAt) {
      await supabase
        .from('leads')
        .update({ data: { ...row.data, repliedAt: new Date().toISOString() } })
        .eq('id', row.id)
    }

    res.json({ success: true, leadId: row.id, business_name: row.data.business_name })
  } catch (err) {
    console.error('Error handling Instantly reply webhook:', err.message)
    res.status(500).json({ error: 'Failed to process webhook' })
  }
})

// POST /api/admin/reset-instantly-sent - one-time recovery for the
// skip_if_in_workspace bug above: clears emailSentAt/instantlySynced on
// every "calls" lead that was marked sent via the Instantly batch push
// (instantlySynced === true), so they re-enter the "ready to send" queue
// and get pushed again now that the fix actually enrolls them in the
// campaign. Only touches instantlySynced leads — leads sent manually via
// the per-lead "Send Email" button (Gmail compose) never set that flag,
// so they're untouched.
app.post('/api/admin/reset-instantly-sent', async (req, res) => {
  try {
    const { data, error } = await supabase.from('leads').select('*').eq('type', 'calls')
    if (error) throw error

    const toReset = data.filter(row => row.data.instantlySynced === true)

    for (const row of toReset) {
      const { emailSentAt, instantlySynced, ...rest } = row.data
      await supabase.from('leads').update({ data: rest }).eq('id', row.id)
    }

    res.json({ success: true, reset: toReset.length })
  } catch (err) {
    console.error('Error resetting Instantly-sent leads:', err.message)
    res.status(500).json({ error: 'Failed to reset leads' })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 CRM API running at http://localhost:${PORT}`)
  console.log(`📥 Import endpoint: POST http://localhost:${PORT}/api/import-leads`)
  console.log(`📊 Get leads: GET http://localhost:${PORT}/api/leads`)
})
