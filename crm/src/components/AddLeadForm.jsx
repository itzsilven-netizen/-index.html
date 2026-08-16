import { useState } from 'react'
import { useLeadsStore } from '../store'
import './AddLeadForm.css'

const CALL_FIELDS = [
  { name: 'business_name', label: 'Business Name', required: true },
  { name: 'niche', label: 'Niche' },
  { name: 'phone', label: 'Phone', required: true },
  { name: 'website', label: 'Website' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'priority_score', label: 'Priority Score (0-5)' },
  { name: 'notes', label: 'Notes' },
]

const EMAIL_FIELDS = [
  { name: 'business_name', label: 'Business Name', required: true },
  { name: 'contact_name', label: 'Contact Name' },
  { name: 'email', label: 'Email', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'niche', label: 'Niche' },
  { name: 'notes', label: 'Notes' },
]

export default function AddLeadForm({ type, onClose }) {
  const addLeadToServer = useLeadsStore((s) => s.addLeadToServer)
  const [form, setForm] = useState({})
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fields = type === 'calls' ? CALL_FIELDS : EMAIL_FIELDS
  const dedupeField = type === 'calls' ? 'phone' : 'email'

  const handleChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const missing = fields.filter((f) => f.required && !form[f.name]?.trim())
    if (missing.length > 0) {
      setStatus(`Missing required: ${missing.map((f) => f.label).join(', ')}`)
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      const result = await addLeadToServer(type, form)
      if (result.count === 0) {
        setStatus(`⚠️ Not added — a lead with that ${dedupeField} already exists.`)
      } else {
        setStatus('✓ Lead added')
        setTimeout(onClose, 800)
      }
    } catch (err) {
      setStatus(`❌ Failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add {type === 'calls' ? 'Call' : 'Email'} Lead</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {fields.map((field) => (
            <div className="form-group" key={field.name}>
              <label>{field.label}{field.required && ' *'}</label>
              <input
                type="text"
                value={form[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            </div>
          ))}

          {status && <div className="modal-status">{status}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
