import { useState } from 'react'
import { useLeadsStore } from '../store'
import './CallResultModal.css'

const RESULTS = [
  { key: 'no_answer', label: 'No Answer / Left Voicemail', hint: 'Opens a text follow-up + creates a task for tomorrow' },
  { key: 'interested', label: 'Interested', hint: 'Moves to Contacted' },
  { key: 'qualified', label: 'Qualified', hint: 'Moves to Qualified' },
  { key: 'booked', label: 'Meeting Booked', hint: 'Moves to Booked' },
  { key: 'won', label: 'Won', hint: 'Moves to Closed Won' },
  { key: 'not_interested', label: 'Not Interested', hint: 'Logs the outcome only' },
]

export default function CallResultModal({ lead, leadType, onClose }) {
  const { logCallResult, sendInstantlyDraft, addNurtureLog } = useLeadsStore()
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState(null)

  const pick = (result) => {
    logCallResult(lead, leadType, result)
    onClose()
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    setEmailError(null)
    try {
      await sendInstantlyDraft(lead)
      setEmailSent(true)
      addNurtureLog({
        leadId: lead.id,
        leadType,
        message: 'Automated email draft sent via Instantly',
        type: 'note',
      })
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setEmailError(err.message)
    } finally {
      setSendingEmail(false)
    }
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

        <div className="result-divider" />

        <div className="result-email-section">
          <h4>Send automated email draft</h4>
          {lead.email ? (
            <>
              <p className="result-email-to">To: {lead.email}</p>
              {emailSent && <p className="result-success">✓ Email draft sent! Closing...</p>}
              {emailError && <p className="result-error">Error: {emailError}</p>}
              <button
                className="btn"
                onClick={handleSendEmail}
                disabled={sendingEmail || emailSent}
              >
                {sendingEmail ? 'Sending...' : emailSent ? 'Sent!' : 'Send Email Draft'}
              </button>
            </>
          ) : (
            <p className="result-no-email">No email on file for this lead</p>
          )}
        </div>
      </div>
    </div>
  )
}
