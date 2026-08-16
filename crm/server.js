import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 CRM API running at http://localhost:${PORT}`)
  console.log(`📥 Import endpoint: POST http://localhost:${PORT}/api/import-leads`)
  console.log(`📊 Get leads: GET http://localhost:${PORT}/api/leads`)
})
