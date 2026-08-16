import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  login: async (email, password) => {
    // TODO: Integrate with Supabase auth
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

  initializeSync: (userId) => {
    // Load from localStorage
    const stored = localStorage.getItem(`leads_${userId}`)
    if (stored) {
      const data = JSON.parse(stored)
      set(data)
    }
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
