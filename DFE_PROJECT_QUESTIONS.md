# Questions for DfE Project Team

**From:** Schoolgle Improvement Project Team  
**To:** DfE Data Warehouse Project Team  
**Date:** 2025-12-01  
**Purpose:** Integration and data access clarification

---

## 🔍 CRITICAL QUESTIONS

### 1. Import Completion Status

**Question:** Why do some tables show 0 rows when we expected data?

**Context:**
- We see `dfe_data.schools` should have ~34,750 records
- We see `dfe_data.area_demographics` should have ~32,844 records
- We see `dfe_data.local_authority_finance` should have ~239,834 records

**Questions:**
- ✅ Are these tables actually populated with data?
- ✅ Can you confirm the row counts in each table?
- ✅ If tables are empty, what's the status of the import process?

**SQL to Check:**
```sql
SELECT COUNT(*) FROM dfe_data.schools;
SELECT COUNT(*) FROM dfe_data.area_demographics;
SELECT COUNT(*) FROM dfe_data.local_authority_finance;
```

---

### 2. Table Names and Schema Structure

**Question:** What are the exact table names and which schema are they in?

**What We Know:**
- Tables should be in `dfe_data` schema
- Views created in `public` schema pointing to `dfe_data` tables

**Questions:**
- ✅ Are tables in `dfe_data` schema or `public` schema?
- ✅ What are the exact table names? (case-sensitive?)
- ✅ Are there any naming differences from what we documented?

**Expected Tables:**
- `dfe_data.schools`
- `dfe_data.area_demographics`
- `dfe_data.local_authority_finance`
- `dfe_data.ks2_results`
- `dfe_data.ks1_results`
- `dfe_data.ks4_results`
- `dfe_data.workforce`
- `dfe_data.census`
- `dfe_data.attendance`
- `dfe_data.exclusions`

---

### 3. Data Location - Which Table Has School Data?

**Question:** Where is the master school data located?

**What We Need:**
- Primary table with all schools (34,750+ records)
- School identifiers (URN, name, LA code, etc.)
- School characteristics (type, phase, status)

**Questions:**
- ✅ Is it `dfe_data.schools`?
- ✅ Or `public.schools` (view)?
- ✅ What's the primary key? (URN?)
- ✅ Can you provide a sample query to get one school?

**Expected Query:**
```sql
SELECT * FROM dfe_data.schools WHERE urn = 100000 LIMIT 1;
```

---

### 4. View Creation Approach

**Question:** How should we access the data - via views or direct schema access?

**What We Did:**
- Created views in `public` schema pointing to `dfe_data` tables
- Views: `public.schools`, `public.area_demographics`, etc.

**Questions:**
- ✅ Are the views working correctly?
- ✅ Should we use views (`public.schools`) or direct access (`dfe_data.schools`)?
- ✅ Do views have proper permissions?
- ✅ Are there any RLS policies we need to be aware of?

**Check Views:**
```sql
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' 
AND (table_name LIKE '%school%' OR table_name LIKE '%area%');
```

---

### 5. Permissions and Access Requirements

**Question:** What permissions do we need and how do we access the data?

**What We Have:**
- Service Role Key (full access)
- Supabase URL

**Questions:**
- ✅ Can we use Service Role Key for all queries?
- ✅ Do we need Anon Key for client-side access?
- ✅ Are there any RLS (Row Level Security) policies enabled?
- ✅ What's the recommended access method (Service Role vs Anon)?

**Current Setup:**
- Service Role Key: Configured in `.env.local`
- Should we use this or get Anon Key?

---

### 6. Column Structure - What Fields Are Available?

**Question:** What columns/fields are actually in each table?

**What We Need:**
- Exact column names (case-sensitive?)
- Data types
- Which fields are populated vs NULL
- Key identifiers for joining tables

**Questions:**
- ✅ Can you provide `DESCRIBE` or `\d` output for key tables?
- ✅ What are the primary/foreign keys?
- ✅ Which columns are most commonly used?
- ✅ Are there any computed/calculated columns?

**Tables We Need Column Info For:**
1. `dfe_data.schools` - What fields beyond URN, name, LA code?
2. `dfe_data.area_demographics` - What deprivation fields?
3. `dfe_data.local_authority_finance` - What finance fields?

**SQL to Check:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'dfe_data' 
AND table_name = 'schools'
ORDER BY ordinal_position;
```

---

### 7. Data Freshness and Update Frequency

**Question:** How current is the data and how often is it updated?

**What We Know:**
- Schools: Latest GIAS snapshot
- IMD: 2019 data
- Finance: 2019-20, 2020-21, 2022-23, 2023-24

**Questions:**
- ✅ When was the data last updated?
- ✅ What's the update schedule?
- ✅ How do we know when new data is available?
- ✅ Is there an automated update process?

---

## 📋 ADDITIONAL QUESTIONS

### 8. Linking Data Between Tables

**Question:** How do we join tables together?

**Questions:**
- ✅ How do we link schools to deprivation data? (via LA code? LSOA code?)
- ✅ How do we link schools to finance data? (via LA code?)
- ✅ Are there linking tables we should use?
- ✅ What's the relationship structure?

**Expected Relationships:**
- Schools → LA Finance (via `la_code`)
- Schools → Area Demographics (via `lsoa_code` or `la_code`?)

---

### 9. Performance Data Status

**Question:** What's the status of performance data (KS2, KS1, KS4)?

**Questions:**
- ✅ Are KS2, KS1, KS4 tables populated?
- ✅ If not, when will they be?
- ✅ What years are available?
- ✅ Are there any known issues with performance data imports?

---

### 10. Error Handling

**Question:** What should we do if queries fail?

**Questions:**
- ✅ What are common error scenarios?
- ✅ How do we handle missing data?
- ✅ Are there any data quality issues we should know about?
- ✅ What's the best way to report issues?

---

## 🎯 WHAT WE NEED

**Priority 1 (Critical):**
1. ✅ Confirm tables have data (row counts)
2. ✅ Confirm exact table names and schema
3. ✅ Confirm access method (views vs direct)
4. ✅ Get column structure for key tables

**Priority 2 (Important):**
5. ✅ Understand linking relationships
6. ✅ Confirm permissions setup
7. ✅ Get sample queries that work

**Priority 3 (Nice to Have):**
8. ✅ Update schedule
9. ✅ Performance data status
10. ✅ Error handling guidance

---

## 📞 HOW TO RESPOND

**Option 1: SQL Queries**

Run these queries in Supabase SQL Editor and share results:

```sql
-- Table row counts
SELECT 'schools' as table_name, COUNT(*) as row_count FROM dfe_data.schools
UNION ALL
SELECT 'area_demographics', COUNT(*) FROM dfe_data.area_demographics
UNION ALL
SELECT 'local_authority_finance', COUNT(*) FROM dfe_data.local_authority_finance;

-- Column structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'dfe_data'
AND table_name = 'schools'
ORDER BY ordinal_position;
```

**Option 2: Screenshots**
- Supabase Table Editor showing data
- SQL Editor showing query results
- Settings → API showing keys

**Option 3: Documentation**
- Share any existing docs
- Schema diagrams
- Data dictionary

---

## ✅ NEXT STEPS AFTER ANSWERS

Once we have answers, we will:
1. ✅ Verify table locations and data
2. ✅ Create/update views if needed
3. ✅ Test connection and queries
4. ✅ Update integration code
5. ✅ Document final setup

---

**Thank you! Looking forward to your responses.** 🚀






