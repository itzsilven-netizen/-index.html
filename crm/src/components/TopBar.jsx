import { useState, useRef, useEffect } from 'react'
import { useLeadsStore } from '../store'
import './TopBar.css'

export default function TopBar({ onOpenLead, onQuickAdd, onMenuClick }) {
  const { callLeads, emailLeads } = useLeadsStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [])

  const q = query.trim().toLowerCase()
  const matches = q.length < 2 ? [] : [
    ...callLeads.map(l => ({ ...l, _type: 'calls' })),
    ...emailLeads.map(l => ({ ...l, _type: 'emails' })),
  ].filter(l =>
    (l.business_name || '').toLowerCase().includes(q) ||
    (l.contact_name || '').toLowerCase().includes(q) ||
    (l.phone || '').toLowerCase().includes(q) ||
    (l.email || '').toLowerCase().includes(q) ||
    (l.notes || '').toLowerCase().includes(q)
  ).slice(0, 8)

  const pick = (lead) => {
    setOpen(false)
    setQuery('')
    onOpenLead(lead)
  }

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
      </button>
      <div className="topbar-search" ref={wrapRef}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="search-icon">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search leads, phone numbers, companies…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        <kbd className="search-kbd">⌘K</kbd>

        {open && matches.length > 0 && (
          <div className="search-results">
            <div className="search-results-label">Leads</div>
            {matches.map(lead => (
              <button key={`${lead._type}-${lead.id}`} className="search-result" onClick={() => pick(lead)}>
                <span className="result-name">{lead.business_name}</span>
                <span className="result-meta">
                  {lead.contact_name || lead.phone || lead.email || lead.niche}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="btn btn-outline-accent" onClick={onQuickAdd}>+ Add Lead</button>
      </div>
    </header>
  )
}
