import { useMemo, useState } from 'react'
import { useLeadsStore } from '../store'
import './AddQueueModal.css'

const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/

// Splits a pasted line into a phone number and a name, whatever the
// separator — the whole point is "paste the list you just emailed from,
// however it's formatted" rather than requiring a specific export shape.
function parseLine(line) {
  const parts = line.split(/\t|,/).map(p => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const phonePart = parts.find(p => PHONE_RE.test(p))
    const phone = phonePart ? phonePart.match(PHONE_RE)[0] : ''
    const name = parts.find(p => p !== phonePart) || parts[0]
    return { business_name: name, phone }
  }
  const match = line.match(PHONE_RE)
  if (!match) return { business_name: line, phone: '' }
  const phone = match[0]
  const name = line.replace(phone, '').replace(/[-,|]/g, ' ').trim()
  return { business_name: name || 'Unknown', phone }
}

function parseList(text) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(parseLine)
}

export default function AddQueueModal({ onClose }) {
  const { callLeads, importCallLeads } = useLeadsStore()
  const [text, setText] = useState('')

  const parsed = useMemo(() => parseList(text), [text])
  const withPhone = parsed.filter(l => l.phone)
  const withoutPhone = parsed.length - withPhone.length

  const existingPhones = useMemo(() => new Set(callLeads.map(l => l.phone).filter(Boolean)), [callLeads])
  const toAdd = withPhone.filter(l => !existingPhones.has(l.phone))
  const dupes = withPhone.length - toAdd.length

  const add = () => {
    if (toAdd.length === 0) return
    importCallLeads(toAdd.map(l => ({ business_name: l.business_name, phone: l.phone, priority_score: 3 })))
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card add-queue-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add to Queue</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="add-queue-hint">
          Paste your list — one lead per line. Works with "Name, Phone", a name and number on the same
          line, or just phone numbers. Lines with no usable phone number are skipped.
        </p>
        <textarea
          className="add-queue-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'ABC Plumbing, 555-0123\nCentral Roofing 555-0199\n555-0177'}
          rows={10}
          autoFocus
        />
        <div className="add-queue-summary">
          {text.trim() === '' ? (
            <span>Paste a list above to preview it.</span>
          ) : (
            <span>
              {toAdd.length} ready to add
              {dupes > 0 && <> &middot; {dupes} already in your leads</>}
              {withoutPhone > 0 && <> &middot; {withoutPhone} skipped (no phone number found)</>}
            </span>
          )}
        </div>
        <div className="add-queue-actions">
          <button className="btn" onClick={add} disabled={toAdd.length === 0}>
            Add {toAdd.length || ''} to Queue
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
