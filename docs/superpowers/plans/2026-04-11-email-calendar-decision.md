# Email & Calendar — Architecture Decision

**Date:** 11 April 2026
**Author:** Jarvis
**Status:** Decision memo for David's approval
**Decision-makers:** David

## Summary

Two decisions, both big simplifications on what I proposed earlier:

1. **Email:** every school gets a dedicated `<slug>@schoolgle.co.uk` address provisioned automatically on signup. Inbound via AWS SES + S3 + Lambda. Outbound via AWS SES from the same address. Ed is the intelligence layer above the mailbox. **~31p per school per month at 100 schools.**

2. **Calendar:** Schoolgle is the source of truth. We build our own calendar. Schools can subscribe to OUR calendar as iCal in their existing Google/Outlook/Apple calendar. We accept iCal feeds for term dates and anything they want us to know about. **Zero OAuth. Zero Microsoft vs Google politics.**

Both decisions favour "one system we control" over "integrations with everyone else".

---

## Email — the plan

### 1.1 The naming

Every school signs up with a slug (e.g. `grove-house`). Their dedicated address is:

```
grove-house@schoolgle.co.uk
```

Or, if we want Ed to be the named sender (my preference — it's part of the brand):

```
ed@grove-house.schoolgle.co.uk
```

The second form uses subdomain-per-school, which is also possible with SES but needs one DNS record per school. **Recommendation: go with the flat form first (`grove-house@schoolgle.co.uk`) because it's zero DNS config per school — provision is just a database row.**

Ed's identity is in the friendly name and signature:
- From: `Ed — Grove House Primary School <grove-house@schoolgle.co.uk>`
- Signature block clarifies: *"Sent on behalf of Grove House Primary School via Schoolgle. Reply to this email to respond."*

No impersonation concern — the school owns this address as part of the platform.

### 1.2 The infrastructure

**Inbound:**
- AWS SES receive rule: catch-all on `*@schoolgle.co.uk`
- Every inbound email lands in an S3 bucket
- S3 event triggers a Lambda
- Lambda:
  - Parses the recipient → extracts the school slug
  - Looks up the org in Supabase
  - Parses the email (headers, body, attachments) via `mailparser`
  - Extracts attachments → uploads to `estates-documents` / `estates-images` bucket
  - Creates a `document_inbox_items` row with the parsed content
  - Sends a webhook to the Schoolgle API so the UI gets a live notification
- Total latency: ~1-2 seconds from email hitting SES to showing in the school's inbox

**Outbound:**
- SES verified domain: `schoolgle.co.uk` (one-time DNS setup: TXT + DKIM CNAMEs)
- Any address under that domain can send without individual verification
- API: `POST /api/email/send` with `from_school_id`, `to`, `subject`, `body` — the From header is set from the org's slug automatically
- Reply-to is the same address so replies come back through inbound
- Bounce / complaint handling via SNS topic → Lambda → update our record

**DNS setup for schoolgle.co.uk (one-time):**
```
MX      schoolgle.co.uk       →  inbound-smtp.eu-west-2.amazonaws.com
TXT     schoolgle.co.uk       →  "v=spf1 include:amazonses.com ~all"
CNAME   <dkim1>._domainkey   →  <aws-provided>
CNAME   <dkim2>._domainkey   →  <aws-provided>
CNAME   <dkim3>._domainkey   →  <aws-provided>
TXT     _dmarc                →  "v=DMARC1; p=none; rua=mailto:dmarc@schoolgle.co.uk"
```

That's it. Once these records are in, every school that signs up immediately has a working inbox with no DNS work.

### 1.3 Cost at scale

Rough estimate based on a busy school:

| Activity | Per school / month | Notes |
|----------|-------------------|-------|
| Inbound emails | 300 | contractor replies, forwarded quotes, invoices, supplier newsletters |
| Outbound emails | 100 | Ed-drafted replies, reminders, governor reports, parent comms |
| Attachments processed | ~200 | most emails have attachments |
| S3 storage | ~500 MB | attachments accumulate but we can archive after 1y |

**AWS SES pricing (eu-west-2, April 2026):**
- Inbound: $0.10 per 1,000 messages + $0.09 per 1,000 attached messages
- Outbound: $0.10 per 1,000 messages
- S3: $0.023 per GB-month
- Lambda: $0.20 per 1M requests + $0.0000166667 per GB-second

**At 100 schools:**
- Inbound: 30,000 × $0.0001 = $3
- Outbound: 10,000 × $0.0001 = $1
- S3: 50 GB × $0.023 = $1.15
- Lambda: ~40,000 invocations × negligible = ~$0.50
- **Total: ~$5.65/month = 5.6p per school/month**

**At 1,000 schools:**
- Inbound: $30 + Outbound: $10 + S3: $12 + Lambda: $5 = **~$57/month = 5.7p per school/month**

**At 10,000 schools:**
- $570/month = same per-school rate. Linear scaling.

SES has a sending quota of 50,000 emails/day once out of sandbox — fine for our volume.

Compared to alternatives:
- **Postmark**: ~$150/month at 100 schools — 26× more expensive, but gorgeous inbound webhooks
- **Google Workspace** (per-school mailbox): ~£3/school/month = £300/month at 100 schools — 50× more expensive
- **Cloudflare Email Routing**: free inbound but doesn't support outbound. Would need to combine with SES for sending anyway.

**AWS SES wins on cost at any scale.**

### 1.4 How inbound routing works

When `grove-house@schoolgle.co.uk` receives an email, the Lambda runs this logic:

```
1. Parse recipient → org_slug = "grove-house"
2. Look up organization by slug → organizationId
3. Parse sender email address
4. Classify the sender:
   a) If sender domain matches the organization's domain (@groveHousePrimary.school.uk) → "internal"
   b) If sender matches a known contractor email in estates_contractors → "contractor"
   c) Otherwise → "external_unknown"
5. Parse subject line for workflow reference markers (e.g. "Ref: WF-00042")
6. If workflow reference found → attach document to that workflow
7. If not but sender is a known contractor → attach to most recent workflow involving them
8. If not → create a document_inbox_items row with status=needs_review
9. For each attachment:
   - Upload to S3 (estates-documents or estates-images by MIME type)
   - Create a secondary inbox item linked to the email
   - Run AI classifier (Gemini) to identify invoice/quote/report/certificate/photo/etc
10. If all items auto-routed with high confidence (>0.85) → mark email as "processed"
11. If anything needs review → push a notification to the SBM's Schoolgle inbox
```

The Lambda writes back into Supabase via the service role key — no API round-trip needed. Latency stays under 2s.

### 1.5 How outbound works (the Ed drafting flow)

1. User tells Ed: "the boiler needs fixing, get me 3 quotes"
2. Ed uses `find_contractors` skill → 3 contractors selected
3. Ed uses `draft_email` skill → generates a proposal with:
   - `to`: list of selected contractors
   - `subject`: "Quote request — Vaillant ecoTEC Pro 38 boiler service — ref WF-00042"
   - `body`: pre-filled with the fault, service report attachment, deadline, contact details
   - `attachments`: [original inspection report PDF, photos]
4. User reviews the proposal in the Ed widget
5. User clicks Approve → Ed calls `POST /api/email/send` with the proposal
6. Backend:
   - Resolves the org's slug → `grove-house@schoolgle.co.uk`
   - Constructs the `From` header: `Ed — Grove House Primary School <grove-house@schoolgle.co.uk>`
   - Adds the workflow reference to the subject (`[WF-00042]`) and a message header (`X-Schoolgle-Workflow: uuid`)
   - Uploads attachments via SES SendRawEmail
   - SES sends via DKIM-signed outbound IP
7. Event logged to the workflow timeline: "Email sent to BluePlumb Ltd requesting quote — ref WF-00042"
8. If the contractor replies, the Lambda parses the `In-Reply-To` header, matches the workflow via `X-Schoolgle-Workflow`, attaches the reply to the same workflow

End-to-end: Ed drafts, user approves, email goes out, reply comes back, everything logs to the same workflow timeline. No external integration needed. No user configuration.

### 1.6 Manual forwarding (day-1 fallback)

Even if the user doesn't use Ed for outbound, they can forward any email from their own mailbox to `grove-house@schoolgle.co.uk`. The same inbound Lambda processes it:

- Sender identified as "internal" (from the school's own domain)
- Body parsed for forwarded content (`---Original Message---` separator)
- Attachments extracted
- Filed in the Document Inbox

Zero user configuration, zero OAuth. Works day 1 for every school the moment they have their address.

### 1.7 Provisioning process for a new school

When a new organisation signs up:

1. Generate a URL-safe slug from the school name: `Grove House Primary School` → `grove-house`
2. Check uniqueness against existing orgs — append a number if taken (`grove-house-2`)
3. Store `email_slug` on the `organizations` row
4. Email address is now live — no DNS config, no SES rule, no Lambda deploy
5. Welcome email sent to the SBM:
   - "Your Schoolgle email address is **grove-house@schoolgle.co.uk** — share it with your contractors, forward invoices to it, or use the Schoolgle app to have Ed draft and send on your behalf."
6. The signup flow asks: "Would you like us to email your first 5 contractors introducing your new Schoolgle address?" → optional courtesy

**Time from signup to working inbox: under 10 seconds.**

### 1.8 What we need to build

| # | Item | Effort |
|---|------|--------|
| 1 | Domain DNS setup + SES verification | 1 hour (one-time) |
| 2 | SES catch-all receive rule → S3 | 1 hour |
| 3 | Lambda: parse inbound emails + route to document_inbox_items | 3-4 days |
| 4 | Outbound sender helper (`sendEmailFromOrg`) | 1 day |
| 5 | Ed skill: `draft_email` (PROPOSE flow) | 1 day |
| 6 | Ed skill: `send_approved_email` | 0.5 day |
| 7 | Organization slug column + provisioning hook | 0.5 day |
| 8 | Welcome email on signup | 0.5 day |
| 9 | Email timeline card on workflow detail page | 1 day |
| 10 | Bounce / complaint handling webhook | 0.5 day |

**Total: ~10 working days.** Significantly less than the 2 weeks I'd budgeted for email integration in the workflow engine plan because we're avoiding OAuth entirely.

---

## Calendar — the plan

### 2.1 The principle

We are NOT building a calendar integration with Google and Microsoft. We're building our own calendar, and schools interoperate with it via the standard iCal protocol in both directions.

### 2.2 How it works

**Schoolgle is the source of truth for estates-related events:**
- Contractor visits (scheduled service calls)
- Compliance check deadlines (weekly fire alarm test, monthly legionella flush)
- Asset inspections
- Routine maintenance windows
- Delivery of ordered equipment

These are all in our own `estates_calendar_events` table. Schools see them in our calendar UI.

**Schools publish our calendar into their existing calendar app:**
- Every organisation gets a unique read-only iCal URL: `https://app.schoolgle.co.uk/api/calendar/<slug>.ics`
- Secured with a per-school token in the path so it's not publicly guessable
- Schools paste this URL into Google Calendar / Outlook / Apple Calendar as a subscription
- Our calendar shows up alongside their normal calendars — "Schoolgle Estates"
- Auto-refreshes every 30-60 minutes depending on the client
- Read-only — they can't edit our events from their calendar, they come back to Schoolgle to change things

**Schools can feed their calendar INTO ours (optional):**
- If the school wants us to know about term dates, inset days, school closures, governor meetings, etc, they can give us an iCal subscription URL
- We poll it once a day and import the events as read-only overlay events
- Used for context: "the caretaker can't be there Thursday because it's half term"
- Doesn't mix into our estates scheduling data — it's a separate layer

### 2.3 What each user sees

**Caretaker (Brian):**
- Today's list — opens the mobile app, sees "Fire alarm test (weekly) — 9:00am" and "BluePlumb arriving to service boiler — 2:00pm"
- Gets a push notification 15 min before each event
- Can mark events complete with photos

**SBM (Sandra):**
- Monthly calendar view — sees every contractor booking, compliance deadline, delivery window
- Clicks any event to get the workflow it came from
- Can drag events to reschedule (if not yet completed)

**Head (Hannah):**
- Just subscribes to the iCal URL in her personal Google Calendar
- Her normal calendar now has a "Schoolgle Estates" layer showing upcoming estates events in amber
- Knows what's happening without opening Schoolgle

**Contractor (external):**
- Gets an iCal attachment in their quote confirmation email (`booking.ics`)
- Drags it into their own calendar — no login needed

### 2.4 Data model

```sql
CREATE TABLE estates_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Core event fields (iCal-compatible)
  uid TEXT NOT NULL,                    -- iCal UID — stable across updates
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'Europe/London',

  -- Categorisation
  event_type TEXT NOT NULL,             -- 'contractor_visit' | 'compliance_deadline' | 'inspection' | 'delivery' | 'maintenance_window' | 'imported_overlay'
  category TEXT,                         -- 'gas' | 'fire' | 'legionella' | 'electrical' | 'general'

  -- Links to other entities (the calendar is a cross-module view)
  workflow_id UUID,
  asset_id UUID REFERENCES estates_assets(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES estates_contractors(id) ON DELETE SET NULL,
  task_id UUID REFERENCES estates_compliance_tasks(id) ON DELETE SET NULL,
  service_record_id UUID,

  -- Attendees (for contractor visits)
  attendees JSONB,                       -- [{ name, email, role }]

  -- Reminder rules
  reminder_minutes INTEGER,              -- send push this many mins before

  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('tentative', 'confirmed', 'cancelled', 'completed')),

  -- Import overlay metadata
  imported_from_url TEXT,                -- if this came from an external iCal subscription
  imported_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE estates_calendar_subscriptions (
  -- Schools subscribing external iCal URLs INTO Schoolgle
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,                    -- "Term Dates from Bradford Council"
  url TEXT NOT NULL,                     -- the iCal URL we poll
  last_polled_at TIMESTAMPTZ,
  last_poll_status TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_ical_tokens (
  -- Per-school secret for the outbound iCal URL
  organization_id UUID PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,            -- random 32-char token
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ
);
```

### 2.5 Outbound iCal endpoint

```
GET /api/calendar/<slug>/<token>.ics
```

- No auth header required (the token IS the auth)
- Returns `text/calendar` content
- Generated on-demand from `estates_calendar_events` for the matching org
- Cached at CDN edge for 10 minutes to reduce load
- iCal format includes: VEVENT per row, alarms (VALARM), categories for colour coding, free/busy markers

### 2.6 Provisioning

When a new school signs up:
1. Generate a random 32-char token
2. Store in `organization_ical_tokens`
3. The SBM's welcome email includes: "Subscribe to your Schoolgle calendar — paste this URL into Google Calendar / Outlook / Apple Calendar: `https://app.schoolgle.co.uk/api/calendar/grove-house/abc123...ics`"
4. Works immediately in any calendar client

### 2.7 What we need to build

| # | Item | Effort |
|---|------|--------|
| 1 | `estates_calendar_events` migration | 0.5 day |
| 2 | `estates_calendar_subscriptions` migration | 0.5 day |
| 3 | `organization_ical_tokens` migration | 0.5 day |
| 4 | Outbound iCal endpoint (`.ics` generator) | 1 day |
| 5 | Inbound iCal subscription poller (daily cron) | 1 day |
| 6 | Calendar UI: month / week / agenda views | 3-4 days |
| 7 | Event create / edit form | 1-2 days |
| 8 | Push notifications for upcoming events (optional Phase 2) | 2 days |
| 9 | Seed: auto-create compliance deadline events from provisioned checks | 1 day |

**Total: ~10 working days** for the full calendar with iCal interop in both directions.

### 2.8 What we explicitly don't build

- Google Calendar OAuth integration
- Microsoft Graph Calendar OAuth integration
- Two-way sync with any external calendar
- CalDAV server

The `.ics` subscription model covers 95% of the need with 10% of the complexity.

---

## 3. Combined timeline

| Phase | Duration | Items |
|-------|----------|-------|
| **Phase 1 — Email core** | 2 weeks | DNS + SES setup, inbound Lambda, outbound sender helper, Ed drafting skills, org slug, Document Inbox wiring |
| **Phase 2 — Calendar core** | 2 weeks | Tables, iCal endpoint, subscription poller, month/week/agenda UI, create/edit form |
| **Phase 3 — Polish** | 1 week | Welcome emails on signup, push notifications, bounce handling, calendar seed from compliance checks |

**Total: 5 weeks for email + calendar, both production-ready.**

This replaces the 4+ weeks I'd originally scoped for email integration alone (because I was including both OAuth options). Simpler = faster.

---

## 4. Open decisions (only 3 now, down from 10)

### Q1. Do we use the flat form or the subdomain form?

- **Flat**: `grove-house@schoolgle.co.uk` — zero DNS per school, just a database row
- **Subdomain**: `ed@grove-house.schoolgle.co.uk` — needs a DNS wildcard (already allowed by SES) but feels more professional and gives each school a sub-brand

**Recommendation: flat form for speed to launch, add subdomain option as a premium upgrade later if demand exists.**

### Q2. What happens when a contractor replies and we can't match them to a workflow?

- **Option A**: Drop the email in a "needs review" inbox for the SBM to manually route
- **Option B**: Auto-attach to the most recent workflow involving that contractor
- **Option C**: Ed tries to match by subject + body text using AI (slower but more accurate)

**Recommendation: all three in priority order. Try B first (fast, usually right), then C (cheap AI call), fall back to A if confidence is low.**

### Q3. Who can see the calendar / iCal URL?

- **Option A**: Only authenticated Schoolgle users (breaks the use case of subscribing in Google Calendar)
- **Option B**: Anyone with the token in the URL (trivial for the SBM to share, but a leaked URL = exposed schedule)
- **Option C**: Per-user tokens rather than per-school, so the token identifies who's watching

**Recommendation: Option B with per-school tokens AND a rotate-token button on the settings page. If a token leaks, rotate it once and every subscription needs reconnecting. Low friction, low risk.**

---

## 5. What I recommend doing next

**If you approve this memo:**

1. I'll start Phase 1 (email) tomorrow. Spec → build → test → browser verify → commit.
2. Phase 1 Day 1 is: add `email_slug` to organizations, build the outbound sender helper using SES, build the Ed `draft_email` skill with PROPOSE flow, hook it into Terry's prompt.
3. Phase 1 Days 2-5 are: inbound Lambda, S3 routing, Document Inbox wiring, timeline events on workflows.
4. Week 2 is polish: welcome emails, bounce handling, ~first real end-to-end test where Ed drafts a boiler quote request, sends it to a test contractor email, and parses the reply back into the workflow.

**Before I start, I need:**

- ✅ / ❌ on the flat-form address (`grove-house@schoolgle.co.uk`)
- ✅ / ❌ on AWS SES as the provider
- ✅ / ❌ on the iCal-based calendar (no Google/M365 OAuth)
- Any concerns you have about data residency (SES eu-west-2 is fine for UK schools), deliverability, or cost
- Confirmation on which AWS account this should run in — the Schoolgle production account, or something separate

That's it. No other blockers. Once I have those green lights I can ship Phase 1 in 2 weeks with a proper demo at the end.
