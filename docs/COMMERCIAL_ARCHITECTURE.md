# Schoolgle Commercial Architecture & Module Design

## Executive Summary

This document outlines the modular architecture, AI model selection, and commercial pricing strategy for Schoolgle - making it a profitable, quality school improvement platform.

---

## 🏗️ MODULAR ARCHITECTURE

### Core Platform (Always Included)
Every school gets these base features:

| Feature | Description |
|---------|-------------|
| User Management | SSO, roles (Admin, SLT, Teacher, Governor, Viewer) |
| Organization Settings | School profile, branding, basic config |
| Basic Dashboard | Overview of key metrics |
| Data Storage | Secure, GDPR-compliant storage |

### Premium Add-On Modules

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCHOOLGLE MODULE STORE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📋 CORE MODULES (Included in Base)              FREE              │
│  ├── Framework Self-Assessment (Ofsted/SIAMS)                      │
│  ├── Action Tracking                                               │
│  ├── Basic Document Storage                                        │
│  └── Ed Chatbot (limited queries/month)                            │
│                                                                     │
│  ⭐ INSPECTION READY BUNDLE              £49/month or £499/year    │
│  ├── Evidence Scanner (AI document matching)                       │
│  ├── SEF Generator                                                 │
│  ├── Statutory Documents (PP, Sports, SDP)                         │
│  └── Inspection Predictor                                          │
│                                                                     │
│  🎤 VOICE SUITE                          £29/month or £299/year    │
│  ├── Voice-to-Observation                                          │
│  ├── Meeting Transcription                                         │
│  ├── AI Meeting Minutes                                            │
│  └── Voice Note Evidence Capture                                   │
│                                                                     │
│  📊 INSIGHTS PRO                         £39/month or £399/year    │
│  ├── Advanced Dashboard                                            │
│  ├── Similar Schools Comparison                                    │
│  ├── Trend Analysis                                                │
│  └── Custom Report Builder                                         │
│                                                                     │
│  🤖 AI COACH                             £19/month or £199/year    │
│  ├── Mock Inspector                                                │
│  ├── Staff Practice Sessions                                       │
│  ├── Question Bank                                                 │
│  └── Answer Coaching                                               │
│                                                                     │
│  📱 QUICK CAPTURE (Mobile App)           £15/month or £149/year    │
│  ├── Photo Evidence                                                │
│  ├── Voice Notes                                                   │
│  ├── Quick Observation                                             │
│  └── Push Notifications                                            │
│                                                                     │
│  🔄 OPERATIONS SUITE                     £35/month or £359/year    │
│  ├── Policy Tracker                                                │
│  ├── CPD Management                                                │
│  ├── Risk Register                                                 │
│  └── Compliance Calendar                                           │
│                                                                     │
│  📣 STAKEHOLDER VOICE                    £25/month or £259/year    │
│  ├── Parent Surveys                                                │
│  ├── Pupil Voice                                                   │
│  ├── Staff Wellbeing                                               │
│  └── AI Sentiment Analysis                                         │
│                                                                     │
│  🏆 EVERYTHING BUNDLE                    £149/month or £1,499/year │
│  └── All modules included + priority support                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI MODEL STRATEGY (via OpenRouter)

### Model Selection by Task

| Task | Recommended Model | Cost/1M tokens | Why |
|------|-------------------|----------------|-----|
| **Simple Chat (Ed basic)** | Gemini 1.5 Flash | $0.075 input / $0.30 output | Ultra cheap, fast, good quality |
| **Document Analysis** | Claude 3.5 Haiku | $0.25 input / $1.25 output | Great at document understanding |
| **Report Generation** | Claude 3.5 Sonnet | $3 input / $15 output | Best writing quality |
| **Mock Inspector** | GPT-4o | $2.50 input / $10 output | Best roleplay/persona |
| **Transcription** | Whisper API | $0.006/minute | Industry standard |
| **Embedding (Search)** | text-embedding-3-small | $0.02/1M tokens | Cheap, accurate |
| **Quick Classification** | Llama 3.1 8B | $0.05 input / $0.05 output | Ultra cheap for simple tasks |

### Cost Estimation Per User Action

| Action | Model Used | Est. Tokens | Est. Cost |
|--------|------------|-------------|-----------|
| Ed chat response | Gemini Flash | ~500 in / 800 out | £0.0002 |
| Document scan (1 doc) | Haiku | ~2000 in / 500 out | £0.0006 |
| Generate SEF section | Sonnet | ~3000 in / 2000 out | £0.04 |
| Mock inspector session | GPT-4o | ~5000 in / 3000 out | £0.04 |
| 10 min meeting transcript | Whisper | 10 mins | £0.05 |
| Full PP Strategy | Sonnet | ~4000 in / 5000 out | £0.09 |

### Monthly AI Cost Estimates (Per School)

| Usage Level | Actions/Month | Est. AI Cost | Our Price | Margin |
|-------------|---------------|--------------|-----------|--------|
| Light | 100 queries, 5 docs | ~£3 | £49+ | 94%+ |
| Medium | 500 queries, 20 docs, 5 reports | ~£15 | £99+ | 85%+ |
| Heavy | 2000 queries, 100 docs, 20 reports | ~£60 | £149+ | 60%+ |

---

## 📊 COMPETITIVE ANALYSIS

### Voice-to-Report Inspiration

**Otter.ai** (Leader in transcription)
- Real-time transcription
- Speaker identification
- Auto-summary
- Pricing: $16.99/month business
- **What we take:** Transcription quality, speaker ID

**Fireflies.ai** (Meeting assistant)
- Auto-joins meetings
- Extracts action items
- Integrates everywhere
- Pricing: $19/month
- **What we take:** Action item extraction, search

**Fathom** (Free meeting recorder)
- Highlight moments
- Share clips
- CRM integration
- **What we take:** Highlight/clip feature for observations

### Our Differentiation for Voice-to-Report

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎤 SCHOOLGLE VOICE ADVANTAGE                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OTHERS: Generic transcription → Manual processing needed          │
│                                                                     │
│  SCHOOLGLE:                                                         │
│  1. Record observation while walking ──────────────────────────┐   │
│                                                                 │   │
│  2. AI UNDERSTANDS EDUCATION CONTEXT ◄──────────────────────────┤   │
│     • "Year 4 maths" → Links to Curriculum & Teaching           │   │
│     • "manipulatives" → Recognizes pedagogy term                │   │
│     • "off task" → Links to Behaviour & Attitudes               │   │
│                                                                 │   │
│  3. AUTO-GENERATES:                                             │   │
│     ✓ Pre-filled observation form                               │   │
│     ✓ Strengths/AFI categorized                                 │   │
│     ✓ Linked to Ofsted framework areas                          │   │
│     ✓ Suggested follow-up actions                               │   │
│     ✓ CPD recommendations from EEF                              │   │
│                                                                 │   │
│  4. ALL IN ONE PLACE                                            │   │
│     • No export needed                                          │   │
│     • Feeds into SEF automatically                              │   │
│     • Counts toward evidence base                               │   │
│                                                                 │   │
└─────────────────────────────────────────────────────────────────────┘
```

### One-Click Reports Inspiration

**Jasper.ai** (Content generation)
- Templates for different content types
- Brand voice training
- Team collaboration
- Pricing: $49-$125/month
- **What we take:** Template system, brand consistency

**Notion AI** (Document assistant)
- Inline generation
- Summarization
- Action item extraction
- **What we take:** Inline editing, context awareness

### Our One-Click Report Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  📄 ONE-CLICK REPORT GENERATION                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DATA SOURCES (Already in Schoolgle):                               │
│  ├── Self-assessments & ratings                                    │
│  ├── Evidence matches & documents                                  │
│  ├── Action progress                                               │
│  ├── Observation data                                              │
│  ├── PP spending & outcomes                                        │
│  ├── SDP progress                                                  │
│  └── Survey results                                                │
│                                                                     │
│  AVAILABLE REPORTS:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Report                    │ Time │ Sources Used              │   │
│  ├───────────────────────────┼──────┼───────────────────────────┤   │
│  │ Headteacher Report        │ 45s  │ All areas, actions, data  │   │
│  │ Governor Pack             │ 60s  │ SDP, safeguarding, data   │   │
│  │ SEF Summary               │ 90s  │ Assessments, evidence     │   │
│  │ PP Impact Statement       │ 30s  │ PP data, outcomes         │   │
│  │ Sports Premium Report     │ 30s  │ Sports data, spending     │   │
│  │ SEND Information Report   │ 45s  │ SEND evidence, provision  │   │
│  │ Safeguarding Report       │ 30s  │ SCR data, training        │   │
│  │ Quality of Education      │ 60s  │ Observations, outcomes    │   │
│  │ Deep Dive Subject Report  │ 45s  │ Subject-specific data     │   │
│  │ Annual Review Document    │ 120s │ Everything                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  USER FLOW:                                                         │
│  1. Click "Generate Report"                                         │
│  2. Select report type                                              │
│  3. Choose date range                                               │
│  4. AI generates draft in seconds                                   │
│  5. Edit in-app or export to Word/PDF                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Mock Inspector Inspiration

**Synthesia** (AI video avatars)
- Realistic AI presenters
- Script to video
- Multiple languages
- **What we take:** Professional AI persona concept

**Roleplay AI apps** (Character.AI, etc.)
- Consistent persona
- Memory of conversation
- Adaptive responses
- **What we take:** Roleplay quality, consistency

### Our Mock Inspector Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  👔 MOCK INSPECTOR AI                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PERSONA MODES:                                                     │
│  ├── 👔 Lead Inspector (formal, probing)                           │
│  ├── 📚 Curriculum Deep Dive (subject-specific)                    │
│  ├── 🛡️ Safeguarding Inspector (challenging)                       │
│  ├── 👶 Early Years Specialist (EYFS focus)                        │
│  └── ⛪ SIAMS Inspector (church school)                            │
│                                                                     │
│  SESSION TYPES:                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Session           │ Duration │ Focus                        │   │
│  ├───────────────────┼──────────┼──────────────────────────────┤   │
│  │ Quick Fire        │ 5 mins   │ 10 rapid questions           │   │
│  │ Deep Dive         │ 15 mins  │ Single subject exploration   │   │
│  │ Leadership Grilling│ 20 mins │ Strategic questions          │   │
│  │ Safeguarding Spot │ 10 mins  │ DSL scenario testing         │   │
│  │ Full Mock         │ 45 mins  │ Simulated inspection day     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AI FEEDBACK INCLUDES:                                              │
│  ✓ What you said well                                              │
│  ✓ What you missed                                                 │
│  ✓ Better answer suggestions                                       │
│  ✓ Evidence you should reference                                   │
│  ✓ Body language tips (if video)                                   │
│  ✓ Confidence score                                                │
│                                                                     │
│  KNOWLEDGE BASE:                                                    │
│  • 2025 Ofsted Handbook                                            │
│  • Recent inspection reports                                       │
│  • Common questions asked                                          │
│  • Your school's actual data (personalized)                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💰 COMMERCIAL PRICING STRATEGY

### Pricing Tiers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCHOOLGLE PRICING                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🌱 STARTER (Free)                                                  │
│  ├── Basic self-assessment                                         │
│  ├── 10 Ed queries/month                                           │
│  ├── Manual evidence upload (no AI scan)                           │
│  └── Community support                                             │
│                                                                     │
│  📘 ESSENTIAL                           £99/month (£999/year)      │
│  ├── Full self-assessment (Ofsted + SIAMS)                         │
│  ├── 100 Ed queries/month                                          │
│  ├── Evidence scanner (50 docs/month)                              │
│  ├── SEF Generator                                                 │
│  ├── Action tracking                                               │
│  └── Email support                                                 │
│                                                                     │
│  🏆 PROFESSIONAL                        £199/month (£1,999/year)   │
│  ├── Everything in Essential                                       │
│  ├── Unlimited Ed queries                                          │
│  ├── Evidence scanner (unlimited)                                  │
│  ├── Statutory documents (PP, Sports, SDP)                         │
│  ├── Voice suite (observations + meetings)                         │
│  ├── One-click reports                                             │
│  ├── Dashboard insights                                            │
│  └── Priority support                                              │
│                                                                     │
│  🎯 ENTERPRISE                          £349/month (£3,499/year)   │
│  ├── Everything in Professional                                    │
│  ├── Mock Inspector AI                                             │
│  ├── Stakeholder surveys + analysis                                │
│  ├── Similar schools comparison                                    │
│  ├── Multi-school dashboard (MAT)                                  │
│  ├── API access                                                    │
│  ├── Custom integrations                                           │
│  ├── Dedicated account manager                                     │
│  └── SLA guarantee                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Revenue Projections

| Scenario | Schools | Avg Revenue | Annual Revenue |
|----------|---------|-------------|----------------|
| Year 1 | 50 | £1,500/yr | £75,000 |
| Year 2 | 200 | £1,800/yr | £360,000 |
| Year 3 | 500 | £2,000/yr | £1,000,000 |

### Cost Structure (Per School)

| Cost Item | Monthly | Notes |
|-----------|---------|-------|
| AI APIs | £15-60 | Depends on usage |
| Supabase | £1 | Shared infrastructure |
| Infrastructure | £2 | Vercel/hosting |
| Support | £5-15 | Scales with tier |
| **Total Cost** | **£23-77** | |
| **Revenue** | **£99-349** | |
| **Gross Margin** | **60-77%** | |

---

## 🔧 IMPLEMENTATION PRIORITY

### Phase 1: Core Platform (Month 1-2)
- [ ] Module enable/disable system
- [ ] Subscription management
- [ ] Usage tracking/metering
- [ ] Basic Ed chatbot (Gemini Flash)

### Phase 2: Inspection Ready (Month 2-3)
- [ ] Evidence scanner (Haiku)
- [ ] SEF generator (Sonnet)
- [ ] Statutory documents
- [ ] One-click reports

### Phase 3: Voice Suite (Month 3-4)
- [ ] Whisper integration
- [ ] Voice-to-observation
- [ ] Meeting transcription
- [ ] AI minutes (Sonnet)

### Phase 4: Advanced AI (Month 4-5)
- [ ] Mock Inspector (GPT-4o)
- [ ] Similar schools comparison
- [ ] Advanced dashboard
- [ ] Survey analysis

### Phase 5: Mobile & Polish (Month 5-6)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Quick capture
- [ ] Performance optimization

---

## 🔌 DATABASE MODULE SYSTEM

### Module Configuration Table

```sql
-- Add to supabase_schema.sql

create table modules (
  id text primary key,
  name text not null,
  description text,
  category text, -- 'core', 'inspection', 'voice', 'insights', 'operations'
  price_monthly decimal(8,2),
  price_annual decimal(8,2),
  is_active boolean default true,
  features jsonb -- List of features included
);

create table organization_modules (
  organization_id uuid references organizations(id) on delete cascade,
  module_id text references modules(id),
  enabled boolean default true,
  enabled_at timestamp with time zone,
  expires_at timestamp with time zone,
  usage_limits jsonb, -- e.g., {"ed_queries": 100, "doc_scans": 50}
  usage_current jsonb,
  primary key (organization_id, module_id)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  plan text check (plan in ('free', 'essential', 'professional', 'enterprise')),
  status text check (status in ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id),
  action_type text not null, -- 'ed_query', 'doc_scan', 'report_generate', 'voice_transcribe'
  module_id text references modules(id),
  tokens_used integer,
  cost_estimate decimal(8,6),
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## Summary

This architecture enables:
1. **Modular pricing** - Schools pay for what they need
2. **Cost-effective AI** - Right model for each task
3. **Scalable infrastructure** - Grows with usage
4. **Clear value proposition** - Time savings = ROI
5. **Competitive moat** - Education-specific AI understanding

Would you like me to implement any specific component first?

