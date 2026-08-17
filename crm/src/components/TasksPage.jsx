import { useState, useMemo } from 'react'
import { useLeadsStore } from '../store'
import CallResultModal from './CallResultModal'
import './TasksPage.css'

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }

export default function TasksPage({ onOpenLead }) {
  const { tasks, callLeads, emailLeads, completeTask, reopenTask, addTask } = useLeadsStore()
  const [view, setView] = useState('upcoming')
  const [showAddTask, setShowAddTask] = useState(false)
  const [callResultFor, setCallResultFor] = useState(null)

  const allLeads = useMemo(() => [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ], [callLeads, emailLeads])

  const findLead = (leadId, leadType) =>
    (leadType === 'calls' ? callLeads : emailLeads).find(l => l.id === leadId)

  const now = Date.now()
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999)

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const due = t.dueAt ? new Date(t.dueAt).getTime() : null
      if (view === 'completed') return t.completed
      if (t.completed) return false
      if (view === 'today') return due && due >= startOfToday.getTime() && due <= endOfToday.getTime()
      if (view === 'overdue') return due && due < startOfToday.getTime()
      return true // upcoming = all incomplete
    }).sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0))
  }, [tasks, view])

  const handleComplete = (task) => {
    const lead = findLead(task.leadId, task.leadType)
    completeTask(task.id)
    if (task.type === 'call' && lead) {
      setCallResultFor({ lead, leadType: task.leadType })
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-subtitle">Stay on top of what needs to get done.</p>
        </div>
        <button className="btn" onClick={() => setShowAddTask(true)}>+ Add Task</button>
      </div>

      <div className="tasks-tabs">
        {['upcoming', 'today', 'overdue', 'completed'].map(v => (
          <button key={v} className={`tasks-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
            {v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card leads-empty">
          <h3>Nothing here</h3>
          <p>
            {view === 'completed' ? 'No completed tasks yet.' : 'No tasks in this view. Add one, or they\'ll appear automatically after a "No Answer" call result.'}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {filtered.map(task => {
            const lead = findLead(task.leadId, task.leadType)
            const overdue = !task.completed && task.dueAt && new Date(task.dueAt).getTime() < now
            return (
              <div className={`card task-item ${task.completed ? 'task-done' : ''}`} key={task.id}>
                <button
                  className="task-check"
                  onClick={() => task.completed ? reopenTask(task.id) : handleComplete(task)}
                  aria-label="Toggle complete"
                >
                  {task.completed && (
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="task-body">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    {lead && (
                      <button className="task-lead-link" onClick={() => onOpenLead({ ...lead, _type: task.leadType })}>
                        {lead.business_name}
                      </button>
                    )}
                    <span className="task-type">{task.type}</span>
                    {task.dueAt && (
                      <span className={overdue ? 'task-due overdue' : 'task-due'}>
                        {new Date(task.dueAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <span className={`priority-tag priority-${task.priority}`}>{PRIORITY_LABELS[task.priority] || task.priority}</span>
              </div>
            )
          })}
        </div>
      )}

      {showAddTask && (
        <AddTaskModal
          leads={allLeads}
          onAdd={addTask}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {callResultFor && (
        <CallResultModal
          lead={callResultFor.lead}
          leadType={callResultFor.leadType}
          onClose={() => setCallResultFor(null)}
        />
      )}
    </div>
  )
}

function AddTaskModal({ leads, onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [leadId, setLeadId] = useState('')
  const [type, setType] = useState('call')
  const [priority, setPriority] = useState('medium')
  const [dueAt, setDueAt] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const lead = leads.find(l => String(l.id) === leadId)
    onAdd({
      title,
      leadId: lead?.id,
      leadType: lead?._type,
      type,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Task</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <div className="form-group">
            <label>Task *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up with..." />
          </div>
          <div className="form-group">
            <label>Lead</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">(none)</option>
              {leads.map(l => <option key={`${l._type}-${l.id}`} value={l.id}>{l.business_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="follow-up">Follow-Up</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label>Due</label>
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  )
}
