import { useState, useEffect } from 'react'
import {
  useLeadsStore,
  openVoicemailFollowUpText,
  voicemailFollowUpMessage,
  draftForLead,
  COMPANY_MAILING_ADDRESS,
} from '../store'
import { FORMATS } from '../emailDrafts'
import { scriptForLead, scriptText } from '../callScripts'
import CallResultModal from './CallResultModal'
import './LeadDrawer.css'

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'booked', 'closed']
const STATUS_LABELS = { new: 'New Lead', contacted: 'Contacted', qualified: 'Qualified', booked: 'Booked', closed: 'Closed Won' }

export default function LeadDrawer({ lead, type, onClose }) {
  const {
    updateCallLead, updateEmailLead, addNurtureLog, addTask, nurtureLogs,
    sendEmailDraft, markEmailReplied, markEmailOptedOut,
  } = useLeadsStore()
  const [tab, setTab] = useState('activity')
  const [noteText, setNoteText] = useState('')
  const [showCallResult, setShowCallResult] = useState(false)
  const [numberCopied, setNumberCopied] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [draftCopied, setDraftCopied] = useState(false)
  const [scriptCopied, setScriptCopied] = useState(false)

  useEffect(() => {
    setDraftText(lead?.email_draft || '')
  }, [lead?.id])

  const handleText = () => {
    openVoicemailFollowUpText(lead)
    setNumberCopied(true)
    setTimeout(() => setNumberCopied(false), 4000)
  }

  // tel: links hand off to Chrome's Android phone-linking prompt, which is a
  // dead end on iPhone (or any Chromebook without a paired Android phone) —
  // copy-to-clipboard for pasting into TextNow works everywhere instead.
  const [callCopied, setCallCopied] = useState(false)
  const handleCopyPhone = () => {
    if (!lead.phone) return
    navigator.clipboard?.writeText(lead.phone).catch(() => {})
    setCallCopied(true)
    setTimeout(() => setCallCopied(false), 2000)
  }

  if (!lead) return null

  const update = (updates) => {
    if (type === 'calls') updateCallLead(lead.id, updates)
    else updateEmailLead(lead.id, updates)
  }

  const logs = nurtureLogs.filter(l => l.leadId === lead.id)

  const handleAddNote = () => {
    if (!noteText.trim()) return
    addNurtureLog({ leadId: lead.id, leadType: type, message: noteText, type: 'note' })
    setNoteText('')
  }

  const handleStatusChange = (status) => {
    update({ status, lastContact: new Date().toLocaleString() })
    addNurtureLog({ leadId: lead.id, leadType: type, message: `Status changed to ${STATUS_LABELS[status]}`, type: 'status' })
  }

  // Generates the draft the moment the Email tab is opened for a lead that
  // doesn't have one yet, and saves it so it doesn't regenerate on every click.
  const handleTabClick = (t) => {
    setTab(t)
    if (t === 'email' && !lead.email_draft) {
      const { draft, format } = draftForLead(lead)
      setDraftText(draft)
      update({ email_draft: draft, emailFormat: format.id })
    }
  }

  const draftFormat = FORMATS.find(f => f.id === lead.emailFormat)

  const handleSendEmail = () => {
    if (!draftText.trim() || lead.optedOut) return
    sendEmailDraft(lead, type, draftText)
    setDraftCopied(true)
    setTimeout(() => setDraftCopied(false), 6000)
  }

  const tabs = lead.email
    ? ['activity', 'script', 'email', 'notes', 'info']
    : ['activity', 'script', 'notes', 'info']
  const TAB_LABELS = { activity: 'Activity', script: 'Script', email: 'Email', notes: 'Notes', info: 'Information' }

  const script = scriptForLead(lead)

  const handleCopyScript = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(scriptText(lead)).catch(() => {})
    }
    setScriptCopied(true)
    setTimeout(() => setScriptCopied(false), 4000)
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div className="drawer-title-row">
            <h2>{lead.business_name}</h2>
            <button className="drawer-close" onClick={onClose}>×</button>
          </div>
          <div className="drawer-badges">
            <span className={`badge badge-${lead.status || 'new'}`}>{STATUS_LABELS[lead.status] || 'New Lead'}</span>
            {lead.optedOut && <span className="badge badge-optedout">Opted Out</span>}
            {lead.repliedAt && <span className="badge badge-replied">Replied</span>}
            {!lead.repliedAt && lead.emailSentAt && <span className="badge badge-sent">Email Sent</span>}
            {lead.niche && <span className="drawer-niche">{lead.niche}</span>}
            {lead.priority_score != null && <span className="drawer-niche">Priority {lead.priority_score}</span>}
          </div>

          <div className="drawer-meta">
            {lead.contact_name && <MetaRow label="Contact" value={lead.contact_name} />}
            {lead.phone && <MetaRow label="Phone" value={lead.phone} />}
            <MetaRow
              label="Email"
              value={lead.email
                ? <a href={`mailto:${lead.email}`}>✓ {lead.email}</a>
                : <span className="meta-no-email">✗ No email available</span>}
            />
            {lead.website && <MetaRow label="Website" value={<a href={lead.website} target="_blank" rel="noreferrer">{lead.website.replace(/^https?:\/\//, '')}</a>} />}
            {lead.city && <MetaRow label="Location" value={`${lead.city}${lead.state ? ', ' + lead.state : ''}`} />}
            {lead.pitch_angle && <MetaRow label="Pitch" value={lead.pitch_angle} />}
            {lead.rating != null && <MetaRow label="Rating" value={`${lead.rating} ★ (${lead.review_count || 0} reviews)`} />}
          </div>

          <div className="drawer-actions">
            {lead.phone && <button className="btn" onClick={handleCopyPhone}>{callCopied ? 'Copied' : 'Copy Number'}</button>}
            {lead.phone && <button className="btn btn-ghost" onClick={() => setShowCallResult(true)}>Log Result</button>}
            {lead.phone && <button className="btn btn-ghost" onClick={handleText}>Text</button>}
            {lead.email && <a className="btn btn-ghost" href={`mailto:${lead.email}`}>Email</a>}
            <button
              className="btn btn-ghost"
              onClick={() => addTask({
                leadId: lead.id,
                leadType: type,
                title: `Follow up with ${lead.business_name}`,
                type: 'call',
                priority: 'medium',
                dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              })}
            >
              + Task
            </button>
            <select
              className="drawer-status-select"
              value={lead.status || 'new'}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {numberCopied && (
            <div className="text-helper">
              <div className="text-helper-row">
                <strong>✓ Number copied</strong> — paste it into Google Voice's "To" field.
              </div>
              <div className="text-helper-message">{voicemailFollowUpMessage(lead)}</div>
            </div>
          )}
        </div>

        <div className="drawer-tabs">
          {tabs.map(t => (
            <button
              key={t}
              className={`drawer-tab ${tab === t ? 'active' : ''}`}
              onClick={() => handleTabClick(t)}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="drawer-body">
          {tab === 'script' && (
            <div className="script-panel">
              <p className="script-panel-hint">
                Auto-generated for {lead.business_name} from its niche and pitch angle. The opener stays fixed on every call — that's the 7-second trust bridge — everything below it is personalized.
              </p>
              <ScriptBlock label="Opener" text={script.opener} />
              <ScriptBlock label="Credibility" text={script.credibility} />
              <ScriptBlock label="Leading Question" text={script.leadingQ} />
              {script.problemAck && <ScriptBlock label="Problem Ack" text={script.problemAck} />}
              <ScriptBlock label="Problem" text={script.problem} />
              <ScriptBlock label="Solution" text={script.solution} />
              {script.freeDemo && <ScriptBlock label="Free Demo" text={script.freeDemo} />}
              <ScriptBlock label="Call to Action" text={script.cta} />
              {script.offerCtaNote && <p className="script-panel-hint">{script.offerCtaNote}</p>}
              <div className="script-block">
                <span className="script-label">Objections</span>
                <div className="script-objections">
                  {script.objections.map((o) => (
                    <div className="script-objection" key={o.q}>
                      <div className="script-objection-q">"{o.q}"</div>
                      <div className="script-objection-a">{o.a}</div>
                    </div>
                  ))}
                </div>
              </div>
              <ScriptBlock label="Close" text={script.close} />
              <ScriptBlock label="Voicemail / Pattern-Interrupt" text={script.voicemail} />
              <div className="script-panel-actions">
                <button className="btn" onClick={handleCopyScript}>
                  {scriptCopied ? 'Copied!' : 'Copy Script'}
                </button>
              </div>
            </div>
          )}

          {tab === 'email' && (
            <div className="email-panel">
              {!COMPANY_MAILING_ADDRESS && (
                <div className="compliance-warning">
                  CAN-SPAM requires a valid physical postal address in every commercial email — none is configured yet. Set <code>VITE_COMPANY_MAILING_ADDRESS</code> and it'll be added to drafts automatically; until then, add one manually before sending.
                </div>
              )}
              {draftFormat && (
                <div className="email-sent-note">
                  Format: <strong>{draftFormat.name}</strong> ({draftFormat.structure}) · {draftFormat.wordRange}
                </div>
              )}
              {lead.emailSentAt && (
                <div className="email-sent-note">
                  ✓ Sent {new Date(lead.emailSentAt).toLocaleString()}
                  {lead.repliedAt && ` — replied ${new Date(lead.repliedAt).toLocaleString()}`}
                </div>
              )}
              {draftCopied && (
                <div className="email-sent-note">
                  ✓ Draft copied — Gmail opened in a new tab addressed to this lead. Paste the draft into the subject/body, then hit Send over there.
                </div>
              )}
              <textarea
                rows={12}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Generating draft…"
              />
              <div className="email-panel-actions">
                <button className="btn" disabled={!draftText.trim() || lead.optedOut} onClick={handleSendEmail}>
                  {lead.emailSentAt ? 'Resend Email' : 'Send Email'}
                </button>
                {lead.emailSentAt && !lead.repliedAt && (
                  <button className="btn btn-ghost" onClick={() => markEmailReplied(lead, type)}>Mark Replied</button>
                )}
                {!lead.optedOut && (
                  <button className="btn btn-ghost" onClick={() => markEmailOptedOut(lead, type)}>Mark Opted Out</button>
                )}
              </div>
              <p className="email-panel-hint">
                Auto-generated from this lead's pitch angle, arranged in one of 4 tested formats (assigned per-lead so results are comparable) — edit as needed, then Send opens Gmail addressed to this lead in a new tab and copies the draft to your clipboard. Paste it in over there, then send it yourself.
              </p>
            </div>
          )}

          {tab === 'activity' && (
            <div className="timeline">
              {logs.length === 0 && (
                <div className="drawer-empty">No activity yet. Calls, notes, and status changes will show up here.</div>
              )}
              {[...logs].reverse().map(log => (
                <div className="timeline-item" key={log.id}>
                  <div className={`timeline-dot ${log.type}`} />
                  <div className="timeline-content">
                    <div className="timeline-message">{log.message}</div>
                    <div className="timeline-time">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {lead.notes && (
                <div className="timeline-item">
                  <div className="timeline-dot note" />
                  <div className="timeline-content">
                    <div className="timeline-message">{lead.notes}</div>
                    <div className="timeline-time">From lead import</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div className="notes-panel">
              <textarea
                rows={4}
                placeholder="Write a note about this lead…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button className="btn" onClick={handleAddNote}>Add Note</button>
              <div className="notes-list">
                {[...logs].reverse().filter(l => l.type === 'note').map(log => (
                  <div className="note-item" key={log.id}>
                    <div>{log.message}</div>
                    <div className="timeline-time">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'info' && (
            <div className="info-grid">
              {Object.entries(lead)
                .filter(([k]) => !['id', 'status'].includes(k))
                .map(([k, v]) => (
                  <div className="info-row" key={k}>
                    <span className="info-key">{k.replace(/_/g, ' ')}</span>
                    <span className="info-val">{String(v)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {showCallResult && (
        <CallResultModal
          lead={lead}
          leadType={type}
          onClose={() => setShowCallResult(false)}
        />
      )}
    </>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  )
}

function ScriptBlock({ label, text }) {
  return (
    <div className="script-block">
      <span className="script-label">{label}</span>
      <p className="script-text">{text}</p>
    </div>
  )
}
