# CRM → Instantly sync

Replaces pressing "send" on each lead in the CRM one at a time. Pulls leads
from the Casava CRM and pushes a batch straight into an Instantly campaign,
tracking what's already been pushed so re-running never double-sends.

## One-time setup

1. **Get your Instantly API key**: Instantly dashboard → Settings →
   Integrations → API Keys.
2. **Get your campaign ID**: open the campaign in Instantly, the ID is in
   the URL (`app.instantly.ai/app/campaign/<CAMPAIGN_ID>`), or list
   campaigns via the API.
3. **Build the sequence template in Instantly's UI** (this script does not
   write email copy). Use these variables in the template — the script
   fills them in per lead:
   - `{{company_name}}`
   - `{{niche}}`
   - `{{city_state}}`
   - `{{value_prop}}` — one-line reason tied to the product this lead was
     matched to (e.g. "so calls never go to voicemail" for AI Receptionist)
   - `{{pitch_angle}}` — the raw product name, if you want it directly
   - `{{notes}}` — the qualifying signal the scrape found (e.g. "no chat
     widget, 34 reviews")

4. Set env vars (don't commit these):
   ```
   export INSTANTLY_API_KEY=...
   export INSTANTLY_CAMPAIGN_ID=...
   ```

## Running the ramp

```
python3 sync.py --limit 25            # day 1
python3 sync.py --limit 50            # day 2
python3 sync.py --limit 100           # Friday onward
```

Add `--dry-run` to preview a batch without pushing anything to Instantly —
useful to sanity-check before the first real run, or any time you want to
see what the next batch looks like.

Each run only pushes leads that haven't been pushed before (tracked in
`state/synced_leads.json`, sorted by CRM priority score so the strongest
leads go out first) — safe to re-run the same command daily without
worrying about duplicates.

## What this does NOT do yet

- Doesn't mark a lead's status back in the CRM once emailed — the CRM has
  no update endpoint for that today (confirmed: only `GET /api/leads` and
  `POST /api/import-leads` exist). `state/synced_leads.json` is the only
  record of what's been sent; keep it committed so it survives between
  sessions.
- Doesn't write the email copy — that's the Instantly sequence template,
  built once in their UI using the variables above.
- Doesn't touch SMS or calls — this is the email leg only.

## Verify before the first real send

Instantly's exact API request shape can drift from what's implemented
here (endpoint `POST https://api.instantly.ai/api/v2/leads`, `campaign` +
`custom_variables` fields). Run `--dry-run` first, then push a batch of 1–2
real leads and confirm they land correctly in the Instantly campaign
before trusting it with a full 25/50/100 batch.
