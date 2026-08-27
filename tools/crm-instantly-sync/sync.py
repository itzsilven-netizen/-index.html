#!/usr/bin/env python3
"""
Push CRM leads into an Instantly campaign, ramping daily volume.

Reads leads from the Casava CRM, skips leads already pushed (tracked in
state/synced_leads.json), and adds the next batch to an Instantly campaign
via the Instantly v2 API. This replaces manually pressing "send" per lead
in the CRM.

Usage:
    export INSTANTLY_API_KEY=...
    export INSTANTLY_CAMPAIGN_ID=...
    python3 sync.py --limit 25            # push the next 25 unsynced leads
    python3 sync.py --limit 50 --dry-run  # preview without pushing anything

Ramp schedule (adjust --limit to match the day):
    Day 1: --limit 25
    Day 2: --limit 50
    Friday onward: --limit 100

Env vars:
    CRM_API_BASE           default https://lead-crm-api-1lw1.onrender.com
    INSTANTLY_API_KEY      required unless --dry-run
    INSTANTLY_CAMPAIGN_ID  required unless --dry-run

Verify the Instantly request shape (endpoint/field names) against Instantly's
current v2 API docs before the first real run — API details can drift.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

CRM_API_BASE = os.environ.get("CRM_API_BASE", "https://lead-crm-api-1lw1.onrender.com")
INSTANTLY_API_KEY = os.environ.get("INSTANTLY_API_KEY", "")
INSTANTLY_CAMPAIGN_ID = os.environ.get("INSTANTLY_CAMPAIGN_ID", "05b11c0b-5c35-4419-a0e4-0dc050dacafe")
INSTANTLY_LEADS_URL = "https://api.instantly.ai/api/v2/leads"

STATE_PATH = Path(__file__).parent / "state" / "synced_leads.json"

# One-liner per product, filled into the {{value_prop}} variable in the
# Instantly sequence template. Extend this if new pitch_angle values show
# up in the CRM that aren't listed here yet.
VALUE_PROPS = {
    "AI Receptionist": "so calls never go to voicemail",
    "Lead Follow-Up AI": "so new leads get followed up in seconds, not days",
    "AI SMS Sales Chat": "so texts get answered instantly, day or night",
    "Appointment Reminders": "that cuts down no-shows automatically",
    "Review Automation": "that gets you more Google reviews on autopilot",
    "Client Reactivation": "that brings old customers back without you lifting a finger",
    "Website Chatbot": "that catches leads on your site instead of losing them to silence",
    "Website": "that actually converts visitors instead of just sitting there",
    "Facebook Ads Management": "profitable Facebook ads, managed hands-off",
    "Custom Automation": "that automates whatever's eating your time",
}
DEFAULT_VALUE_PROP = "that gets you more customers on autopilot"


def load_state() -> set:
    if STATE_PATH.exists():
        return set(json.loads(STATE_PATH.read_text()).get("synced_ids", []))
    return set()


def save_state(synced_ids: set) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps({"synced_ids": sorted(synced_ids)}, indent=2))


def fetch_crm_leads() -> list:
    with urllib.request.urlopen(f"{CRM_API_BASE}/api/leads", timeout=30) as r:
        data = json.loads(r.read())
    return data.get("calls", [])


def push_to_instantly(lead: dict) -> dict:
    value_prop = VALUE_PROPS.get(lead.get("pitch_angle"), DEFAULT_VALUE_PROP)
    payload = {
        "campaign": INSTANTLY_CAMPAIGN_ID,
        "email": lead["email"],
        "company_name": lead.get("business_name", ""),
        "custom_variables": {
            # Duplicated here (not just the top-level field above) so the
            # {{company_name}} merge tag resolves in Instantly's editor —
            # top-level fields don't always register as custom-variable
            # merge tags the way keys inside custom_variables do.
            "company_name": lead.get("business_name", ""),
            "niche": lead.get("niche", ""),
            "city_state": f"{lead.get('city', '')}, {lead.get('state', '')}".strip(", "),
            "value_prop": value_prop,
            "pitch_angle": lead.get("pitch_angle", ""),
            "notes": lead.get("notes", ""),
        },
        "skip_if_in_workspace": True,
    }
    req = urllib.request.Request(
        INSTANTLY_LEADS_URL,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {INSTANTLY_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            # Default urllib User-Agent gets fingerprint-blocked (Cloudflare
            # error 1010) before it reaches Instantly's API logic.
            "User-Agent": "Mozilla/5.0 (compatible; crm-instantly-sync/1.0)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, default=25, help="how many new leads to push this run")
    ap.add_argument("--dry-run", action="store_true", help="preview without calling Instantly")
    args = ap.parse_args()

    if not args.dry_run and (not INSTANTLY_API_KEY or not INSTANTLY_CAMPAIGN_ID):
        sys.exit("Set INSTANTLY_API_KEY and INSTANTLY_CAMPAIGN_ID (or pass --dry-run).")

    synced = load_state()
    leads = fetch_crm_leads()

    candidates = [lead for lead in leads if lead.get("email") and lead["id"] not in synced]
    candidates.sort(key=lambda lead: lead.get("priority_score", 0), reverse=True)
    batch = candidates[: args.limit]

    print(f"CRM has {len(leads)} leads, {len(candidates)} unsynced with a usable email.")
    print(f"Pushing {len(batch)} this run (limit {args.limit}).\n")

    pushed = 0
    for lead in batch:
        if args.dry_run:
            print(
                f"[dry-run] would push #{lead['id']} {lead['business_name']} "
                f"<{lead['email']}> — {lead.get('pitch_angle')}"
            )
            continue
        try:
            push_to_instantly(lead)
            synced.add(lead["id"])
            pushed += 1
            print(f"pushed #{lead['id']} {lead['business_name']} <{lead['email']}>")
        except urllib.error.HTTPError as e:
            print(f"FAILED #{lead['id']} {lead['business_name']}: HTTP {e.code} {e.read().decode()[:200]}")
        except Exception as e:
            print(f"FAILED #{lead['id']} {lead['business_name']}: {e}")

    if not args.dry_run:
        save_state(synced)
        print(f"\nDone. {pushed}/{len(batch)} pushed. State saved to {STATE_PATH}.")


if __name__ == "__main__":
    main()
