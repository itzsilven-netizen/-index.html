import { useState, useMemo } from 'react'
import { useLeadsStore } from '../store'
import './CalendarPage.css'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 8am - 6pm
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TYPE_LABELS = { call: 'Call', meeting: 'Meeting', demo: 'Demo', 'follow-up': 'Follow-Up' }

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export default function CalendarPage({ onOpenLead }) {
  const { events, callLeads, emailLeads, deleteEvent } = useLeadsStore()
  const [anchor, setAnchor] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const weekStart = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const allLeads = useMemo(() => [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ], [callLeads, emailLeads])

  const findLead = (leadId, leadType) =>
    (leadType === 'calls' ? callLeads : emailLeads).find(l => l.id === leadId)

  const eventsForDay = (day) => events.filter(e => {
    const d = new Date(e.date)
    return d.toDateString() === day.toDateString()
  })

  const rangeLabel = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const shiftWeek = (delta) => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + delta * 7)
    setAnchor(d)
  }

  return (
    <div className="page calendar-page">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p className="page-subtitle">Manage your schedule and appointments.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setAnchor(new Date())}>Today</button>
          <button className="btn btn-ghost cal-nav" onClick={() => shiftWeek(-1)}>‹</button>
          <button className="btn btn-ghost cal-nav" onClick={() => shiftWeek(1)}>›</button>
          <button className="btn" onClick={() => setShowCreate(true)}>+ New Event</button>
        </div>
      </div>

      <div className="cal-range">{rangeLabel}</div>

      <div className="card cal-grid-wrap">
        <div className="cal-grid">
          <div className="cal-corner" />
          {days.map(d => (
            <div className={`cal-daycol-header ${d.toDateString() === new Date().toDateString() ? 'is-today' : ''}`} key={d.toISOString()}>
              <div className="cal-day-label">{DAY_LABELS[d.getDay()]}</div>
              <div className="cal-day-num">{d.getDate()}</div>
            </div>
          ))}

          {HOURS.map(hour => (
            <>
              <div className="cal-hour-label" key={`h-${hour}`}>
                {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'AM' : 'PM'}
              </div>
              {days.map(d => (
                <div className="cal-cell" key={`${d.toISOString()}-${hour}`} />
              ))}
            </>
          ))}

          {days.map((d, dayIdx) => eventsForDay(d).map(ev => {
            const start = new Date(ev.date)
            const startHour = start.getHours() + start.getMinutes() / 60
            if (startHour < HOURS[0] || startHour > HOURS[HOURS.length - 1] + 1) return null
            const HEADER_HEIGHT = 61 // matches .cal-daycol-header rendered height
            const top = HEADER_HEIGHT + (startHour - HOURS[0]) * 52
            const height = Math.max((ev.duration || 30) / 60 * 52, 30)
            const lead = findLead(ev.leadId, ev.leadType)
            return (
              <button
                key={ev.id}
                className={`cal-event type-${ev.type}`}
                style={{ top, height, gridColumn: dayIdx + 2 }}
                onClick={() => setSelectedEvent(ev)}
              >
                <div className="cal-event-title">{ev.title}</div>
                {lead && <div className="cal-event-lead">{lead.business_name}</div>}
              </button>
            )
          }))}
        </div>
      </div>

      <div className="cal-legend">
        {Object.entries(TYPE_LABELS).map(([k, v]) => (
          <span className="cal-legend-item" key={k}>
            <span className={`cal-legend-dot type-${k}`} />
            {v}
          </span>
        ))}
      </div>

      {showCreate && (
        <CreateEventModal
          leads={allLeads}
          onClose={() => setShowCreate(false)}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          lead={findLead(selectedEvent.leadId, selectedEvent.leadType)}
          onOpenLead={onOpenLead}
          onDelete={() => { deleteEvent(selectedEvent.id); setSelectedEvent(null) }}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}

function CreateEventModal({ leads, prefill, onClose }) {
  const addEvent = useLeadsStore((s) => s.addEvent)
  const [type, setType] = useState(prefill?.type || 'call')
  const [leadId, setLeadId] = useState(prefill?.leadId ? String(prefill.leadId) : '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [reminder, setReminder] = useState('15')
  const [notes, setNotes] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!date || !time) return
    const lead = leads.find(l => String(l.id) === leadId)
    addEvent({
      type,
      leadId: lead?.id,
      leadType: lead?._type,
      title: lead ? `${TYPE_LABELS[type]} — ${lead.business_name}` : TYPE_LABELS[type],
      date: new Date(`${date}T${time}`).toISOString(),
      duration: Number(duration),
      reminder: Number(reminder),
      notes,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Event</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <div className="form-group">
            <label>Event Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
              <option value="demo">Demo</option>
              <option value="follow-up">Follow-Up</option>
            </select>
          </div>
          <div className="form-group">
            <label>Lead</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">(none)</option>
              {leads.map(l => <option key={`${l._type}-${l.id}`} value={l.id}>{l.business_name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Start Time *</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reminder</label>
              <select value={reminder} onChange={(e) => setReminder(e.target.value)}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="1440">1 day</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">Schedule Event</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EventDetailModal({ event, lead, onOpenLead, onDelete, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{event.title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="event-detail-body">
          <div className="event-detail-row">
            <span>When</span>
            <span>{new Date(event.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {event.duration}m</span>
          </div>
          {lead && (
            <>
              <div className="event-detail-row"><span>Lead</span><span>{lead.business_name}</span></div>
              {lead.phone && <div className="event-detail-row"><span>Phone</span><span>{lead.phone}</span></div>}
              {lead.email && <div className="event-detail-row"><span>Email</span><span>{lead.email}</span></div>}
            </>
          )}
          {event.notes && <div className="event-detail-row"><span>Notes</span><span>{event.notes}</span></div>}
        </div>
        <div className="modal-actions" style={{ padding: '0 24px 24px' }}>
          {lead && (
            <button className="btn btn-ghost" onClick={() => { onOpenLead({ ...lead, _type: event.leadType }); onClose() }}>
              Open Lead
            </button>
          )}
          <button className="btn btn-ghost" onClick={onDelete}>Cancel Event</button>
        </div>
      </div>
    </div>
  )
}

export { CreateEventModal }
