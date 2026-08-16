import { create } from 'zustand'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

  // Adds a single lead to the live backend (dedup by phone/email happens server-side),
  // then merges the result into local state so it shows up immediately.
  addLeadToServer: async (type, lead) => {
    const response = await fetch(`${API_URL}/api/import-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, leads: [lead] }),
    })
    if (!response.ok) throw new Error(`Server responded ${response.status}`)
    const result = await response.json()

    if (result.count > 0) {
      await get().syncFromServer()
    }

    return result
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

  persistLeads: () => {
    const user = useAuthStore.getState().user
    if (user) {
      const state = get()
      localStorage.setItem(`leads_${user.id}`, JSON.stringify({
        callLeads: state.callLeads,
        emailLeads: state.emailLeads,
        nurtureLogs: state.nurtureLogs,
      }))
    }
  },
}))
