# Website Compliance Scanner - Test Plan

## Test Target

- **Test School**: Grove House Primary School (mapped to Aurora Primary in database)
- **Website**: https://grovehouseprimary.co.uk/
- **Organization ID**: `c64ed86b-9eab-49ee-9829-0706ff371083`
- **School Type**: Maintained primary
- **Date**: 2026-03-10

## Pre-Test Checklist

- [ ] Dev server running on port 3002
- [ ] OpenRouter API key valid (currently returning 401 - needs fixing)
- [ ] Supabase accessible with service role key
- [ ] `website_compliance_scans` table exists (migration applied)
- [ ] Playwright chromium 1200 installed (`npx -p playwright@1.57.0 playwright install chromium`)

## Known Issues

| Issue                              | Impact                                                                                                             | Status          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------- |
| OpenRouter API key returns 401     | AI assessment (Phase 2) cannot run - no evidence quotes, gaps, recommendations, or quality/clarity differentiation | **BLOCKING**    |
| All items show `aiAssessed: false` | Scores are structural-only (keyword counting) not AI-verified                                                      | Caused by above |

---

## Test 1: Full Website Crawl (100 pages)

**Endpoint**: `POST /api/ofsted/website-scan`
**Payload**:

```json
{
  "websiteUrl": "https://grovehouseprimary.co.uk/",
  "organizationId": "c64ed86b-9eab-49ee-9829-0706ff371083",
  "schoolType": "maintained",
  "useAI": true,
  "maxPages": 100
}
```

### Expected Results

| Metric               | Expected        | Actual (Structural Only) | Notes                                   |
| -------------------- | --------------- | ------------------------ | --------------------------------------- |
| Pages crawled        | 80-120          | 100                      | Depends on site size                    |
| PDFs processed       | 30-60           | 49                       | Policies, reports, newsletters          |
| Scan duration        | 120-300s        | 185s                     | Within range                            |
| Requirements checked | 28-30           | 30                       | 28 core + 2 secondary-only              |
| Compliant items      | 10-15 (with AI) | 5 (structural)           | AI would improve accuracy               |
| Partial items        | 10-15 (with AI) | 24 (structural)          | Many would become compliant with AI     |
| Not found items      | 3-8             | 1                        | Only Careers (primary school - correct) |

---

## Test 2: Per-Requirement Verification

For each of the 30 requirements, verify the scanner correctly identifies content on Grove House Primary's website.

### Category: School Identity & Contact

| #   | Requirement          | Expected on Website                     | Scanner Finding                                             | Correct?                                                                          | Verification Notes |
| --- | -------------------- | --------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------ |
| 1   | **Contact Details**  | Yes - should be on contact page, footer | Compliant (score 80) in full scan, Not Found in 5-page scan | Check `/contact` page is being crawled                                            |
| 2   | **Headteacher Name** | Yes - staff page lists leadership       | Partial (score 48-68)                                       | Should be compliant; check keyword matching for "headteacher" vs "head of school" |

### Category: SEND

| #   | Requirement                | Expected on Website          | Scanner Finding | Correct?                                                         | Verification Notes |
| --- | -------------------------- | ---------------------------- | --------------- | ---------------------------------------------------------------- | ------------------ |
| 3   | **SENCO Name & Contact**   | Likely on staff or SEND page | Not Found       | Manually verify: visit staff/SEND page, check if SENCO is listed |
| 4   | **SEN Information Report** | Should be as PDF policy      | Not Found       | Check if there's a SEND/SEN policy page with PDF downloads       |
| 5   | **Accessibility Plan**     | May be in policies section   | Not Found       | Check policies page for accessibility plan document              |

### Category: Admissions

| #   | Requirement                | Expected on Website       | Scanner Finding   | Correct?                                                           | Verification Notes |
| --- | -------------------------- | ------------------------- | ----------------- | ------------------------------------------------------------------ | ------------------ |
| 6   | **Admission Arrangements** | Likely on admissions page | Partial (score 9) | Low score suggests weak match; check admissions page content       |
| 7   | **Appeals Timetable**      | May not exist for primary | Not Found         | Often handled by LA for maintained schools - acceptable if missing |
| 8   | **In-Year Admissions**     | May link to LA            | Not Found         | Check if there's an admissions section with in-year info           |

### Category: Curriculum

| #   | Requirement              | Expected on Website               | Scanner Finding                               | Correct?                                                                  | Verification Notes |
| --- | ------------------------ | --------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- | ------------------ |
| 9   | **Curriculum Content**   | Yes - curriculum pages            | Compliant (score 85) / Partial (30 on 5-page) | Should have subject pages; verify breadth                                 |
| 10  | **Phonics & Reading**    | Yes - reading/phonics pages exist | Partial (score 16-60)                         | Pages found at `/reading` and `/learning/phonics`; check DfE scheme named |
| 11  | **RE Withdrawal Rights** | May be in RE curriculum or policy | Partial (score 32)                            | Check if withdrawal right is explicitly stated                            |

### Category: Policies

| #   | Requirement               | Expected on Website          | Scanner Finding              | Correct?                                                   | Verification Notes |
| --- | ------------------------- | ---------------------------- | ---------------------------- | ---------------------------------------------------------- | ------------------ |
| 12  | **RSE Policy**            | Should be as policy document | Partial/Compliant (score 60) | Check policies page for RSHE/RSE policy                    |
| 13  | **Behaviour Policy**      | Should be published          | Not Found                    | **FALSE NEGATIVE?** Most schools have this; check manually |
| 14  | **Complaints Procedure**  | Should be published          | Not Found                    | Check policies section                                     |
| 15  | **Charging & Remissions** | Should be published          | Not Found                    | Check policies section                                     |
| 16  | **Uniform Policy**        | Usually on website           | Not Found                    | Check if there's a uniform page                            |

### Category: Pupil Premium

| #   | Requirement                | Expected on Website           | Scanner Finding | Correct?                                                   | Verification Notes |
| --- | -------------------------- | ----------------------------- | --------------- | ---------------------------------------------------------- | ------------------ |
| 17  | **Pupil Premium Strategy** | Should be published by 31 Dec | Not Found       | **Check manually** - most schools have this; may be as PDF |

### Category: PE & Sport Premium

| #   | Requirement            | Expected on Website            | Scanner Finding | Correct?                                            | Verification Notes |
| --- | ---------------------- | ------------------------------ | --------------- | --------------------------------------------------- | ------------------ |
| 18  | **PE & Sport Premium** | Should be published by 31 July | Not Found       | Check for PE premium or sport premium page/document |

### Category: Governance

| #   | Requirement                | Expected on Website   | Scanner Finding | Correct?                                                | Verification Notes |
| --- | -------------------------- | --------------------- | --------------- | ------------------------------------------------------- | ------------------ |
| 19  | **Governance Information** | Should list governors | Not Found       | **Check manually** - look for governors/governance page |

### Category: Safeguarding

| #   | Requirement             | Expected on Website        | Scanner Finding | Correct?                                                         | Verification Notes |
| --- | ----------------------- | -------------------------- | --------------- | ---------------------------------------------------------------- | ------------------ |
| 20  | **Safeguarding Policy** | Must be on website (KCSIE) | Not Found       | **CRITICAL CHECK** - look for safeguarding/child protection page |

### Category: Performance Data

| #   | Requirement                 | Expected on Website                               | Scanner Finding    | Correct?                                      | Verification Notes |
| --- | --------------------------- | ------------------------------------------------- | ------------------ | --------------------------------------------- | ------------------ |
| 21  | **KS2 Results**             | Should show latest results                        | Partial (score 13) | Check if there's a results/data page          |
| 22  | **School Performance Link** | Link to compare-school-performance.service.gov.uk | Not Found          | Check footer or data page for government link |

### Category: Financial

| #   | Requirement                     | Expected on Website                                   | Scanner Finding | Correct?                                 | Verification Notes |
| --- | ------------------------------- | ----------------------------------------------------- | --------------- | ---------------------------------------- | ------------------ |
| 23  | **Staff Pay Over 100k**         | Only if applicable                                    | Not Found       | Maintained school - may not apply; check |
| 24  | **Financial Benchmarking Link** | Link to schools-financial-benchmarking.service.gov.uk | Not Found       | Check for benchmarking link              |

### Category: Equality & Diversity

| #   | Requirement               | Expected on Website | Scanner Finding    | Correct?                                         | Verification Notes |
| --- | ------------------------- | ------------------- | ------------------ | ------------------------------------------------ | ------------------ |
| 25  | **Equality Objectives**   | Should be published | Partial (score 10) | Check for equality policy or objectives page     |
| 26  | **Gender Pay Gap Report** | Only 250+ employees | Not Found          | Likely doesn't apply to primary school - correct |

### Category: Ofsted

| #   | Requirement       | Expected on Website | Scanner Finding       | Correct?                                                        | Verification Notes |
| --- | ----------------- | ------------------- | --------------------- | --------------------------------------------------------------- | ------------------ |
| 27  | **Ofsted Report** | Must be linked      | Partial (score 48-70) | Check for Ofsted link/report; may link to reports.ofsted.gov.uk |

### Category: Careers (Secondary)

| #   | Requirement                        | Expected on Website  | Scanner Finding | Correct?                     | Verification Notes |
| --- | ---------------------------------- | -------------------- | --------------- | ---------------------------- | ------------------ |
| 28  | **Careers Programme**              | N/A (primary school) | Not Found       | **CORRECT** - secondary only |
| 29  | **Provider Access (Baker Clause)** | N/A (primary school) | Not Found       | **CORRECT** - secondary only |

### Category: Accessibility

| #   | Requirement                         | Expected on Website | Scanner Finding | Correct?                                 | Verification Notes |
| --- | ----------------------------------- | ------------------- | --------------- | ---------------------------------------- | ------------------ |
| 30  | **Website Accessibility Statement** | Should be in footer | Not Found       | Check footer for accessibility statement |

---

## Test 3: Manual Website Verification

Visit these specific pages on https://grovehouseprimary.co.uk/ and compare to scanner findings:

| Page to Visit                     | What to Check                             | Expected Findings                                      |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `/` (Homepage)                    | School name, basic info                   | School name detection                                  |
| `/contact` or footer              | Address, phone, email                     | Contact details requirement                            |
| `/staff` or `/about/staff`        | Headteacher, SENCO names                  | Identity & SEND requirements                           |
| `/policies` or `/key-information` | Policy documents (PDFs)                   | Behaviour, safeguarding, complaints, charging, uniform |
| `/send` or `/sen` or `/inclusion` | SEN Information Report                    | SEND requirements                                      |
| `/curriculum`                     | Subject pages                             | Curriculum content requirement                         |
| `/reading` or `/phonics`          | Reading scheme info                       | Phonics & reading requirement                          |
| `/admissions`                     | Admission arrangements                    | Admissions requirements                                |
| `/governors` or `/governance`     | Governor names, structure                 | Governance requirement                                 |
| `/pupil-premium`                  | Strategy statement                        | Pupil premium requirement                              |
| `/pe-sport-premium`               | Spending report                           | PE sport premium requirement                           |
| `/results` or `/data`             | KS2 results, school performance link      | Performance data requirements                          |
| `/ofsted`                         | Ofsted report link                        | Ofsted requirement                                     |
| Footer area                       | Accessibility statement, performance link | Accessibility, financial links                         |

---

## Test 4: Database Storage Verification

After a scan completes, verify data is stored correctly:

### 4a. website_compliance_scans table

```sql
SELECT id, organization_id, website_url, school_type,
       overall_compliance_score, overall_quality_score,
       compliant_count, partial_count, not_found_count,
       pages_scanned, pdfs_processed, scan_duration_ms,
       scanned_at
FROM website_compliance_scans
WHERE organization_id = 'c64ed86b-9eab-49ee-9829-0706ff371083';
```

**Expected**: One row with scores matching API response.

### 4b. ed_website_knowledge table (Ed's RAG)

```sql
SELECT COUNT(*),
       MIN(LENGTH(content)) as min_content,
       MAX(LENGTH(content)) as max_content,
       COUNT(DISTINCT content_type) as content_types
FROM ed_website_knowledge
WHERE organization_id = 'c64ed86b-9eab-49ee-9829-0706ff371083';
```

**Expected**: 50-100 rows (pages with content > 50 chars), content_types = 'page' and 'policy'.

### 4c. documents table (Ofsted evidence)

```sql
SELECT id, name, provider, file_type, web_view_link
FROM documents
WHERE organization_id = 'c64ed86b-9eab-49ee-9829-0706ff371083'
  AND provider = 'website';
```

**Expected**: Rows for each compliant/partial requirement that has an ofstedCategory mapping.

### 4d. evidence_matches table

```sql
SELECT em.document_id, em.framework_type, em.category_id,
       em.subcategory_id, em.confidence, em.match_details
FROM evidence_matches em
WHERE em.organization_id = 'c64ed86b-9eab-49ee-9829-0706ff371083'
  AND em.match_details->>'source' = 'website_scan';
```

**Expected**: Rows linking website documents to Ofsted categories.

---

## Test 5: GET Endpoint - Retrieve Scan

**Endpoint**: `GET /api/ofsted/website-scan?organizationId=c64ed86b-9eab-49ee-9829-0706ff371083`

**Expected Response**:

```json
{
  "success": true,
  "hasReport": true,
  "scan": {
    "websiteUrl": "https://grovehouseprimary.co.uk/",
    "overallComplianceScore": 30,
    "compliantCount": 5,
    ...
  },
  "fullReport": { ... }
}
```

---

## Test 6: AI Assessment (Once API Key Fixed)

Re-run scan after fixing OpenRouter API key. Compare results:

| Metric          | Structural Only   | With AI                      | Improvement                             |
| --------------- | ----------------- | ---------------------------- | --------------------------------------- |
| Compliant count | 5                 | Expected 12-18               | AI distinguishes partial from compliant |
| Evidence quotes | 0                 | Expected 2-5 per requirement | AI extracts exact quotes                |
| Gaps identified | Generic only      | Specific per requirement     | AI provides actionable gaps             |
| Recommendations | Generic only      | Specific per requirement     | AI provides tailored recommendations    |
| Quality scores  | All 3.0 (default) | Differentiated 1-5           | AI assesses actual quality              |
| Clarity scores  | All 3.0 (default) | Differentiated 1-5           | AI assesses parent-friendliness         |
| Red flags       | None              | Expected 3-8                 | AI identifies compliance risks          |
| Confidence      | All 0.5           | Varied 0.6-0.95              | AI reports its confidence               |

---

## Test 7: Edge Cases

| Scenario         | Test Method                                             | Expected Result                               |
| ---------------- | ------------------------------------------------------- | --------------------------------------------- |
| Invalid URL      | POST with `websiteUrl: "not-a-url"`                     | 400 error                                     |
| Unreachable URL  | POST with `websiteUrl: "https://doesnotexist12345.com"` | 422 with crawl errors                         |
| Invalid org ID   | POST with non-existent UUID                             | 404 org not found                             |
| Missing fields   | POST without `websiteUrl`                               | 400 validation error                          |
| Re-scan (upsert) | Run scan twice for same org                             | Second scan replaces first (UNIQUE on org_id) |
| No scan exists   | GET with org that hasn't been scanned                   | `{ hasReport: false }`                        |

---

## Test 8: Scan Accuracy Audit

After manual verification (Test 3), classify each requirement result:

| Classification                           | Count | Requirements                                                  |
| ---------------------------------------- | ----- | ------------------------------------------------------------- |
| **True Positive** (correctly found)      | ?     | List after manual check                                       |
| **True Negative** (correctly not found)  | ?     | Careers, Baker Clause, Gender Pay Gap                         |
| **False Positive** (found but incorrect) | ?     | Check if any "partial" items are actually absent              |
| **False Negative** (missed but present)  | ?     | **CRITICAL** - items that exist on website but scanner missed |

### Priority False Negatives to Investigate

Items most likely to be on the website but scanner may have missed:

1. Safeguarding Policy (almost all schools have this)
2. Behaviour Policy (almost all schools have this)
3. Pupil Premium Strategy (most schools publish this)
4. Governance Information (usually on the website)
5. SENCO details (usually on staff or SEND page)

---

## Success Criteria

### Minimum (Structural Only)

- [ ] Crawls 80+ pages successfully
- [ ] Processes 30+ PDFs
- [ ] Identifies 20+ requirements with some matching content
- [ ] Correctly excludes secondary-only requirements for primary school
- [ ] Stores results in `website_compliance_scans` table
- [ ] Stores pages in `ed_website_knowledge` for Ed's RAG
- [ ] GET endpoint returns stored scan
- [ ] False negative rate < 20% (fewer than 6 items present but missed)

### Full (With AI)

- [ ] All above, plus:
- [ ] AI assessment runs on all requirements with matching pages
- [ ] Evidence quotes extracted from website content
- [ ] Specific gaps and recommendations generated per requirement
- [ ] Quality scores differentiated (not all 3.0)
- [ ] Clarity scores differentiated (not all 3.0)
- [ ] Red flags identified where applicable
- [ ] Ofsted evidence items created in `documents` and `evidence_matches`
- [ ] False negative rate < 10%
