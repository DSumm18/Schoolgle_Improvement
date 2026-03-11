# Schoolgle Skills System Documentation

## Overview

The **Schoolgle Skills System** enables the AI assistant to interact with platform features through structured, function-callable skills. Skills are categorized modules that the AI can activate to perform specific tasks on behalf of users.

## Architecture

```
.agent/skills/           # Agent skill definitions (SKILL.md files)
├── INDEX.md            # Master registry
├── staff-directory/    # Staff management skill
├── actions-hub/        # Improvement actions skill
├── estates-supervisor/ # Estates coordination
└── ...

apps/platform/src/lib/skills/
└── school-skills-registry.ts  # Function schemas for AI calling

skills-lab/             # Knowledge-based skills
├── knowledge/          # MD knowledge bases
├── skills/             # TS skill prototypes
└── examples/           # Conversation examples
```

## Skill Categories

| Category                    | Skills                                | Purpose                                   |
| --------------------------- | ------------------------------------- | ----------------------------------------- |
| **School Management**       | Staff Directory, Actions Hub          | Core school operations                    |
| **Governance & Compliance** | SIAMS, Ofsted, Compliance             | Inspection readiness                      |
| **Estates & Facilities**    | Maintenance, Assets, Energy           | Facilities management                     |
| **HR & Finance**            | Payroll, Budget, Staffing             | Resource management                       |
| **Research & Analysis**     | Deep Research, EEF Toolkit            | Evidence-based guidance                   |
| **Intelligence & Data**     | School Intelligence, Pupil Assessment | Cohort tracking, gap analysis, DfE trends |

## How Skills Work

### 1. Activation Flow

```
User Message → Intent Detection → Skill Activation → Function Execution → Response
```

**Example**:

```
User: "Add a new teacher named Sarah Jones"
  ↓
Intent Detection: create_staff_member
  ↓
Skill Activation: staff-directory
  ↓
Gather Parameters: first_name=Sarah, last_name=Jones, job_title=Teacher
  ↓
Function Execution: POST /api/staff
  ↓
Response: "Created staff member Sarah Jones (ID: abc123)"
```

### 2. Skill Definition Format

Each skill has:

- **Frontmatter**: Metadata (name, description, triggers, category)
- **Capabilities**: What the skill can do
- **API Endpoints**: Available backend functions
- **Frontend Routes**: Related UI pages
- **Conversation Examples**: Sample interactions

### 3. Function Calling Schema

Functions are defined in TypeScript schemas:

```typescript
{
    name: 'create_staff_member',
    description: 'Add a new staff member to the directory',
    parameters: {
        type: 'object',
        properties: {
            first_name: { type: 'string', description: '...' },
            last_name: { type: 'string', description: '...' },
            job_title: { type: 'string', description: '...' }
        },
        required: ['first_name', 'last_name', 'job_title']
    }
}
```

## Current Skills

### 👥 Staff Directory

**Purpose**: Manage school staff directory

**Capabilities**:

- Add new staff members
- Update existing records
- Import/Export CSV (round-trip workflow)
- Assign roles and permissions
- Activate/deactivate staff

**Functions**:

- `create_staff_member` - Add new staff
- `update_staff_member` - Modify staff record
- `list_staff` - List with filtering
- `export_staff_csv` - Export for editing
- `import_staff_csv` - Bulk import
- `deactivate_staff_member` - Archive staff

**Route**: `/dashboard/hr/people`

**Triggers**: "staff", "employee", "teacher", "add staff", "import staff"

### 🎯 Actions Hub

**Purpose**: AI-augmented school improvement

**Capabilities**:

- Create improvement actions
- Dual status tracking (user + AI)
- EEF research backing
- Cost tracking
- Staff assignment
- Notes and updates

**Functions**:

- `create_action` - New improvement action
- `update_action` - Modify action
- `list_actions` - List with filters
- `get_action_stats` - Dashboard stats
- `suggest_eef_strategy` - EEF recommendations
- `add_action_note` - Progress notes

**Route**: `/dashboard/actions-hub`

**Triggers**: "action", "improvement", "EEF", "school improvement"

### 🏢 Estates Supervisor

**Purpose**: Coordinate estates operations

**Capabilities**:

- Triage estates issues
- Delegate to specialists (Fire, Water, Gas)
- Synthesize reports
- Escalate red risks

**Sub-Skills**: Legionella Expert, Fire Safety Expert, Maintenance Team

### 📚 Deep Research

**Purpose**: Comprehensive research tasks

**Capabilities**:

- Web searches with multiple sources
- Document analysis
- Summary generation
- Citation tracking

### 📊 School Intelligence

**Purpose**: Cross-module intelligence analysis with cohort tracking and EEF research

**Capabilities**:

- Run full cross-referenced school analysis (DfE + pupil data + contextual factors + cross-module signals)
- Trace cohort journeys backwards through time with COVID impact detection
- Analyse pupil assessment data: attainment gaps (FSM/SEND/gender/PP), teacher accuracy, intervention recommendations
- Retrieve DfE multi-year trends (attendance, KS2, census, workforce, exclusions)
- Get contextual factors that explain data patterns
- Pull cross-module alerts (Estates overdue tasks, HR staff absence, Compliance gaps)

**Functions**:

- `run_intelligence_analysis` - Full cross-referenced analysis with EEF recommendations
- `get_cohort_journey` - Trace a year group backwards with COVID/event impact
- `get_assessment_insights` - Pupil assessment gap analysis and teacher accuracy
- `get_contextual_factors` - Active school events affecting data
- `get_dfe_trends` - Multi-year DfE data for a school URN
- `get_cross_module_signals` - Cross-module alerts affecting outcomes

**Route**: `/dashboard/intelligence` (planned)

**Triggers**: "cohort", "attainment gap", "EEF", "progress", "assessment", "KS2", "intervention", "teacher accuracy", "scaled score"

**Privacy**: All pupil data is HMAC-SHA256 pseudonymised. Ed never sees or discusses individual pupil names.

### 🏢 Estates Compliance (Extended)

**Purpose**: Statutory compliance with contractor management

**Functions**:

- `create_helpdesk_ticket` - Log maintenance issues
- `update_helpdesk_ticket` - Update ticket status
- `search_contractors` - Find contractors by service type
- `check_contractor_accreditation` - Verify DBS/accreditations
- `list_compliance_tasks` - Upcoming/overdue compliance tasks
- `search_knowledge` - Search statutory compliance knowledge base
- `extract_estates_document` - Extract info from uploaded documents via vision
- `analyze_spatial_impact` - Analyse impact on adjacent areas

**Route**: `/estates-compliance`

**Triggers**: "maintenance", "repair", "contractor", "fire safety", "legionella", "RIDDOR", "asbestos"

## Adding a New Skill

### Step 1: Create Skill Directory

```bash
mkdir -p .agent/skills/your-skill-name
```

### Step 2: Create SKILL.md

```markdown
---
name: your-skill-name
description: Brief description of what this skill does
category: Category Name
triggers:
  - "keyword1"
  - "keyword2"
---

# Your Skill Name

## What You Can Do

### 1. Capability One

Description...

### 2. Capability Two

Description...

## API Endpoints

| Method | Endpoint        | Purpose     |
| ------ | --------------- | ----------- |
| GET    | `/api/endpoint` | Description |

## Frontend Route

`/dashboard/your-route`

## Conversation Flow Examples

**User**: "..."
**You**: ...
```

### Step 3: Register in INDEX.md

Add to the appropriate category section with link.

### Step 4: Add Function Schemas (if applicable)

In `apps/platform/src/lib/skills/school-skills-registry.ts`:

```typescript
export const YOUR_SKILL_SCHEMAS = [
  {
    name: "your_function_name",
    description: "What this function does",
    parameters: {
      type: "object",
      properties: {
        /* ... */
      },
      required: ["param1", "param2"],
    },
  },
];
```

### Step 5: Implement API Handlers

Create corresponding API routes in `apps/platform/src/app/api/`.

## AI Integration Pattern

### From Chatbot to Skill

```typescript
// 1. User message triggers intent detection
const userMessage = "Add a new teacher Sarah Jones";

// 2. Intent classifier identifies skill
const detectedSkill = detectSkill(userMessage); // "staff-directory"
const detectedFunction = detectFunction(userMessage); // "create_staff_member"

// 3. Extract parameters
const params = extractParameters(userMessage, detectedFunction);
// { first_name: "Sarah", last_name: "Jones", ... }

// 4. Validate parameters
const validation = validateParameters(detectedFunction, params);

// 5. Execute API call
const result = await callAPI(detectedFunction, params);

// 6. Format response
const response = formatSuccess(result);
```

### Function Calling Example

```json
{
  "function": {
    "name": "create_staff_member",
    "arguments": {
      "organization_id": "org_123",
      "first_name": "Sarah",
      "last_name": "Jones",
      "job_title": "Class Teacher",
      "role_category": "class_teacher"
    }
  }
}
```

## Round-Trip Workflow Pattern

The Staff Directory uses a round-trip CSV workflow:

1. **Export**: User clicks "Export" → API generates CSV with embedded instructions
2. **Edit**: User modifies in Excel/Google Sheets
3. **Import**: User uploads modified CSV → API processes changes
4. **Feedback**: API reports: added, updated, archived counts + errors

**CSV Format**:

```csv
# STAFF DIRECTORY IMPORT/EXPORT
# Lines starting with # are ignored on import
# Action: new, keep, update, remove
salutation,first_name*,last_name*,email,phone,employee_id,job_title*,role_category,is_super_user,is_active,action
"Mr","John","Smith","john@school.co.uk","01234 567890","STF001","Headteacher","headteacher","no","yes","keep"
"","Jane","Doe","jane@school.co.uk","","STF002","Teacher","class_teacher","no","yes","new"
```

## Dual Status System (Actions Hub)

Actions track TWO separate statuses:

| User Status | AI Status     | Combined Meaning                   |
| ----------- | ------------- | ---------------------------------- |
| complete    | met           | 🟢 Fully Achieved                  |
| complete    | partially_met | 🟡 Claimed but evidence incomplete |
| in_progress | not_met       | 🔴 Working but gaps remain         |
| draft       | not_assessed  | ⚪ Not yet reviewed                |

## EEF Integration

Actions can link to Education Endowment Foundation strategies:

| Strategy                 | Evidence   | Cost | Impact Timeline |
| ------------------------ | ---------- | ---- | --------------- |
| Small group tuition      | ⭐⭐⭐⭐   | £££  | +4 months       |
| Feedback                 | ⭐⭐⭐⭐⭐ | £    | +6 months       |
| Metacognition            | ⭐⭐⭐⭐⭐ | £    | +7 months       |
| Early years intervention | ⭐⭐⭐⭐   | ££   | +5 months       |

## Troubleshooting

### Skill Not Activating

1. Check triggers in SKILL.md match user message keywords
2. Verify skill is registered in INDEX.md
3. Check function schema exists in registry

### API Call Failing

1. Verify endpoint exists in `/app/api/`
2. Check authentication headers
3. Validate required parameters
4. Check organization_id is correct

### Parameter Extraction Issues

1. Review function schema descriptions
2. Add more specific examples to SKILL.md
3. Consider parameter constraints (enums, formats)

## Future Enhancements

- [ ] Skill versioning and migration
- [ ] Skill dependency management
- [ ] Skill analytics (usage, success rate)
- [ ] Skill testing framework
- [ ] Skill marketplace (community contributions)
- [ ] Multi-language skill support

## See Also

- `.agent/skills/INDEX.md` - Full skills registry
- `skills-lab/README.md` - Knowledge-based skills
- `apps/platform/src/lib/skills/school-skills-registry.ts` - Function schemas
