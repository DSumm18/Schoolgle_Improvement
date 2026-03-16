# Aurora Primary School — Test Harness Scenarios

## School Profile

| Field    | Value                            |
| -------- | -------------------------------- |
| Name     | Aurora Primary School            |
| URN      | 999001                           |
| Type     | Community school (LA maintained) |
| Location | West Yorkshire                   |
| NOR      | ~420 (2-form entry)              |
| Ofsted   | Good (2022)                      |
| MIS      | Arbor (switched from SIMS 2021)  |
| Tracker  | Insight Tracking                 |
| FSM      | 26%                              |
| PP       | 30%                              |
| SEN      | 17% (13% K, 4% E)                |
| EAL      | 15%                              |

## Class Structure

| Year      | Class A  | Class B |
| --------- | -------- | ------- |
| Reception | Oak      | Maple   |
| Y1        | Birch    | Elm     |
| Y2        | Ash      | Willow  |
| Y3        | Holly    | Rowan   |
| Y4        | Pine     | Cedar   |
| Y5        | Chestnut | Beech   |
| Y6        | Sycamore | Hazel   |

---

## Embedded Scenarios

### 1. Mrs Patterson's Long-Term Sick Leave (Y3 Holly)

**What happened:** Mrs Patterson (STF-010) went on long-term sick leave during Spring 2025, when the current Y3 Holly class were in Y2. Supply teacher Mrs Blackwell (STF-024) covered the entire Spring term.

**Data signals:**

- Y2 Holly Spring reading/writing/maths: -15pp vs Autumn
- Y2 Holly Summer: partial recovery (+8pp) but still below
- Y3 Holly Autumn 2025: gap narrowing but still visible vs Rowan
- Mrs Patterson's own teaching record shows consistent results across 6 years — the dip is supply-related

**Ed should say:**

> "Holly class assessment dip occurred during Spring 2025 when Mrs Blackwell (supply) was covering. Mrs Patterson's own 6-year teaching record shows consistent at-or-above school average. Consider targeted catch-up for Holly class."

**Demo prompt:** "Ed, why is Y3 Holly class behind?"

---

### 2. Y5 Beech Supply Disruption

**What happened:** Mr Davies (STF-014) went on paternity + extended leave Sept-Dec 2024. Supply teacher Mr Walsh (STF-023) covered Autumn term.

**Data signals:**

- Behaviour incidents 2.8x in Beech vs Chestnut during Autumn 2024
- Y5 Beech Autumn assessment: slight dip vs Y4 Summer
- Y5 Beech Spring: recovery after Davies returned
- Behaviour returned to normal from Spring

**Ed should say:**

> "Beech class had 47 behaviour incidents in Autumn vs 16 in Chestnut — a 2.9x spike during supply cover. Incidents returned to normal in Spring when Mr Davies returned."

**Demo prompt:** "Are there any behaviour concerns in Y5?"

---

### 3. Y6 High PP Cohort (40% PP)

**What happened:** This Y6 cohort has an unusually high PP proportion (40% vs school average 30%). The PP attainment gap has been persistent since KS1.

**Data signals:**

- PP gap in reading: -15pp (Y2: -14pp → Y4: -18pp → Y5: -15pp, narrowing)
- PP gap in maths: -12pp
- 5 borderline PP pupils predicted scaled score 97-102 in reading
- Intervention running since Y5 Summer, showing 3pp/year narrowing

**Ed should say:**

> "Y6 PP gap in reading is 15pp. 5 PP pupils are borderline (predicted 97-102). If these 5 achieve Expected, your PP gap narrows to 8pp. If they don't, it widens to 20pp. These are your highest-impact intervention targets."

**Demo prompt:** "What's our Y6 PP gap looking like for SATs?"

---

### 4. Aiden Murphy — EHCP Success Story

**What happened:** Aiden Murphy (Y4 Pine) has an EHCP for ASD with 1:1 TA support from Ms Wright since start of Y3.

**Data signals:**

- Y1: PKF/PKF/PKF (Reading/Writing/Maths)
- Y2: WTS/PKF/WTS
- Y3: WTS/WTS/EXS (Maths breakthrough)
- Y4: WTS/WTS/EXS (sustained progress)

**Ed should say:**

> "Aiden Murphy has progressed from Pre-Key Stage to Expected in Maths over 18 months. This correlates with the start of 1:1 TA support. Excellent evidence for EHCP annual review."

**Demo prompt:** "Show me our SEND success stories"

---

### 5. Teacher Assessment Inflation — Y6 Hazel

**What happened:** Mrs Williams (STF-001, teaching HT at 0.4 FTE) teaches Y6 Hazel. Her teacher assessments are 8-10pp higher than standardised test scores suggest. Mr Brown (STF-017) teaching Y6 Sycamore shows normal alignment.

**Data signals:**

- Hazel: 78% Expected in reading (teacher assessment) but PiRA standardised scores suggest 68%
- Sycamore: 72% Expected (teacher assessment) aligns with PiRA at 71%
- Gap is 8-10pp in Hazel, <2pp in Sycamore

**Ed should say:**

> "Y6 Hazel class teacher assessments are 8pp above PiRA standardised scores in reading. Sycamore class shows normal alignment. Possible moderation inconsistency — recommend cross-class moderation before KS2 SATs."

**Demo prompt:** "Are our teacher assessments accurate?"

---

### 6. Mia Clarke — The "Invisible" Declining Child

**What happened:** Mia Clarke (Y5 Chestnut) was solidly Expected from Y1-Y3. She's been gradually declining and is now borderline WTS in reading. She is NOT on any intervention or watchlist.

**Data signals:**

- Y1-Y3: Solid EXS in reading across all terms
- Y4 Autumn: EXS (but lower within band)
- Y4 Spring: EXS (borderline)
- Y4 Summer: borderline EXS
- Y5 Autumn: WTS (dropped)
- Y5 Spring: WTS
- Not in any SEN register or intervention group

**Ed should say:**

> "Mia Clarke has been declining in reading for 3 consecutive terms. She dropped from Expected to Working Towards in Y5 Autumn. She is NOT on any intervention list. Current trajectory suggests she may not recover without support."

**Demo prompt:** "Are there any children we should be worried about?"

---

### 7. Tracy Morgan — Bradford Factor Alert

**What happened:** School secretary Mrs Tracy Morgan (STF-020) has had 3 separate absence spells totalling 12 working days this year.

**Data signals:**

- Spell 1: 3 days (October — cold/flu)
- Spell 2: 5 days (January — stomach)
- Spell 3: 4 days (March — musculoskeletal)
- Bradford Factor: 3² × 12 = 108

**Ed should say:**

> "Mrs Tracy Morgan has a Bradford Factor of 108 (3 spells × 12 days). This exceeds the 100 threshold. A return-to-work interview is required. Would you like me to create a meeting with the RTW template?"

**Demo prompt:** "Are there any staff absence concerns?"

---

### 8. Mr Simon Lee — Hidden Writing Underperformance

**What happened:** Mr Lee (STF-013) has taught across Y2, Y3, Y4, and Y5 over 6 years. In EVERY posting, his class performs 8-10pp below the parallel class in writing. No one has noticed because he moves year groups.

**Data signals:**

- 2019-20: Y2 Ash writing 65% EXS vs Y2 Willow 74% (Mrs White) — gap 9pp
- 2020-21: COVID year (harder to read)
- 2021-22: Y4 Pine writing 68% vs Y4 Cedar 76% (Mrs Campbell) — gap 8pp
- 2022-23: Y5 Chestnut writing 64% vs Y5 Beech 73% (Mr Davies) — gap 9pp
- 2023-24: Y3 Holly writing 61% vs Y3 Rowan 70% (Mr Taylor) — gap 9pp
- 2024-25: Y4 Pine writing 66% vs Y4 Cedar 75% (Mrs Campbell) — gap 9pp
- 2025-26: Y4 Pine emerging below again

**Ed should say:**

> "Mr Lee's classes have performed below school average in writing in 5 of the last 6 years, across 4 different year groups. The pattern follows the teacher, not the cohort. Recommend: targeted writing CPD, peer observation with Mrs Campbell whose classes consistently outperform."

**Demo prompt:** "Are there any teacher performance patterns we should know about?"

---

### 9. Ms Priya Patel — Consistently Excellent Maths

**What happened:** Ms Patel (STF-009) has taught Y2 Ash for 4 consecutive years (2022-26). She's also Maths Lead. Her class consistently outperforms the parallel Y2 Willow class in maths by 8-12pp.

**Data signals:**

- 2022-23: Ash maths 82% vs Willow 72% — gap +10pp
- 2023-24: Ash maths 85% vs Willow 73% — gap +12pp
- 2024-25: Ash maths 80% vs Willow 71% — gap +9pp
- 2025-26: Ash maths emerging above again

**Ed should say:**

> "Ms Patel's classes have outperformed the parallel Y2 class in maths by an average of 10pp across 4 years. She's your strongest maths practitioner. Consider deploying her for staff CPD or cross-school moderation."

**Demo prompt:** "Which teachers are our strongest?"

---

## Demo Script (Full Walkthrough)

1. **Load data:** "Ed, can you read our latest MIS data?"
2. **Ofsted readiness:** "Run an Ofsted readiness scan" → finds everything
3. **Teacher performance:** "Are there any teacher performance concerns?" → Mr Lee flagged
4. **Teacher strengths:** "Who are our strongest teachers?" → Ms Patel highlighted
5. **Declining pupils:** "Which pupils should we be worried about?" → Mia Clarke flagged
6. **PP analysis:** "What's our PP gap looking like?" → full historical analysis
7. **SEND progress:** "How are our EHCP pupils doing?" → Aiden Murphy success story
8. **TA accuracy:** "Are our teacher assessments accurate?" → Y6 Hazel inflation
9. **Staff absence:** "Any staff absence concerns?" → Bradford Factor + supply impact
10. **Governor report:** "Generate a termly governor report" → pulls from all sources

---

## Data Architecture

```
DEVELOPMENT (test harness):
  test-harness/aurora-primary/arbor-exports/*.xlsx
  → MISDataService.read() → In-memory processing → Ed responds

PRODUCTION (real school):
  school's Google Drive / Wonde API / Arbor API
  → MISDataService.read() → In-memory processing → Ed responds

Same code. Same path. Same result.
NO pupil data stored in Supabase. Ever.
```
