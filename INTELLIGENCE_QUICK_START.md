# Intelligence Module — Quick Start

## What This Does

The Intelligence Module turns your school's existing data files into actionable insights:

- 📊 **Assessment trends** — EYFSP, Phonics, KS1, KS2 performance over time
- 👥 **Cohort analysis** — Understand the "DNA" of each year group
- ⚖️ **Ofsted defence** — Disaggregate results by SEN, EAL, FSM
- 🔍 **Pupil tracking** — Individual journeys from Reception to Y6

## Setup Takes 5 Minutes

### Step 1: Gather Your Files

You likely already have these exports from your MIS (Arbor, SIMS, Bromcom):

**Required files (minimum):**
- ✅ School Census XML (most recent term)
- ✅ EYFSP assessment results

**Optional but recommended:**
- Phonics screening check results
- KS1 teacher assessments
- KS2 SATs results

### Step 2: Upload to Cloud Storage

**Google Drive** (recommended):
1. Create a folder: `School Data` → `Census`
2. Upload your census XML files
3. Create a folder: `School Data` → `Assessments`
4. Upload your assessment files

**Or OneDrive**:
- Same folder structure

### Step 3: Connect Schoolgle

1. Go to: `/dashboard/settings/data-connections`
2. Click: **Connect Google Drive** or **Connect OneDrive**
3. Grant permission to access your `School Data` folder
4. Done! Schoolgle auto-detects your files

### Step 4: View Your Dashboard

1. Go to: `/dashboard/intelligence`
2. See which files are connected
3. Once 2+ sources are connected, unlock:
   - Assessment Intelligence Dashboard
   - Pupil-Level Intelligence
   - Ofsted Defence Analysis

## What Each File Unlocks

| File | What You Get |
|------|-------------|
| **Census XML** | Pupil demographics, SEN %, EAL %, FSM %, attendance |
| **EYFSP Results** | Reception GLD trends, cohort comparison, SEN impact |
| **Phonics** | Y1/Y2 pass rates, retake analysis, phonics gaps |
| **KS1 Results** | Y2 attainment in R/W/M, greater depth, progress |
| **KS2 Results** | Y6 SATs, progress scores, national benchmarks |

## Data Privacy

- 🔒 Your data **stays in your cloud storage**
- 🔒 Schoolgle **never stores pupil data** in our database
- 🔒 Revoke access = instant data removal
- 🔒 GDPR-compliant by design

## Questions?

**Q: What if I only have some files?**
A: Start with census + one assessment. You'll still get valuable insights. Add more files over time to unlock additional features.

**Q: How often do I need to update?**
A: After each census term and assessment cycle. Schoolgle will auto-detect new files.

**Q: Can other schools see my data?**
A: No. Each school's data is isolated. Revoking access removes everything instantly.

**Q: What file formats are supported?**
A: DfE-standard XMLs (census) and CTFs/XMLs (assessments). These are the files your MIS already exports.

**Q: Will this work with my MIS?**
A: Yes! Arbor, SIMS, Bromcom, ScholarPack — they all export DfE-standard files.

## Need Help?

1. Check the full documentation: `docs/SCHOOLGLE_INTELLIGENCE_MODULE.md`
2. Look at the file examples in your test pack
3. Ask Ed: "How do I connect my census data?"
