import { useLeadsStore } from '../store'
import './CallResultModal.css'

const RESULTS = [
  { key: 'no_answer', label: 'No Answer', hint: 'Creates a follow-up task for tomorrow' },
  { key: 'interested', label: 'Interested', hint: 'Moves to Contacted' },
  { key: 'qualified', label: 'Qualified', hint: 'Moves to Qualified' },
  { key: 'booked', label: 'Meeting Booked', hint: 'Moves to Booked' },
  { key: 'won', label: 'Won', hint: 'Moves to Closed Won' },
  { key: 'not_interested', label: 'Not Interested', hint: 'Logs the outcome only' },
]

export default function CallResultModal({ lead, leadType, onClose }) {
  const logCallResult = useLeadsStore((s) => s.logCallResult)

  const pick = (result) => {
    logCallResult(lead, leadType, result)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card result-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Log call result</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="result-lead">{lead.business_name}</div>
        <div className="result-options">
          {RESULTS.map((r) => (
            <button key={r.key} className="result-option" onClick={() => pick(r.key)}>
              <span className="result-label">{r.label}</span>
              <span className="result-hint">{r.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
