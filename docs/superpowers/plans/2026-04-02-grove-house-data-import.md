# Grove House Primary Real Data Import Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import all 20 Grove House Primary assessment XML files + 2 SW3 census files from Google Drive into Supabase with full HMAC-SHA256 pseudonymisation, RLS enforcement, and zero PII in the database.

**Architecture:** XML files are parsed by the existing CTF parser (`ctf-xml-parser.ts`), pseudonymised server-side using `HMAC-SHA256(UPN, organizationId)`, and batch-inserted into `pupil_assessments_pseudo` + `school_assessment_imports` via a TypeScript script using the Supabase service role client. A new SW3 census parser handles staff workforce data separately.

**Tech Stack:** TypeScript, fast-xml-parser, @supabase/supabase-js, Node.js crypto (HMAC-SHA256), tsx runner, GWS CLI (Google Drive)

---

## Pre-Conditions (Already Verified)

| Item | Status | Detail |
|------|--------|--------|
| XML files downloaded | Done | 20 files in `.tmp-xml/` (6 FSP, 2 KS1, 1 KS2, 11 PHO) |
| CTF parser | Done | `apps/platform/src/lib/ctf-xml-parser.ts` — handles CTF v3 + legacy |
| Import script | Done | `scripts/import-grove-house-data.ts` — batch insert with pseudonymisation |
| Test script | Done | `scripts/test-ctf-parse.ts` — parser validation |
| Supabase tables | Done | `pupil_assessments_pseudo` (22 cols), `school_assessment_imports` (18 cols) |
| RLS policies | Done | org-scoped SELECT/INSERT for authenticated, full access for service_role |
| Organization | Done | `d9d1ac2c-5eff-4043-98f4-e1c43f616fd3` (Grove House Primary School) |

## Known Schema Constraints

**`pupil_assessments_pseudo`** — critical NOT NULL columns:
- `year_group` INTEGER NOT NULL — parser may return null for some records
- `import_id` UUID NOT NULL — import record must be created first (script handles this)
- `academic_year_start` INTEGER NOT NULL
- `assessment_period` TEXT NOT NULL
- `subject` TEXT NOT NULL

**`school_assessment_imports`** — the script uses `total_pupils` and `total_records` which have `DEFAULT 0`.

---

### Task 1: Validate Parser Output Against Schema

**Files:**
- Modify: `scripts/test-ctf-parse.ts`

**Goal:** Run the test parser and verify all records have the NOT NULL fields the DB requires. Fix any mismatches before importing.

- [ ] **Step 1: Run the test parser**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22
npx tsx scripts/test-ctf-parse.ts
```

Expected: Summary of all 20 files with pupil counts and record counts. No crash.

- [ ] **Step 2: Check for null year_group records**

Add validation output to the test script to count records with null year_group, null subject, or null assessment_year:

```typescript
// Add after the summary section in test-ctf-parse.ts
// Collect ALL records across all files for validation
const allRecords: Array<{file: string; rec: any}> = [];
for (const file of files) {
  const buffer = readFileSync(`${XML_DIR}/${file}`);
  const result = parseAssessmentXML(buffer, ORG_ID);
  for (const rec of result.records) {
    allRecords.push({ file, rec });
  }
}

console.log(`\n=== SCHEMA VALIDATION ===`);
const nullYearGroup = allRecords.filter(r => r.rec.year_group === null);
const nullSubject = allRecords.filter(r => !r.rec.subject);
const nullAssessmentYear = allRecords.filter(r => r.rec.assessment_year === null);

console.log(`Records with null year_group: ${nullYearGroup.length}`);
console.log(`Records with null subject: ${nullSubject.length}`);
console.log(`Records with null assessment_year: ${nullAssessmentYear.length}`);

if (nullYearGroup.length > 0) {
  console.log(`\nSample null year_group records:`);
  nullYearGroup.slice(0, 3).forEach(r => {
    console.log(`  File: ${r.file}, subject: ${r.rec.subject}, key_stage: ${r.rec.key_stage}`);
  });
}
```

- [ ] **Step 3: Run updated test parser**

```bash
npx tsx scripts/test-ctf-parse.ts
```

Expected: Counts of null values. If `nullYearGroup > 0`, proceed to Step 4. If zero, skip to Task 2.

- [ ] **Step 4: Fix import script to handle null year_group**

If any records have null year_group, update `scripts/import-grove-house-data.ts` to default null year_group based on key_stage or file type:

```typescript
// In the batch mapping, replace:
//   year_group: r.year_group,
// with:
year_group: r.year_group ?? (
  r.key_stage === 'EYFS' ? 0 :
  r.key_stage === 'KS1' ? 2 :
  r.key_stage === 'KS2' ? 6 :
  0 // safe default for Reception
),
```

- [ ] **Step 5: Commit validation improvements**

```bash
git add scripts/test-ctf-parse.ts scripts/import-grove-house-data.ts
git commit -m "fix: handle null year_group in import, add schema validation to test parser"
```

---

### Task 2: Run the Assessment Data Import

**Files:**
- Run: `scripts/import-grove-house-data.ts`

**Goal:** Import all 20 XML files into Supabase. All records pseudonymised. Zero PII.

- [ ] **Step 1: Run the import script**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22
npx tsx scripts/import-grove-house-data.ts
```

Expected output:
- `Found 20 XML files to import`
- `OK` line for each file with pupil count and record count
- `IMPORT COMPLETE` with totals
- `VERIFICATION` section with DB counts
- Sample rows showing only hashed pupil IDs, no names
- `All pupil_hash values are valid SHA-256 hashes: true`

- [ ] **Step 2: Verify import succeeded — record the output**

Copy the full terminal output into `~/dev/_brain/sessions/real-data-import/chat.md` under a `## WORKER → JARVIS` section. Include:
- Total files imported
- Total records inserted
- Unique pseudonymised pupils
- Sample rows (proving no PII)
- SHA-256 hash validation result

- [ ] **Step 3: If import fails, diagnose and fix**

Common failure modes:
- `null value in column "year_group"` → Apply Task 1 Step 4 fix
- `null value in column "import_id"` → Bug in import record creation; check `importRecord` is not null
- `duplicate key` → Clear existing data first (script already does this)
- Connection timeout → Reduce BATCH_SIZE to 200

Re-run after fixing.

---

### Task 3: Verify Data Integrity in Supabase

**Files:**
- None (SQL queries only)

**Goal:** Confirm correct data, no PII, proper counts.

- [ ] **Step 1: Count records by assessment type**

Run via Supabase MCP:

```sql
SELECT 
  i.source_system,
  i.file_name,
  i.total_pupils,
  i.total_records,
  i.academic_year_start,
  i.assessment_period,
  i.subjects_included,
  i.status
FROM school_assessment_imports i
WHERE i.organization_id = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3'
ORDER BY i.file_name;
```

Expected: 20 rows, all with status 'complete'.

- [ ] **Step 2: Count unique pupils and records**

```sql
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT pupil_hash) as unique_pupils,
  COUNT(DISTINCT subject) as unique_subjects,
  MIN(academic_year_start) as earliest_year,
  MAX(academic_year_start) as latest_year
FROM pupil_assessments_pseudo
WHERE organization_id = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';
```

Expected: Hundreds of records, dozens of unique pupils, multiple subjects.

- [ ] **Step 3: Verify assessment distribution**

```sql
SELECT 
  subject,
  COUNT(*) as record_count,
  COUNT(DISTINCT pupil_hash) as pupil_count,
  COUNT(DISTINCT academic_year_start) as year_count
FROM pupil_assessments_pseudo
WHERE organization_id = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3'
GROUP BY subject
ORDER BY record_count DESC;
```

Expected: Records across maths, reading, writing, science, phonics, EYFS areas.

- [ ] **Step 4: PII leak check — verify NO real data in any column**

```sql
-- Check pupil_hash is always 64-char hex (no names or UPNs leaked)
SELECT pupil_hash 
FROM pupil_assessments_pseudo 
WHERE organization_id = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3'
  AND (
    LENGTH(pupil_hash) != 64 
    OR pupil_hash !~ '^[a-f0-9]{64}$'
  );
```

Expected: ZERO rows. Any result = PII leak = STOP AND FIX.

- [ ] **Step 5: Record all verification results in chat.md**

Append all SQL results to `~/dev/_brain/sessions/real-data-import/chat.md`.

---

### Task 4: Verify RLS Isolation (Cross-Org Test)

**Files:**
- None (SQL queries only)

**Goal:** Prove that a different organization CANNOT see Grove House data.

- [ ] **Step 1: Test RLS — query as anonymous/different org**

```sql
-- First, find another org that exists
SELECT id, name FROM organizations 
WHERE id != 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3' 
LIMIT 1;
```

- [ ] **Step 2: Verify RLS blocks cross-org access**

The RLS policies use `organization_members.user_id = auth.uid()`. Since the service_role bypasses RLS, we verify the policy SQL is correct:

```sql
-- Verify RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('pupil_assessments_pseudo', 'school_assessment_imports');

-- Verify the policies exist and are correct
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('pupil_assessments_pseudo', 'school_assessment_imports')
ORDER BY tablename, policyname;
```

Expected: 
- `relrowsecurity = true` for both tables
- Policies check `organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`

- [ ] **Step 3: Test with anon key (should get zero results)**

```bash
# Use anon key (no auth) — should return empty array due to RLS
source apps/platform/.env.local
curl -s "https://ygquvauptwyvlhkyxkwy.supabase.co/rest/v1/pupil_assessments_pseudo?organization_id=eq.d9d1ac2c-5eff-4043-98f4-e1c43f616fd3&select=pupil_hash&limit=5" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
```

Expected: `[]` (empty array — anon user has no org membership, RLS blocks access).

- [ ] **Step 4: Record RLS verification in chat.md**

---

### Task 5: Download and Parse SW3 Census Files (Staff Data)

**Files:**
- Create: `scripts/parse-sw3-census.ts`

**Goal:** Download the 2 School Workforce Census XML files and extract staff role/qualification data (NO NI numbers, NO personal addresses).

- [ ] **Step 1: Download SW3 census files**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement/.tmp-xml
source ~/.zshrc

# SW3 2023
gws drive files get --params '{"fileId": "1WCZ-dShs_PRf-CqGbMWMLGG3g72L2iIu", "alt": "media"}' -o sw3_2023.xml

# SW3 2022  
gws drive files get --params '{"fileId": "1e95TKr2UB2_nX0eHkRfYdjaYj3-9gcDE", "alt": "media"}' -o sw3_2022.xml
```

- [ ] **Step 2: Inspect SW3 XML structure**

```bash
head -100 .tmp-xml/sw3_2023.xml
```

Identify the root element, staff record structure, and available fields. Document which fields contain PII (NI number, address, DOB) that MUST NOT be stored.

- [ ] **Step 3: Create SW3 census parser script**

Create `scripts/parse-sw3-census.ts`:

```typescript
/**
 * Parse School Workforce Census (SW3) XML files.
 * Extract staff roles, qualifications, and FTE — NO PII stored.
 *
 * Run: npx tsx scripts/parse-sw3-census.ts
 */
import { readFileSync } from "fs";
import { XMLParser } from "fast-xml-parser";

const XML_DIR = ".tmp-xml";
const files = ["sw3_2023.xml", "sw3_2022.xml"];

const parser = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
});

for (const file of files) {
  try {
    const xml = readFileSync(`${XML_DIR}/${file}`, "utf-8");
    const doc = parser.parse(xml);
    
    // Log root keys to understand structure
    console.log(`\n=== ${file} ===`);
    console.log(`Root keys: ${Object.keys(doc).join(", ")}`);
    
    // Navigate to staff records (structure TBD after inspection)
    const root = doc["SchoolWorkforceCensus"] ?? doc["SWFCensus"] ?? doc["sw3"] ?? Object.values(doc)[0];
    if (root && typeof root === "object") {
      console.log(`Second-level keys: ${Object.keys(root as object).join(", ")}`);
    }
    
    // Count staff if we can find them
    // This will be refined after Step 2 inspection
  } catch (err) {
    console.error(`Error parsing ${file}:`, err);
  }
}
```

- [ ] **Step 4: Run and inspect output**

```bash
npx tsx scripts/parse-sw3-census.ts
```

Document the XML structure discovered. Identify safe fields (role, qualifications, FTE, contract type) vs PII fields (NI number, DOB, address, name).

- [ ] **Step 5: Commit SW3 exploration**

```bash
git add scripts/parse-sw3-census.ts
git commit -m "feat: add SW3 census parser exploration script"
```

**Note:** Full SW3 → staff_directory import is a follow-up task. This step focuses on understanding the data structure and confirming what's available. Staff names CAN be stored in `staff_directory` (they're employees, not children — different GDPR basis). NI numbers and home addresses MUST NOT be stored.

---

### Task 6: Create Data Connection Record

**Files:**
- None (SQL insert only)

**Goal:** Link Grove House org to their Google Drive assessments folder.

- [ ] **Step 1: Insert data connection record**

```sql
INSERT INTO school_data_connections (
  organization_id,
  provider,
  folder_id,
  folder_name,
  is_active,
  last_scan_at,
  scan_status,
  total_files,
  detected_folders
) VALUES (
  'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3',
  'google',
  '1U1kwLhgEy6-3HW_9i3E8CBR9cFZaX-Bf',
  'Assessments',
  true,
  NOW(),
  'complete',
  20,
  '{"assessments": "1U1kwLhgEy6-3HW_9i3E8CBR9cFZaX-Bf"}'::jsonb
)
ON CONFLICT (organization_id, provider) 
DO UPDATE SET 
  folder_id = EXCLUDED.folder_id,
  folder_name = EXCLUDED.folder_name,
  last_scan_at = NOW(),
  scan_status = 'complete',
  total_files = 20;
```

- [ ] **Step 2: Verify the connection record**

```sql
SELECT id, provider, folder_name, total_files, scan_status, last_scan_at
FROM school_data_connections
WHERE organization_id = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';
```

Expected: 1 row with provider='google', total_files=20, scan_status='complete'.

---

### Task 7: Verification Before Completion

**Files:**
- Modify: `~/dev/_brain/sessions/real-data-import/chat.md`

**Goal:** Run full verification checklist and write ALL evidence to chat.md. Use `superpowers:verification-before-completion`.

- [ ] **Step 1: Run npm build to verify no regressions**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement/apps/platform
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22
npm run build 2>&1 | tail -20
```

Expected: Build succeeds (or only pre-existing warnings).

- [ ] **Step 2: Test the intelligence API endpoint**

```bash
source apps/platform/.env.local
curl -s "https://ygquvauptwyvlhkyxkwy.supabase.co/rest/v1/pupil_assessments_pseudo?organization_id=eq.d9d1ac2c-5eff-4043-98f4-e1c43f616fd3&select=subject,attainment_level,academic_year_start&limit=10" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

Expected: 10 rows of assessment data with pseudonymised hashes only.

- [ ] **Step 3: Final PII audit**

```sql
-- Comprehensive PII check across ALL text columns
SELECT 'pupil_assessments_pseudo' as tbl, pupil_hash, subject, attainment_level, assessment_period, send_type, gender, prior_attainment_band
FROM pupil_assessments_pseudo
WHERE organization_id = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3'
  AND (
    -- Check if pupil_hash looks like a UPN (letter + numbers)
    pupil_hash ~ '^[A-Z][0-9]'
    -- Check if any text field contains a name-like pattern
    OR subject ~ '[A-Z][a-z]+ [A-Z][a-z]+'
    OR attainment_level ~ '[A-Z][a-z]+ [A-Z][a-z]+'
  )
LIMIT 5;
```

Expected: ZERO rows.

- [ ] **Step 4: Write completion report to chat.md**

Append to `~/dev/_brain/sessions/real-data-import/chat.md`:

```markdown
## WORKER → JARVIS — Import Complete

### Summary
- Files imported: X/20
- Total assessment records: X
- Unique pseudonymised pupils: X
- Assessment types: FSP, PHO, KS1, KS2
- Academic years covered: X-X
- SW3 census files: downloaded, structure documented

### Verification Evidence
1. **Build check**: [PASS/FAIL] — output attached
2. **Record counts**: [numbers from SQL]
3. **PII audit**: ZERO PII found in database
4. **SHA-256 validation**: All hashes valid 64-char hex
5. **RLS test**: Anon key returns empty array (blocked by RLS)
6. **Cross-org test**: RLS policies confirmed org-scoped
7. **Data connection**: Record created linking org to Drive folder

### Security Confirmation
- [ ] No pupil names in Supabase
- [ ] No DOBs in Supabase
- [ ] No UPNs in plaintext in Supabase
- [ ] No NI numbers stored
- [ ] All pupil_hash values are valid HMAC-SHA256
- [ ] RLS enabled on both tables
- [ ] RLS policies scope to organization_members
- [ ] Anon key cannot access data
```

- [ ] **Step 5: Commit all changes**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement
git add scripts/ apps/platform/src/lib/ctf-xml-parser.ts
git commit -m "feat: import Grove House Primary real assessment data — 20 XML files, pseudonymised, RLS verified"
```

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `scripts/test-ctf-parse.ts` | Modify | Add schema validation checks |
| `scripts/import-grove-house-data.ts` | Modify | Fix null year_group handling |
| `scripts/parse-sw3-census.ts` | Create | SW3 census exploration script |
| `apps/platform/src/lib/ctf-xml-parser.ts` | Read only | Existing parser (no changes needed) |
| `.tmp-xml/*.xml` | Read only | 20 assessment + 2 SW3 census files |
| `~/dev/_brain/sessions/real-data-import/chat.md` | Modify | Write all evidence |

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| null year_group crashes import | HIGH | Default from key_stage (Task 1 Step 4) |
| PII leaks into database | CRITICAL | SHA-256 validation + PII audit queries (Task 3, 7) |
| RLS not enforced | CRITICAL | Verified RLS enabled + anon key test (Task 4) |
| Parser can't handle XML format | MEDIUM | Already tested with test_fsp.xml (existing test script) |
| Supabase rate limits | LOW | Batch size 500, sequential file processing |
