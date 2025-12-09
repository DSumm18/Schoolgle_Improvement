# DfE Data Auto-Detection Summary

## ✅ What We Can Auto-Detect (No User Input Needed)

### School Identity
- ✅ **School Name** - From `dfe_data.schools.name`
- ✅ **URN** - From `dfe_data.schools.urn` (validates user input)
- ✅ **Full Address** - From address fields
- ✅ **Postcode** - From `dfe_data.schools.postcode`
- ✅ **Local Authority** - From `dfe_data.schools.la_name` and `la_code`
- ✅ **Contact Details** - Phone, email, website

### School Characteristics
- ✅ **Phase** - Primary, Secondary, etc. (`phase_name`)
- ✅ **School Type** - Academy, Maintained, etc. (`type_name`)
- ✅ **Status** - Open, Closed (`status_name`) - for validation
- ✅ **Trust Information** - Trust name, UID (if part of MAT)

### Framework Detection (Automatic)
- ✅ **Ofsted vs ISI** - Detected from `type_name`:
  - If `type_name` contains "Independent" → ISI required, Ofsted NOT required
  - Otherwise → Ofsted required, ISI NOT required

### Contextual Data (For Assessment Tool)
- ✅ **Area Deprivation** - IMD scores, deciles (via joins)
- ✅ **LA Finance** - DSG deficits, SEND spending (via joins)
- ✅ **Demographics** - Population data (via joins)

---

## ❓ What We Must Ask Schools

### 1. Faith/Religious Information (Critical for Folder Structure)

**Why we need to ask:**
- `religious_character` field may not exist in DfE `schools` table
- Even if it exists, data may be outdated or incomplete
- User confirmation ensures accuracy

**Questions to ask:**
1. **"Is this a church/faith school?"** (Yes/No)
2. **If Yes: "Which faith framework applies?"**
   - ☐ Anglican/Methodist → SIAMS
   - ☐ Catholic → CSI
   - ☐ Muslim → Section 48 (Muslim)
   - ☐ Jewish → Section 48 (Jewish/Pikuach)
   - ☐ Hindu → Section 48 (Hindu)
   - ☐ Sikh → Section 48 (Sikh)
   - ☐ Other → Section 48 (Other)

### 2. User Preferences (Optional)

- **Evidence Storage Location** - Google Drive, OneDrive, or Local
- **Contact Person** - If different from signup user
- **Inspection Cycle** - When is next inspection due? (for planning)

---

## 🔄 Signup Flow (With Auto-Detection)

### Step 1: URN Entry
```
User enters: 100000
↓
System queries: /api/school/lookup?urn=100000
↓
Returns: Full school data + detected frameworks
```

### Step 2: Auto-Population
```
✅ School Name: "Oakwood Primary School"
✅ Address: "123 School Lane, Town, Postcode"
✅ Phase: "Primary"
✅ LA: "West Yorkshire"
✅ Type: "Academy converter"
✅ Trust: "Inspire Academy Trust" (if applicable)
```

### Step 3: Framework Detection
```
✅ Ofsted - Detected (Academy school)
❓ SIAMS - Is this a Church of England or Methodist school?
❓ CSI - Is this a Catholic school?
❓ Section 48 - Is this a Muslim/Jewish/Hindu/Sikh school?
```

### Step 4: Validation
```
If user unchecks "Ofsted":
⚠️ Warning: "Your school type (Academy) typically requires Ofsted inspection. 
Are you sure you don't need the Ofsted framework?"
[Yes, I need Ofsted] [No, I'm independent] [I'm not sure]
```

### Step 5: Confirmation & Generation
```
User confirms frameworks →
System generates folder structure ZIP →
User downloads and extracts →
Done!
```

---

## 📊 Data Flow Diagram

```
User enters URN
    ↓
/api/school/lookup
    ↓
Query dfe_data.schools (URN lookup)
    ↓
Return school data
    ↓
detectFrameworks(schoolData)
    ↓
Auto-detect: Ofsted vs ISI (from type_name)
    ↓
Show detected + ask about faith frameworks
    ↓
User confirms/selects frameworks
    ↓
Generate folder structure ZIP
    ↓
Enable assessment tabs in dashboard
```

---

## 🎯 Implementation Status

### ✅ Completed
- [x] DfE client connection (`lib/supabase-dfe.ts`)
- [x] URN lookup API (`/api/school/lookup`)
- [x] Framework detection logic
- [x] Folder structure generator script
- [x] ZIP file generation

### 🔄 In Progress
- [ ] Add DfE env vars to `.env.local`
- [ ] Run schema verification script
- [ ] Update signup flow with URN lookup
- [ ] Add framework selection UI with validation
- [ ] Test with real URNs

### 📋 Next Steps
1. Add environment variables
2. Verify schema (check for religious_character field)
3. Update signup page to use URN lookup
4. Add framework selection component
5. Add validation prompts
6. Test end-to-end flow

---

## 🔍 Key Decision Points

### If `religious_character` EXISTS in DfE data:
- ✅ Can auto-detect faith frameworks
- ✅ Reduce user questions
- ✅ More accurate detection

### If `religious_character` DOES NOT EXIST:
- ❓ Must ask user about faith designation
- ❓ Cannot auto-detect SIAMS/CSI/Section 48
- ✅ Still works, just requires user input

**Recommendation:** Always ask user to confirm faith designation, even if detected from DfE data. This ensures accuracy and allows for corrections.

---

## 📝 Summary

**Auto-Detect (No Questions):**
- School identity (name, address, URN, LA, trust)
- Phase and type
- **Ofsted vs ISI** (from type_name)

**Must Ask:**
- **Faith/Religious designation** (for SIAMS/CSI/Section 48)
- User preferences (storage, contacts)

**Result:**
- Faster signup (auto-population)
- Accurate framework detection
- Smart validation (warns if user unchecks required framework)
- Correct folder structure generation

