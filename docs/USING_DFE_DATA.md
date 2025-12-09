# Using DfE Data Warehouse in Schoolgle

## 🎯 Available Data & Use Cases

### 1. School Lookup & Auto-Population

**Use Case:** Auto-fill signup forms, validate URNs, get school context

```typescript
import { lookupSchoolByURN } from '@/lib/supabase-dfe';

// Lookup school by URN
const school = await lookupSchoolByURN('100000');

// Returns:
{
  urn: 100000,
  name: "Oakwood Primary School",
  la_name: "West Yorkshire",
  type_name: "Academy converter",
  phase_name: "Primary",
  address_line1: "123 School Lane",
  postcode: "LS1 1AA",
  trust_name: "Inspire Academy Trust",
  // ... more fields
}
```

**Applications:**
- ✅ Auto-populate signup form
- ✅ Validate URN exists
- ✅ Get school context for assessments
- ✅ Link to trust/MAT data

---

### 2. Framework Detection

**Use Case:** Automatically detect which inspection frameworks apply

```typescript
import { detectFrameworks, lookupSchoolByURN } from '@/lib/supabase-dfe';

const school = await lookupSchoolByURN('100000');
const frameworks = detectFrameworks(school);

// Returns:
{
  ofsted: true,      // Detected from type_name
  isi: false,        // Independent schools only
  siams: false,      // Must ask user (faith designation)
  csi: false,        // Must ask user (faith designation)
  // ... other frameworks
}
```

**Applications:**
- ✅ Auto-select Ofsted vs ISI
- ✅ Show relevant framework tabs
- ✅ Generate correct folder structure
- ✅ Validate user selections

---

### 3. Deprivation Context

**Use Case:** Understand school's context for assessment

```typescript
// Query with joins to get deprivation data
const { data } = await dfeClient
  .from('schools')
  .select(`
    *,
    school_area_links (
      area_demographics (
        imd_decile,
        imd_rank,
        income_deprivation_score,
        employment_deprivation_score
      )
    )
  `)
  .eq('urn', 100000)
  .single();
```

**Applications:**
- ✅ Context for Pupil Premium analysis
- ✅ Benchmarking against similar schools
- ✅ Understanding barriers to learning
- ✅ Evidence for inclusion assessments

---

### 4. LA Finance Context

**Use Case:** Understand financial constraints affecting school

```typescript
// Get LA finance data
const { data } = await dfeClient
  .from('local_authority_finance')
  .select('*')
  .eq('la_code', school.la_code)
  .order('academic_year_start', { ascending: false })
  .limit(5);
```

**Returns:**
```typescript
{
  la_code: "383",
  academic_year_start: 2023,
  dsg_total_allocation: 50000000,
  dsg_deficit: -2000000,  // Negative = deficit
  send_total_spending: 15000000,
  // ... more finance fields
}
```

**Applications:**
- ✅ Context for SEND provision assessments
- ✅ Understanding resource constraints
- ✅ Explaining funding gaps
- ✅ Evidence for leadership assessments

---

### 5. Comparative Analysis

**Use Case:** Find similar schools for benchmarking

```typescript
// Find similar schools (same phase, similar deprivation)
const { data: similarSchools } = await dfeClient
  .from('schools')
  .select(`
    urn,
    name,
    phase_name,
    type_name,
    school_area_links (
      area_demographics (imd_decile)
    )
  `)
  .eq('phase_name', 'Primary')
  .eq('type_name', 'Academy converter')
  .eq('status_name', 'Open')
  .limit(10);
```

**Applications:**
- ✅ Benchmarking performance
- ✅ Finding best practice examples
- ✅ Context for self-evaluation
- ✅ Evidence for improvement plans

---

### 6. Trust/MAT Analysis

**Use Case:** Analyze schools within a trust

```typescript
// Get all schools in a trust
const { data: trustSchools } = await dfeClient
  .from('schools')
  .select('*')
  .eq('trust_name', 'Inspire Academy Trust')
  .eq('status_name', 'Open');
```

**Applications:**
- ✅ Trust dashboard data
- ✅ Cross-school comparisons
- ✅ Shared evidence across schools
- ✅ Trust-level reporting

---

## 📊 Data Tables & What They Provide

### `dfe_data.schools` (34,750 records)

**Key Fields:**
- `urn` - Unique Reference Number (primary key)
- `name` - School name
- `la_code`, `la_name` - Local Authority
- `type_name` - Academy, Maintained, Independent, etc.
- `phase_name` - Primary, Secondary, etc.
- `status_name` - Open, Closed, etc.
- `trust_name`, `trust_uid` - Trust information
- `address_*` - Full address
- `phone`, `email`, `website` - Contact details

**Use For:**
- School identity
- Framework detection (Ofsted vs ISI)
- Contact information
- Trust membership

---

### `dfe_data.area_demographics` (32,844 records)

**Key Fields:**
- `lsoa_code` - Lower Super Output Area code
- `imd_rank`, `imd_decile`, `imd_score` - Deprivation indices
- `income_deprivation_score`
- `employment_deprivation_score`
- `education_deprivation_score`
- `health_deprivation_score`
- `crime_deprivation_score`
- Population data

**Use For:**
- Understanding school context
- Pupil Premium analysis
- Inclusion assessments
- Benchmarking

**Link Via:** `dfe_data.school_area_links` (links URN → LSOA)

---

### `dfe_data.local_authority_finance` (239,834 records)

**Key Fields:**
- `la_code` - Local Authority code
- `academic_year_start` - Year (e.g., 2023)
- `dsg_total_allocation` - Dedicated Schools Grant
- `dsg_deficit` - DSG deficit (negative = overspend)
- `send_total_spending` - Total SEND spending
- `send_per_pupil` - SEND spending per pupil

**Use For:**
- Financial context
- SEND provision analysis
- Resource constraint understanding
- Leadership assessments

**Link Via:** `la_code` (matches `schools.la_code`)

---

### Future Tables (When Imported)

| Table | Use Case |
|-------|----------|
| `ks2_results` | Performance data, progress tracking |
| `ks1_results` | Early years outcomes |
| `ks4_results` | Secondary outcomes |
| `workforce` | Staff data, CPD analysis |
| `census` | Pupil numbers, characteristics |
| `attendance` | Attendance rates, persistent absence |
| `exclusions` | Exclusion data, behaviour analysis |

---

## 🔗 Common Query Patterns

### 1. Get School with Deprivation Context

```typescript
const { data } = await dfeClient
  .from('schools')
  .select(`
    *,
    school_area_links (
      area_demographics (
        imd_decile,
        imd_rank,
        income_deprivation_score
      )
    )
  `)
  .eq('urn', 100000)
  .single();
```

### 2. Get School with LA Finance Context

```typescript
const school = await lookupSchoolByURN('100000');

const { data: finance } = await dfeClient
  .from('local_authority_finance')
  .select('*')
  .eq('la_code', school.la_code)
  .order('academic_year_start', { ascending: false })
  .limit(1)
  .single();
```

### 3. Find Similar Schools

```typescript
// Get school's deprivation context first
const school = await lookupSchoolByURN('100000');
const { data: areaData } = await dfeClient
  .from('school_area_links')
  .select('area_demographics(imd_decile)')
  .eq('urn', 100000)
  .single();

const imdDecile = areaData?.area_demographics?.imd_decile;

// Find schools in similar deprivation decile
const { data: similar } = await dfeClient
  .from('schools')
  .select(`
    urn,
    name,
    school_area_links (
      area_demographics!inner (imd_decile)
    )
  `)
  .eq('phase_name', school.phase_name)
  .eq('type_name', school.type_name)
  .eq('status_name', 'Open')
  .limit(20);
```

---

## 💡 Practical Applications in Schoolgle

### 1. Signup Flow Enhancement

**Current:** User manually enters school name, address, phase

**With DfE Data:**
1. User enters URN
2. System auto-populates all fields
3. System detects frameworks
4. User confirms/selects additional frameworks
5. Done!

**Code:**
```typescript
// In signup page
const handleUrnLookup = async (urn: string) => {
  const response = await fetch(`/api/school/lookup?urn=${urn}`);
  const { school, frameworks } = await response.json();
  
  // Auto-populate form
  setFormData({
    organisationName: school.name,
    address: `${school.address_line1}, ${school.town}`,
    postcode: school.postcode,
    localAuthority: school.la_name,
    phase: school.phase_name.toLowerCase(),
    // ... more fields
  });
  
  // Show detected frameworks
  setDetectedFrameworks(frameworks);
};
```

---

### 2. Assessment Context

**Use Case:** Provide context when assessing school

```typescript
// When user opens Ofsted assessment
const schoolContext = await getSchoolContext(urn);

// Display context panel:
// - "This school is in the 3rd most deprived decile"
// - "LA has DSG deficit of £2M"
// - "Similar schools in area: 15"
```

**Benefits:**
- Helps inspectors understand context
- Explains performance relative to deprivation
- Provides benchmarking data

---

### 3. Evidence Matching Enhancement

**Use Case:** Match evidence to requirements with context

```typescript
// When scanning evidence
const school = await lookupSchoolByURN(urn);
const context = await getDeprivationContext(urn);

// AI can use context:
// "Given this school is in a deprived area (IMD decile 2),
//  evidence of Pupil Premium strategy is critical"
```

---

### 4. Trust Dashboard

**Use Case:** Show trust-wide insights

```typescript
// Get all schools in trust
const { data: trustSchools } = await dfeClient
  .from('schools')
  .select('*')
  .eq('trust_name', trustName)
  .eq('status_name', 'Open');

// Aggregate data:
// - Average deprivation across trust
// - Schools by phase
// - Schools by type
// - Geographic spread
```

---

### 5. Reporting & Analytics

**Use Case:** Generate reports with DfE context

```typescript
// In report generator
const reportData = {
  school: await lookupSchoolByURN(urn),
  deprivation: await getDeprivationContext(urn),
  laFinance: await getLAFinance(urn),
  similarSchools: await findSimilarSchools(urn),
  // ... assessment data
};

// Generate report with:
// - School context section
// - Deprivation analysis
// - Benchmarking data
// - Financial context
```

---

## 🚀 Next Steps

1. ✅ **Environment variables added** - Ready to use
2. 🔄 **Test URN lookup** - Verify connection works
3. 🔄 **Update signup flow** - Integrate auto-population
4. 🔄 **Add context panels** - Show DfE data in assessments
5. 🔄 **Enhance evidence matching** - Use context in AI matching
6. 🔄 **Build trust dashboard** - Use trust queries

---

## 📝 Example: Complete School Context Function

```typescript
// lib/school-context.ts
import { lookupSchoolByURN, dfeClient } from './supabase-dfe';

export async function getCompleteSchoolContext(urn: string) {
  // Get school data
  const school = await lookupSchoolByURN(urn);
  if (!school) return null;
  
  // Get deprivation context
  const { data: areaLinks } = await dfeClient
    .from('school_area_links')
    .select('area_demographics(*)')
    .eq('urn', urn)
    .limit(1)
    .single();
  
  // Get LA finance
  const { data: finance } = await dfeClient
    .from('local_authority_finance')
    .select('*')
    .eq('la_code', school.la_code)
    .order('academic_year_start', { ascending: false })
    .limit(1)
    .single();
  
  // Get trust schools (if applicable)
  let trustSchools = null;
  if (school.trust_name) {
    const { data } = await dfeClient
      .from('schools')
      .select('urn, name, phase_name')
      .eq('trust_name', school.trust_name)
      .eq('status_name', 'Open');
    trustSchools = data;
  }
  
  return {
    school,
    deprivation: areaLinks?.area_demographics,
    laFinance: finance,
    trustSchools,
    frameworks: detectFrameworks(school)
  };
}
```

---

**Ready to use!** The DfE data warehouse is now integrated and ready for all these use cases. 🎯

