# DfE Data Warehouse - Auto-Detection Analysis

## 🎯 Purpose
Determine what data we can auto-detect from DfE warehouse vs what we need to ask schools during signup.

---

## ✅ DATA WE CAN AUTO-DETECT (From DfE Warehouse)

### 1. School Identity & Basic Info
- ✅ **URN** - Unique Reference Number
- ✅ **School Name** - Official name
- ✅ **Address** - Full address, postcode
- ✅ **Local Authority** - LA code and name
- ✅ **Phase** - Primary, Secondary, etc. (`phase_name`)
- ✅ **School Type** - Academy, Maintained, etc. (`type_name`)
- ✅ **Status** - Open, Closed, etc. (`status_name`)
- ✅ **Trust Information** - Trust name, UID (if part of MAT)
- ✅ **Contact Details** - Phone, email, website

### 2. Framework Detection (Critical for Folder Structure)

**From `dfe_data.schools` table:**

| Field | What It Tells Us | Framework Impact |
|-------|------------------|------------------|
| `type_name` | Academy, Maintained, Independent, etc. | ✅ Ofsted vs ISI |
| `phase_name` | Primary, Secondary, etc. | ℹ️ Context only |
| `status_name` | Open, Closed | ⚠️ Validation |
| `trust_name` | MAT membership | ℹ️ Context only |

**⚠️ MISSING from DfE data:**
- ❌ **Religious Character** - Not in standard GIAS export
- ❌ **Faith Designation** - Church of England, Catholic, Muslim, etc.
- ❌ **Denomination** - Anglican, Methodist, etc.

**🔍 Need to check:** Does `dfe_data.schools` have a `religious_character` or `religious_ethos` field?

### 3. Contextual Data (For Assessment Tool)

**Available:**
- ✅ **Area Deprivation** - IMD scores, deciles (via `area_demographics`)
- ✅ **LA Finance** - DSG deficits, SEND spending (via `local_authority_finance`)
- ✅ **Demographics** - Population data, age distributions

**Future (when imported):**
- ⏳ **KS2/KS1/KS4 Results** - Performance data
- ⏳ **Workforce** - Staff data
- ⏳ **Census** - Pupil numbers, characteristics
- ⏳ **Attendance** - Attendance rates
- ⏳ **Exclusions** - Exclusion data

---

## ❓ DATA WE STILL NEED TO ASK SCHOOLS

### 1. Framework-Specific (Required for Folder Structure)

**Religious/Faith Information:**
- ❓ **Is this a church/faith school?** (Yes/No)
- ❓ **If yes, which faith framework applies?**
  - Anglican/Methodist → SIAMS
  - Catholic → CSI
  - Muslim → Section 48 (Muslim)
  - Jewish → Section 48 (Jewish/Pikuach)
  - Hindu → Section 48 (Hindu)
  - Sikh → Section 48 (Sikh)
  - Other → Section 48 (Other)

**Why we need to ask:**
- DfE GIAS data doesn't reliably include religious character in standard exports
- Some schools may have changed designation
- User confirmation ensures accuracy

### 2. School-Specific Preferences

**Optional but helpful:**
- ❓ **Preferred evidence storage location** (Google Drive, OneDrive, Local)
- ❓ **Contact person for inspections** (if different from signup user)
- ❓ **Inspection cycle information** (when is next inspection due?)

### 3. User Account Info (Already in signup)

- ✅ User name, email, role
- ✅ Organization name
- ✅ Job title

---

## 🔄 RECOMMENDED SIGNUP FLOW

### Step 1: URN Entry & Auto-Lookup
```
User enters URN → Query DfE warehouse → Auto-populate:
- School name ✅
- Address ✅
- Phase ✅
- Type ✅
- LA ✅
- Trust (if applicable) ✅
```

### Step 2: Framework Detection Logic

```typescript
function detectFrameworks(schoolData: DfESchoolData): FrameworkConfig {
    const config = {
        ofsted: false,
        isi: false,
        siams: false,
        csi: false,
        section48Muslim: false,
        section48Jewish: false,
        // ... other faith frameworks
    };
    
    // Auto-detect from type_name
    if (schoolData.type_name?.includes('Independent')) {
        config.isi = true;
        config.ofsted = false; // Independent schools use ISI, not Ofsted
    } else {
        config.ofsted = true; // All maintained/academy schools use Ofsted
    }
    
    // Faith frameworks - CANNOT auto-detect, must ask user
    // (Religious character not reliably in DfE data)
    
    return config;
}
```

### Step 3: Smart Questions with Validation

**Show detected frameworks:**
```
✅ Ofsted - Detected (Maintained school)
❓ SIAMS - Is this a Church of England or Methodist school?
❓ CSI - Is this a Catholic school?
❓ Section 48 - Is this a Muslim/Jewish/Hindu/Sikh school?
```

**If user says "No" to something they should have:**
```
⚠️ Warning: Your school type (Academy) typically requires Ofsted inspection. 
Are you sure you don't need the Ofsted framework?
[Yes, I need Ofsted] [No, I'm independent] [I'm not sure]
```

### Step 4: Confirm & Generate

Once frameworks confirmed:
- Generate folder structure ZIP
- Enable relevant assessment tabs in dashboard
- Store school profile with framework selections

---

## 📊 IMPLEMENTATION PLAN

### Phase 1: DfE Integration (Now)

1. **Create DfE client:**
   ```typescript
   // lib/supabase-dfe.ts
   export const dfeClient = createClient(
     process.env.DFE_SUPABASE_URL!,
     process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!
   );
   ```

2. **URN Lookup API:**
   ```typescript
   // app/api/school/lookup/route.ts
   // Query dfe_data.schools by URN
   // Return: school data + detected frameworks
   ```

3. **Update signup flow:**
   - Add URN input field
   - Auto-lookup on URN entry
   - Pre-populate form fields
   - Show detected frameworks

### Phase 2: Framework Detection (Now)

1. **Detection logic:**
   - Ofsted vs ISI (from `type_name`)
   - Faith frameworks (ask user - cannot auto-detect)

2. **Validation prompts:**
   - If user unchecks required framework → show warning
   - Explain why they need it
   - Allow override if they're certain

### Phase 3: Folder Structure Generation (Already done)

- Use selected frameworks to generate ZIP
- Include README with instructions
- Download button in UI

---

## 🔍 VERIFICATION QUERIES

**Check if religious character exists in schools table:**

```sql
-- Check schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'dfe_data' 
  AND table_name = 'schools'
  AND (column_name ILIKE '%religious%' 
       OR column_name ILIKE '%faith%' 
       OR column_name ILIKE '%denomination%'
       OR column_name ILIKE '%ethos%');
```

**If religious character exists:**
- ✅ Can auto-detect faith frameworks
- ✅ Reduce user questions

**If religious character doesn't exist:**
- ❌ Must ask user about faith designation
- ❌ Cannot auto-detect SIAMS/CSI/Section 48

---

## 📋 SUMMARY

### Auto-Detect ✅
- School identity (name, address, URN)
- Phase (primary/secondary)
- Type (maintained/academy/independent)
- Ofsted vs ISI (from type)
- LA context
- Trust membership

### Must Ask ❓
- **Religious/Faith designation** (for SIAMS/CSI/Section 48)
- User preferences (storage location, etc.)

### Future Auto-Detect ⏳
- Performance data (when KS2/KS1/KS4 imported)
- Workforce data
- Attendance/exclusions
- Census data

---

## 🚀 NEXT STEPS

1. ✅ Verify DfE database access
2. ✅ Check if `religious_character` field exists in `dfe_data.schools`
3. ✅ Create DfE client connection
4. ✅ Build URN lookup API
5. ✅ Update signup flow with auto-population
6. ✅ Implement framework detection logic
7. ✅ Add validation prompts for framework selection

