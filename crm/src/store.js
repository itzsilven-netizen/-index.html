import { create } from 'zustand'
import { generateEmailDraft } from './emailDrafts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// CAN-SPAM requires a valid physical postal address in every commercial email.
// It's meant to be printed in every outgoing email anyway, so there's no
// confidentiality reason to keep it out of the source — the env var just
// lets it be overridden without a code change if it ever moves.
export const COMPANY_MAILING_ADDRESS = import.meta.env.VITE_COMPANY_MAILING_ADDRESS || 'Apex Standard, PO Box 1093, Willow Creek, CA 95573'

const appendMailingAddress = (draft) => {
  if (!COMPANY_MAILING_ADDRESS || draft.includes(COMPANY_MAILING_ADDRESS)) return draft
  return `${draft.trim()}\n\n${COMPANY_MAILING_ADDRESS}`
}

// Best-effort push of a status/field change to the existing /api/update-lead
// endpoint, so other apps reading the leads table (Agent OS) see it. Never
// throws into the caller — a failed push here must never look like a failed
// local update, since the local update already succeeded and is what the UI
// and persistLeads() actually depend on.
const pushLeadUpdateToServer = async (type, serverId, updates) => {
  try {
    const res = await fetch(`${API_URL}/api/update-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, leadId: serverId, updates }),
    })
    if (!res.ok) console.warn('Lead update did not reach the server:', res.status)
  } catch (err) {
    console.warn('Lead update did not reach the server:', err.message)
  }
}

// Returns { draft, format } — format carries id/name/structure so the caller
// can persist which of the 4 tested structures this lead got, alongside the
// draft text itself.
export const draftForLead = (lead) => {
  const { draft, format } = generateEmailDraft(lead)
  return { draft: appendMailingAddress(draft), format }
}

// A draft that starts with "Subject: ..." gets split so the subject line
// lands in the compose window's subject field instead of the body.
const splitDraftSubject = (draft) => {
  const match = draft.match(/^subject:\s*(.+)\n+([\s\S]*)$/i)
  return match ? { subject: match[1].trim(), body: match[2].trim() } : { subject: '', body: draft }
}

// Opens Gmail's web compose addressed to the lead, in a real new tab, and
// copies the draft to the clipboard as a fallback. mailto: got tried in
// between — it's the "correct" OS-level way to say "compose an email," and
// can hand off to the native Gmail app — but a mailto: URL has no page to
// render, so mobile browsers don't treat it as "open a new tab" the way
// they do a real http(s) URL; every variation tried (location.href,
// window.open, even opening a blank tab first) still landed in the same
// tab in practice. A plain https://mail.google.com/... link doesn't have
// that problem — browsers reliably open real web links in an actual new
// tab via window.open(url, '_blank'), which is the behavior that was
// actually being asked for (switch tabs, don't get bounced through Back).
// Gmail's su=/body= URL params are known-unreliable (confirmed earlier —
// they silently dropped, leaving only "to" filled in), so this only sets
// "to" and relies on the clipboard copy for the subject/body paste.
export const openEmailSendCompose = (lead, draft) => {
  if (!lead.email) return
  const { subject, body } = splitDraftSubject(draft)
  const clipboardText = subject ? `Subject: ${subject}\n\n${body}` : body
  if (navigator.clipboard) {
    navigator.clipboard.writeText(clipboardText).catch(() => {})
  }
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: lead.email })
  window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank')
}

export const voicemailFollowUpMessage = (lead) => {
  const angle = lead.pitch_angle ? ` about ${lead.pitch_angle.toLowerCase()}` : ''
  return `Hi, this is Silven — just left you a voicemail${angle}. Text me back here if that's easier, happy to answer any questions. Reply STOP to opt out.`
}

// Copies the lead's number to the clipboard and opens Google Voice's message
// inbox in a new tab, ready to paste in. Intentionally NOT automatic-send —
// you still paste the number, type/paste the message, and tap Send yourself,
// which keeps this a manually-sent text rather than an autodialer-style
// blast (a meaningfully safer posture under the TCPA).
export const openVoicemailFollowUpText = (lead) => {
  if (!lead.phone) return
  const digits = lead.phone.replace(/[^\d]/g, '')
  if (navigator.clipboard) {
    navigator.clipboard.writeText(digits).catch(() => {})
  }
  window.open('https://voice.google.com/u/0/messages', '_blank')
}

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

  // Pulls the latest data from the backend. Leads already known locally get their
  // enrichment fields (email, website, rating, etc.) refreshed from the server, since
  // that's where imports/backfills land — but status and lastContact stay whatever the
  // browser has (a local edit always wins over what syncFromServer just read), so a
  // stale poll can never revert a user's own status edit out from under them.
  //
  // `id` stays the LOCAL id for the same reason — it's the React key and the argument
  // every update*Lead call already uses, so changing what it points at mid-session would
  // break every open reference to this lead. The server's own row id (needed to target
  // updateCallLead/updateEmailLead's write at the right Supabase row instead of a
  // client-only id it doesn't recognize) rides separately as `_serverId`, on both a
  // freshly-matched local lead and a brand new one pulled straight from the server.
  syncFromServer: async () => {
    const response = await fetch(`${API_URL}/api/leads`)
    if (!response.ok) throw new Error(`Server responded ${response.status}`)
    const data = await response.json()

    const dedupeKey = (lead) =>
      lead.phone || lead.email || `${lead.business_name}-${lead.website || ''}`

    const mergeWithServer = (localLeads, serverLeads) => {
      const serverByKey = new Map(serverLeads.map(l => [dedupeKey(l), l]))
      const matchedKeys = new Set()

      const merged = localLeads.map(local => {
        const key = dedupeKey(local)
        const server = serverByKey.get(key)
        if (!server) return local
        matchedKeys.add(key)
        return { ...local, ...server, id: local.id, _serverId: server.id, status: local.status, lastContact: local.lastContact }
      })

      const newLeads = serverLeads
        .filter(l => !matchedKeys.has(dedupeKey(l)))
        .map(l => ({ ...l, _serverId: l.id }))
      return [...merged, ...newLeads]
    }

    const { callLeads, emailLeads } = get()
    const mergedCallLeads = mergeWithServer(callLeads, data.calls || [])
    const mergedEmailLeads = mergeWithServer(emailLeads, data.emails || [])

    set({ callLeads: mergedCallLeads, emailLeads: mergedEmailLeads })
    get().persistLeads()

    return { callLeads: mergedCallLeads.length, emailLeads: mergedEmailLeads.length }
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

  // Pushes the next `limit` unsent, has-email call leads (ranked by
  // priority_score) into the configured Instantly campaign in one request —
  // the batch alternative to clicking "Send Email" on each lead in the
  // drawer. The server generates each draft and marks leads sent, so a
  // syncFromServer() after this picks up the new emailSentAt values.
  sendBatchToInstantly: async (limit) => {
    const response = await fetch(`${API_URL}/api/send-to-instantly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || `Server responded ${response.status}`)
    if (result.pushed > 0) {
      await get().syncFromServer()
    }
    return result
  },

  // Local state is always updated immediately and synchronously, same as before —
  // nothing about the UI's responsiveness depends on the network call below.
  // The push to the backend is fire-and-forget: it lets other apps reading
  // /api/leads (Agent OS's live Leads view, in particular) see this change without
  // this browser's localStorage being involved, but it never blocks or reverts the
  // local update if it fails — an offline edit still saves locally exactly like
  // before this existed. Only fires when the lead actually has a matching Supabase
  // row (`_serverId`, set by syncFromServer) — a lead that only ever existed in this
  // browser has nothing to push to yet.
  updateCallLead: (id, updates) => {
    const { callLeads } = get()
    const lead = callLeads.find(l => l.id === id)
    set({ callLeads: callLeads.map(l => l.id === id ? { ...l, ...updates } : l) })
    get().persistLeads()
    if (lead?._serverId) pushLeadUpdateToServer('calls', lead._serverId, updates)
  },

  updateEmailLead: (id, updates) => {
    const { emailLeads } = get()
    const lead = emailLeads.find(l => l.id === id)
    set({ emailLeads: emailLeads.map(l => l.id === id ? { ...l, ...updates } : l) })
    get().persistLeads()
    if (lead?._serverId) pushLeadUpdateToServer('emails', lead._serverId, updates)
  },

  // Opens the pre-filled Gmail compose window for the (possibly edited) draft,
  // then records that a send was initiated. Same deliberately-manual posture
  // as logCallResult's text follow-up: the app never calls Gmail's API itself.
  sendEmailDraft: (lead, leadType, draft) => {
    const { updateCallLead, updateEmailLead, addNurtureLog } = get()
    const update = leadType === 'calls' ? updateCallLead : updateEmailLead

    openEmailSendCompose(lead, draft)
    update(lead.id, {
      email_draft: draft,
      emailSentAt: new Date().toISOString(),
      lastContact: new Date().toLocaleString(),
      status: (!lead.status || lead.status === 'new') ? 'contacted' : lead.status,
    })
    addNurtureLog({
      leadId: lead.id,
      leadType,
      message: 'Opened email follow-up in Gmail (Send Email)',
      type: 'note',
    })
  },

  // There's no backend Gmail access to detect replies automatically yet, so
  // this stays a manual log entry the user makes after checking their inbox.
  markEmailReplied: (lead, leadType) => {
    const { updateCallLead, updateEmailLead, addNurtureLog } = get()
    const update = leadType === 'calls' ? updateCallLead : updateEmailLead
    update(lead.id, { repliedAt: new Date().toISOString() })
    addNurtureLog({ leadId: lead.id, leadType, message: 'Marked as replied', type: 'status' })
  },

  markEmailOptedOut: (lead, leadType) => {
    const { updateCallLead, updateEmailLead, addNurtureLog } = get()
    const update = leadType === 'calls' ? updateCallLead : updateEmailLead
    update(lead.id, { optedOut: true })
    addNurtureLog({ leadId: lead.id, leadType, message: 'Marked opted out — excluded from future sends', type: 'status' })
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
