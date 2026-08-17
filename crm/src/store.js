import { create } from 'zustand'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const INSTANTLY_API_KEY = import.meta.env.VITE_INSTANTLY_API_KEY
const INSTANTLY_EMAIL = import.meta.env.VITE_INSTANTLY_EMAIL

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  login: async (email, password) => {
    const user = { id: email, email }
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
  logout: () => {
    localStorage.removeItem('user')
    set({ user: null })
  },
}))

export const useLeadsStore = create((set, get) => ({
  callLeads: [],
  emailLeads: [],
  nurtureLogs: [],
  tasks: [],
  events: [],
  pendingSchedule: null,

  initializeSync: async (userId) => {
    // Load local state first so any status/notes edits aren't lost
    const stored = localStorage.getItem(`leads_${userId}`)
    if (stored) {
      set(JSON.parse(stored))
    }

    // Then merge in anything new from the backend (never overwrites existing leads)
    try {
      await get().syncFromServer()
    } catch (err) {
      console.log('Backend not available, using localStorage only')
    }
  },

  syncFromServer: async () => {
    const response = await fetch(`${API_URL}/api/leads`)
    if (!response.ok) throw new Error(`Server responded ${response.status}`)
    const data = await response.json()

    const dedupeKey = (lead) =>
      lead.phone || lead.email || `${lead.business_name}-${lead.website || ''}`

    const { callLeads, emailLeads } = get()
    const existingCallKeys = new Set(callLeads.map(dedupeKey))
    const existingEmailKeys = new Set(emailLeads.map(dedupeKey))

    const newCallLeads = (data.calls || []).filter(l => !existingCallKeys.has(dedupeKey(l)))
    const newEmailLeads = (data.emails || []).filter(l => !existingEmailKeys.has(dedupeKey(l)))

    set({
      callLeads: [...callLeads, ...newCallLeads],
      emailLeads: [...emailLeads, ...newEmailLeads],
    })
    get().persistLeads()

    return { newCallLeads: newCallLeads.length, newEmailLeads: newEmailLeads.length }
  },

  addCallLead: (lead) => {
    const { callLeads } = get()
    const newLead = {
      id: Date.now(),
      ...lead,
      dateAdded: new Date().toISOString(),
    }
    set({ callLeads: [...callLeads, newLead] })
    get().persistLeads()
  },

  addEmailLead: (lead) => {
    const { emailLeads } = get()
    const newLead = {
      id: Date.now(),
      ...lead,
      campaignSentDate: new Date().toISOString(),
    }
    set({ emailLeads: [...emailLeads, newLead] })
    get().persistLeads()
  },

  updateCallLead: (id, updates) => {
    const { callLeads } = get()
    set({ callLeads: callLeads.map(l => l.id === id ? { ...l, ...updates } : l) })
    get().persistLeads()
  },

  updateEmailLead: (id, updates) => {
    const { emailLeads } = get()
    set({ emailLeads: emailLeads.map(l => l.id === id ? { ...l, ...updates } : l) })
    get().persistLeads()
  },

  importCallLeads: (leads) => {
    const { callLeads } = get()
    const newLeads = leads.map(lead => ({
      id: Date.now() + Math.random(),
      ...lead,
      dateAdded: lead.date_added || new Date().toISOString(),
      status: lead.status || 'new',
    }))
    set({ callLeads: [...callLeads, ...newLeads] })
    get().persistLeads()
  },

  importEmailLeads: (leads) => {
    const { emailLeads } = get()
    const newLeads = leads.map(lead => ({
      id: Date.now() + Math.random(),
      ...lead,
      campaignSentDate: lead.campaign_sent_date || new Date().toISOString(),
      status: lead.status || 'new',
    }))
    set({ emailLeads: [...emailLeads, ...newLeads] })
    get().persistLeads()
  },

  addNurtureLog: (log) => {
    const { nurtureLogs } = get()
    set({ nurtureLogs: [...nurtureLogs, { id: Date.now(), ...log, timestamp: new Date().toISOString() }] })
    get().persistLeads()
  },

  // ---- Tasks ----

  addTask: (task) => {
    const { tasks } = get()
    const newTask = {
      id: Date.now() + Math.random(),
      type: 'call',
      priority: 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      ...task,
    }
    set({ tasks: [newTask, ...tasks] })
    get().persistLeads()
    return newTask
  },

  completeTask: (id) => {
    const { tasks } = get()
    set({ tasks: tasks.map(t => t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t) })
    get().persistLeads()
  },

  reopenTask: (id) => {
    const { tasks } = get()
    set({ tasks: tasks.map(t => t.id === id ? { ...t, completed: false, completedAt: null } : t) })
    get().persistLeads()
  },

  deleteTask: (id) => {
    const { tasks } = get()
    set({ tasks: tasks.filter(t => t.id !== id) })
    get().persistLeads()
  },

  // ---- Calendar events ----

  addEvent: (event) => {
    const { events } = get()
    const newEvent = {
      id: Date.now() + Math.random(),
      type: 'call',
      duration: 30,
      createdAt: new Date().toISOString(),
      ...event,
    }
    set({ events: [...events, newEvent] })
    get().persistLeads()
    return newEvent
  },

  updateEvent: (id, updates) => {
    const { events } = get()
    set({ events: events.map(e => e.id === id ? { ...e, ...updates } : e) })
    get().persistLeads()
  },

  deleteEvent: (id) => {
    const { events } = get()
    set({ events: events.filter(e => e.id !== id) })
    get().persistLeads()
  },

  requestSchedule: (lead, leadType) => set({ pendingSchedule: { lead, leadType } }),
  clearPendingSchedule: () => set({ pendingSchedule: null }),

  // Quick call-result system: logs the outcome, moves the lead's stage,
  // and (for "No Answer") spins up a same-lead follow-up task automatically.
  logCallResult: (lead, leadType, result) => {
    const { updateCallLead, updateEmailLead, addNurtureLog, addTask } = get()
    const update = leadType === 'calls' ? updateCallLead : updateEmailLead

    const STAGE_BY_RESULT = {
      no_answer: null,
      interested: 'contacted',
      qualified: 'qualified',
      booked: 'booked',
      won: 'closed',
    }
    const LABEL_BY_RESULT = {
      no_answer: 'No Answer',
      interested: 'Interested',
      qualified: 'Qualified',
      booked: 'Meeting Booked',
      won: 'Won',
      not_interested: 'Not Interested',
    }

    const stage = STAGE_BY_RESULT[result]
    if (stage) {
      update(lead.id, { status: stage, lastContact: new Date().toLocaleString() })
    } else {
      update(lead.id, { lastContact: new Date().toLocaleString() })
    }

    addNurtureLog({
      leadId: lead.id,
      leadType,
      message: `Call result: ${LABEL_BY_RESULT[result] || result}`,
      type: 'status',
    })

    if (result === 'no_answer') {
      addTask({
        leadId: lead.id,
        leadType,
        title: `Follow up with ${lead.business_name}`,
        type: 'call',
        priority: 'medium',
        dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      })
      openVoicemailFollowUpText(lead)
      addNurtureLog({
        leadId: lead.id,
        leadType,
        message: 'Opened text follow-up (voicemail left)',
        type: 'note',
      })
    }

    if (result === 'booked') {
      get().requestSchedule(lead, leadType)
    }
  },

  sendInstantlyDraft: async (lead) => {
    if (!INSTANTLY_API_KEY || !INSTANTLY_EMAIL || !lead.email) {
      throw new Error('Missing Instantly configuration or lead email')
    }

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
      throw new Error(`Instantly API error: ${error.message || response.statusText}`)
    }

    return await response.json()
  },

  persistLeads: () => {
    const user = useAuthStore.getState().user
    if (user) {
      const state = get()
      localStorage.setItem(`leads_${user.id}`, JSON.stringify({
        callLeads: state.callLeads,
        emailLeads: state.emailLeads,
        nurtureLogs: state.nurtureLogs,
        tasks: state.tasks,
        events: state.events,
      }))
    }
  },
}))
