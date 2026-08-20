# Lead CRM

A powerful lead management system built with React for managing cold calling and email campaigns. Features local-first storage, AI-powered follow-ups, Claude integration, and a sales pipeline tracker.

## Features

- **Dual CRM** — Separate Call and Email lead management
- **Lead Import** — Import 100+ leads from Claude Code routines (JSON format)
- **Direct Routine Integration** — API connection to push leads directly from your routine
- **Nurture Tracking** — Log follow-ups, auto-generate templates with Claude AI
- **Sales Pipeline** — Visual funnel: New → Contacted → Qualified → Booked → Closed
- **AI Integration** — Claude-powered call scripts, email templates, lead suggestions
- **Local-First Storage** — Data saved to browser localStorage, cloud sync ready
- **Pro Design** — Claude orange (#ff6b35) + white/black/gray theme

## Quick Start

### 1. Install

```bash
cd crm
npm install
```

### 2. Run

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 3. (Optional) Set Up Cloud Sync

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ANTHROPIC_API_KEY=your_claude_api_key
VITE_COMPANY_MAILING_ADDRESS=your_business_mailing_address
```

`VITE_COMPANY_MAILING_ADDRESS` gets appended to outgoing email drafts — CAN-SPAM requires a valid physical postal address in every commercial email. Without it, the Email tab shows a warning instead of silently sending without one.

Works without these — local storage is the default.

### 4. Build

```bash
npm run build
```

Production files go to `dist/`.

## How to Use

### Import Leads

**CRM** → **Calls** or **Emails** → **+ Import Leads**

Upload JSON file with this structure:

```json
[
  {
    "business_name": "ABC Plumbing",
    "niche": "plumbing",
    "phone": "555-0123",
    "email": "info@abc.com",
    "email_draft": "Subject: Quick question for ABC Plumbing\n\nHi John, ...",
    "contact_name": "John",
    "priority_score": 4
  }
]
```

`email_draft` is optional — when present it shows up editable in the Lead Drawer's Email tab with a one-click "Send Email" button (opens Gmail pre-filled; you still hit Send yourself).

### Update Status

Click status dropdown to move leads: New → Contacted → Qualified → Booked → Closed

### Log Follow-ups

**Nurture** tab — select a lead, use AI templates, log messages, track replies

### View Pipeline

**Pipeline** tab — see all leads across 5 stages, conversion metrics, close rate

## Data Storage

- **Default** — localStorage (browser, stays private)
- **Cloud** (coming) — Syncs to Supabase when set up
- **Persistence** — Data lives locally forever, syncs on demand

## Tech Stack

- **Frontend** — React 18 + Vite
- **State** — Zustand
- **Storage** — localStorage + Supabase (optional)
- **AI** — Anthropic Claude API (hooks ready)
- **Styling** — Vanilla CSS (no dependencies)

## Project Structure

```
crm/
├── src/
│   ├── components/        # Auth, CRM, LeadGen, Nurture, Pipeline
│   ├── store.js           # Zustand state management
│   ├── App.jsx & App.css  # Main app + color scheme
│   └── index.css          # Global styles
├── .env.local            # Your API keys (create this)
├── package.json
└── vite.config.js
```

## Next Steps

1. Import your first batch of leads
2. Log a follow-up to test the flow
3. Check the pipeline to see leads in stages
4. (Optional) Add Supabase for cloud sync
5. (Optional) Add Claude API for AI features

## Color Palette

- **Orange** — #ff6b35 (Claude)
- **White** — #ffffff (background)
- **Black** — #000000 (text)
- **Gray** — #f5f5f5 to #999999 (UI)

## Questions?

This CRM is built to scale with your business. Start with manual imports, add API integration later, and enable Claude AI when ready. Everything saves locally — zero cloud lock-in.
