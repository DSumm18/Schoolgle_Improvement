# DfE Data Warehouse Integration Setup

## 🚀 Quick Start

### 1. Add Environment Variables

Add to `apps/platform/.env.local`:

```env
# DfE Data Warehouse (separate Supabase project)
DFE_SUPABASE_URL=https://ygquvauptwyvlhkyxkwy.supabase.co
DFE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA
```

### 2. Verify Connection

Run the verification script:

```bash
node scripts/verify-dfe-schema.mjs
```

This will:
- ✅ Check database connection
- ✅ List available columns in `schools` table
- ✅ Check if religious/faith fields exist
- ✅ Test a sample URN lookup

### 3. Test URN Lookup API

```bash
# Test endpoint
curl "http://localhost:3000/api/school/lookup?urn=100000"
```

Expected response:
```json
{
  "success": true,
  "school": {
    "urn": 100000,
    "name": "School Name",
    "type_name": "Academy converter",
    "phase_name": "Primary",
    ...
  },
  "frameworks": {
    "ofsted": true,
    "isi": false,
    "siams": false,
    ...
  }
}
```

---

## 📊 What We Can Auto-Detect

### ✅ Automatically Detected

| Data | Source | Use Case |
|------|--------|----------|
| School Name | `dfe_data.schools.name` | Auto-populate signup form |
| URN | `dfe_data.schools.urn` | Validation, linking |
| Address | `dfe_data.schools.*address*` | Auto-populate |
| Phase | `dfe_data.schools.phase_name` | Context |
| Type | `dfe_data.schools.type_name` | **Ofsted vs ISI detection** |
| LA | `dfe_data.schools.la_name` | Auto-populate |
| Trust | `dfe_data.schools.trust_name` | MAT context |
| Status | `dfe_data.schools.status_name` | Validation (must be "Open") |

### ❓ Must Ask User

| Data | Why | Framework Impact |
|------|-----|------------------|
| **Religious Character** | Not reliably in DfE data | SIAMS, CSI, Section 48 |
| **Faith Designation** | May be missing/outdated | Determines faith framework |
| **Storage Preference** | User choice | Google Drive vs OneDrive |

---

## 🔄 Framework Detection Logic

### Auto-Detection (From DfE Data)

```typescript
// Ofsted vs ISI
if (type_name.includes('Independent')) {
  frameworks.isi = true;
  frameworks.ofsted = false;
} else {
  frameworks.ofsted = true;
  frameworks.isi = false;
}
```

### User Confirmation Required

```typescript
// Faith frameworks - must ask user
if (userConfirmsChurchSchool) {
  if (denomination === 'Anglican' || denomination === 'Methodist') {
    frameworks.siams = true;
  } else if (denomination === 'Catholic') {
    frameworks.csi = true;
  }
  // ... other faith frameworks
}
```

---

## 📝 Signup Flow Integration

### Current Flow (Before DfE Integration)

1. User enters school name manually
2. User selects phase manually
3. User checks "Church school" checkbox
4. User enters URN manually

### New Flow (With DfE Integration)

1. **User enters URN** → Auto-lookup
2. **System auto-populates:**
   - School name ✅
   - Address ✅
   - Phase ✅
   - LA ✅
   - Trust (if applicable) ✅
3. **System detects frameworks:**
   - Ofsted vs ISI ✅ (from type_name)
   - Shows detected frameworks with checkboxes
4. **User confirms/selects:**
   - Faith designation ❓ (if applicable)
   - Additional frameworks ❓
5. **System validates:**
   - If user unchecks required framework → warning prompt
6. **Generate folder structure** based on selected frameworks

---

## 🧪 Testing

### Test URN Lookup

```typescript
// In browser console or API test
fetch('/api/school/lookup?urn=100000')
  .then(r => r.json())
  .then(console.log);
```

### Test Framework Detection

```typescript
import { detectFrameworks } from '@/lib/supabase-dfe';

const schoolData = {
  urn: 100000,
  type_name: 'Academy converter',
  phase_name: 'Primary',
  // religious_character: 'Church of England' // if exists
};

const frameworks = detectFrameworks(schoolData);
console.log(frameworks);
// Expected: { ofsted: true, isi: false, siams: false, ... }
```

---

## 🔍 Schema Verification

Run the verification script to check:

1. **Does `religious_character` field exist?**
   - If YES → Can auto-detect faith frameworks
   - If NO → Must ask user

2. **What fields are available?**
   - Lists all columns in `schools` table
   - Shows sample data

3. **Connection test**
   - Verifies DfE database is accessible
   - Tests sample query

---

## 📋 Next Steps

1. ✅ Add DfE env vars to `.env.local`
2. ✅ Run verification script
3. ✅ Update signup flow to use URN lookup
4. ✅ Add framework detection UI
5. ✅ Add validation prompts
6. ✅ Test with real URNs

---

## 🐛 Troubleshooting

### "School not found"
- Check URN is correct (6 digits)
- Verify DfE database connection
- Check URN exists in `dfe_data.schools`

### "Cannot connect to DfE database"
- Verify `DFE_SUPABASE_URL` is correct
- Verify `DFE_SUPABASE_SERVICE_ROLE_KEY` is correct
- Check network/firewall settings

### "Religious character not detected"
- This is expected if field doesn't exist in DfE data
- User will be prompted to confirm faith designation
- This is the correct behavior

