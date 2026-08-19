import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Path to leads storage file
const leadsFile = path.join(__dirname, 'leads.json')

// Helper: Read leads from file
const readLeads = () => {
  try {
    if (fs.existsSync(leadsFile)) {
      return JSON.parse(fs.readFileSync(leadsFile, 'utf-8'))
    }
  } catch (err) {
    console.error('Error reading leads:', err.message)
  }
  return { calls: [], emails: [] }
}

// Helper: Write leads to file
const writeLeads = (data) => {
  fs.writeFileSync(leadsFile, JSON.stringify(data, null, 2))
}

// AI Ark helpers (owner-email enrichment)
const AI_ARK_BASE = 'https://api.ai-ark.com/api/developer-portal'

const extractDomain = (url) => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Response field names for the exported person aren't fixed in AI Ark's docs,
// so scan for any key containing "email" whose value looks like an address.
const findEmailInObject = (obj) => {
  if (!obj || typeof obj !== 'object') return null
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /email/i.test(key) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return value
    }
    if (value && typeof value === 'object') {
      const found = findEmailInObject(value)
      if (found) return found
    }
  }
  return null
}

const aiArkFindOwnerEmail = async (website) => {
  const domain = extractDomain(website)
  if (!domain) return { email: null, reason: 'invalid_website' }

  const headers = {
    'X-TOKEN': process.env.AI_ARK_API_KEY,
    'Content-Type': 'application/json',
  }

  const searchRes = await fetch(`${AI_ARK_BASE}/v1/people`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      account: { domain: { any: { include: { mode: 'STRICT', content: [domain] } } } },
      contact: { seniority: { any: { include: ['founder', 'owner', 'c_suite'] } } },
      page: 0,
      size: 1,
    }),
  })

  if (searchRes.status === 402) return { email: null, reason: 'credits_exhausted' }
  if (searchRes.status === 404) return { email: null, reason: 'no_person_found' }
  if (!searchRes.ok) return { email: null, reason: `search_error_${searchRes.status}` }

  const searchData = await searchRes.json()
  const person = searchData?.content?.[0]
  if (!person?.id) return { email: null, reason: 'no_person_found' }

  const exportRes = await fetch(`${AI_ARK_BASE}/v1/people/export/single`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: person.id }),
  })

  if (exportRes.status === 402) return { email: null, reason: 'credits_exhausted' }
  if (exportRes.status === 404) return { email: null, reason: 'no_email_found' }
  if (!exportRes.ok) return { email: null, reason: `export_error_${exportRes.status}` }

  const exportData = await exportRes.json()
  const email = findEmailInObject(exportData)
  return { email, reason: email ? 'found' : 'no_email_found' }
}

// GET /api/leads - Fetch all leads
app.get('/api/leads', (req, res) => {
  const leads = readLeads()
  res.json(leads)
})

// POST /api/import-leads - Import leads from routine
app.post('/api/import-leads', (req, res) => {
  const { type, leads, apiKey } = req.body

  // Simple auth: check API key if provided
  const expectedKey = process.env.CRMS_API_KEY || 'your-secret-key'
  if (apiKey && apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  if (!type || !Array.isArray(leads)) {
    return res.status(400).json({ error: 'Invalid request. Need "type" (calls/emails) and "leads" array.' })
  }

  if (type !== 'calls' && type !== 'emails') {
    return res.status(400).json({ error: 'Type must be "calls" or "emails"' })
  }

  try {
    const data = readLeads()
    data[type] = data[type] || []

    // Dedupe key: phone for calls, email for emails, fall back to business+website
    const dedupeKey = (lead) =>
      lead.phone || lead.email || `${lead.business_name}-${lead.website || ''}`

    const existingKeys = new Set(data[type].map(dedupeKey))

    const newLeads = leads
      .filter(lead => !existingKeys.has(dedupeKey(lead)))
      .map(lead => ({
        id: Date.now() + Math.random(),
        ...lead,
        status: lead.status || 'new',
        importedAt: new Date().toISOString(),
      }))

    data[type] = [...data[type], ...newLeads]
    writeLeads(data)

    res.json({
      success: true,
      message: `Imported ${newLeads.length} new ${type} leads (${leads.length - newLeads.length} duplicates skipped)`,
      count: newLeads.length,
      skipped: leads.length - newLeads.length,
      total: data[type].length,
    })
  } catch (err) {
    console.error('Error importing leads:', err)
    res.status(500).json({ error: 'Failed to import leads' })
  }
})

// POST /api/update-lead - Update a single lead
app.post('/api/update-lead', (req, res) => {
  const { type, leadId, updates } = req.body

  if (!type || !leadId || !updates) {
    return res.status(400).json({ error: 'Need type, leadId, and updates' })
  }

  try {
    const data = readLeads()
    const lead = data[type]?.find(l => l.id === leadId)

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    Object.assign(lead, updates)
    writeLeads(data)

    res.json({ success: true, lead })
  } catch (err) {
    console.error('Error updating lead:', err)
    res.status(500).json({ error: 'Failed to update lead' })
  }
})

// POST /api/send-email - Send email via Instantly (server-side, secure)
app.post('/api/send-email', async (req, res) => {
  const { lead } = req.body

  if (!lead?.email) {
    return res.status(400).json({ error: 'Lead email is required' })
  }

  const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY
  const INSTANTLY_EMAIL = process.env.INSTANTLY_EMAIL

  if (!INSTANTLY_API_KEY || !INSTANTLY_EMAIL) {
    return res.status(500).json({ error: 'Instantly credentials not configured' })
  }

  try {
    const emailBody = `Hi ${lead.contact_name || lead.business_name},

I wanted to reach out about ${lead.pitch_angle ? `how we can help with ${lead.pitch_angle.toLowerCase()}` : 'a potential opportunity'}.

Would you be open to a brief conversation?

Best regards,
Silven
silven@apexstandardhq.com`

    const response = await fetch('https://api.instantly.ai/api/v2/emails/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eaccount: INSTANTLY_EMAIL,
        to_address_email_list: lead.email,
        subject: `Quick question about ${lead.business_name}`,
        body: {
          html: `<p>${emailBody.replace(/\n/g, '</p><p>')}</p>`,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return res.status(response.status).json({ error: error.message || response.statusText })
    }

    const result = await response.json()
    res.json({ success: true, result })
  } catch (err) {
    console.error('Error sending email via Instantly:', err)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// POST /api/backfill-emails - Bulk AI Ark owner-email enrichment for leads
// that have a website but no email yet. Runs with real concurrency instead
// of one lookup at a time.
app.post('/api/backfill-emails', async (req, res) => {
  if (!process.env.AI_ARK_API_KEY) {
    return res.status(500).json({ error: 'AI_ARK_API_KEY not configured' })
  }

  const data = readLeads()
  data.calls = data.calls || []

  const targets = data.calls.filter((l) => l.website && !l.email)
  const CONCURRENCY = 5 // matches AI Ark's 5 req/sec rate limit
  let index = 0
  let emailsFound = 0
  let creditsExhausted = false
  const errors = []

  const worker = async () => {
    while (index < targets.length && !creditsExhausted) {
      const lead = targets[index]
      index += 1
      try {
        const { email, reason } = await aiArkFindOwnerEmail(lead.website)
        if (reason === 'credits_exhausted') {
          creditsExhausted = true
          break
        }
        if (email) {
          lead.email = email
          emailsFound += 1
        }
      } catch (err) {
        errors.push({ leadId: lead.id, business_name: lead.business_name, error: err.message })
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  writeLeads(data)

  res.json({
    success: true,
    totalWithWebsite: targets.length,
    checked: index,
    emailsFound,
    creditsExhausted,
    errors,
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CRM API running at http://localhost:${PORT}`)
  console.log(`📥 Import endpoint: POST http://localhost:${PORT}/api/import-leads`)
  console.log(`📊 Get leads: GET http://localhost:${PORT}/api/leads`)
})
