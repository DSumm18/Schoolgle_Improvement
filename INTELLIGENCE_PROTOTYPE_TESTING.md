# Intelligence Module — Prototype Testing Guide

## What This Is

A working prototype that can be demoed at ANY school. No hardcoded data — works automatically with their files.

## How to Demo (Step-by-Step)

### At the School

**1. Go to their Arbor (or SIMS, Bromcom)**
   - Navigate to Data > Export
   - Download the most recent school census XML file
   - (Optional) Download any assessment files they have: EYFSP, Phonics, KS1

**2. Create Google Drive folder**
   - In their Google Drive, create: `School Data` > `Census`
   - Upload the census XML file
   - If they have assessments: create `School Data` > `Assessments` and upload those

**3. Connect Schoolgle**
   - Open Schoolgle platform
   - Go to Settings → Data Connections
   - Click "Connect Google Drive"
   - Grant access to the `School Data` folder only

**4. Scan and Generate**
   - Go to Intelligence > Assessment Intelligence
   - Click "Scan Files"
   - See the files get detected
   - Dashboard auto-generates with THEIR data

**5. Show the Insights**
   - Pupil demographics (from census)
   - SEN breakdown (from census)
   - Assessment results (if they uploaded them)
   - All filtered by THEIR actual pupils, THEIR actual numbers

## What the School Sees

### Before Scan
```
┌─────────────────────────────────────────┐
│ Connect Your School Data                │
│                                         │
│ Step 1: Download Census Reports        │
│ Step 2: Upload to Google Drive         │
│ Step 3: Connect Schoolgle              │
│ Step 4: Scan & Generate                │
└─────────────────────────────────────────┘
```

### After Scan
```
┌─────────────────────────────────────────┐
│ Data Connector: PUPIL_DATA ✓ Active     │
│                                         │
│ ✓ Demographics     (census_spring.xml) │
│ ✓ SEN Data          (census_spring.xml) │
│ ✓ EYFSP Results    (eyfsp_2024.xml)     │
│ ⏳ Phonics          (Not uploaded)      │
│ ⏳ KS1              (Not uploaded)      │
│                                         │
│ Files detected: 3                       │
│ Pupils on roll: 408                     │
│                                         │
│ [View Pupil Intelligence Dashboard →]  │
└─────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Can scan Google Drive and find census XML files
- [ ] Can scan Google Drive and find assessment files (if present)
- [ ] UI shows which files were detected
- [ ] UI shows source of truth for each data type
- [ ] Can handle missing files gracefully (shows "not connected")
- [ ] Dashboard renders with real school data
- [ ] No hardcoded names or references anywhere
- [ ] Works for ANY school with DfE-standard files

## Known Issues (To Fix)

1. **Access token decryption** — Currently using placeholder
2. **File parsing** — Census parser created but not integrated into scan API
3. **Dashboard generation** — UI shows connection status but actual dashboard not built yet
4. **Error handling** — Need better error messages if scan fails

## Next Session Work

1. **Integrate census parser** into scan API
2. **Build assessment parser** (EYFSP, Phonics, KS1, KS2)
3. **Create dashboard template** that uses the parsed data
4. **Test with real files** from a school
5. **Add error handling** and user feedback

## Files to Test With

Create a test Google Drive folder with:
- `census_spring_2024.xml` (any school census XML)
- `eyfsp_2024.xml` (any EYFSP results file)
- `phonics_2024.xml` (any phonics screening file)

Then run the scan API and check the response.
