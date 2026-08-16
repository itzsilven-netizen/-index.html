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
