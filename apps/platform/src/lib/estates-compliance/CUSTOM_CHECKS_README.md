# Custom Checks System

A comprehensive system for schools to create, manage, and share custom compliance checks beyond the statutory requirements.

## Overview

The Custom Checks System allows schools to:
- Create their own compliance checks tailored to their specific needs
- Start from 15+ pre-built templates covering common school scenarios
- Clone and modify existing checks
- Save checks as templates for reuse
- Share checks within their organization (multi-academy trusts)
- Mark checks as private or public (future feature for sharing across schools)

## File Structure

### Templates Library
```
lib/estates-compliance/check-templates.ts
```
Contains 15+ pre-built templates for common custom checks:
- Daily: Gate lock check, premises visual check
- Weekly: Field check, kitchen safety
- Monthly: First aid kit, minibus, playground equipment
- Termly: Classroom safety, forest school
- Ad-hoc: Winter readiness, summer holiday security
- Specialized: Science lab, design tech workshop, swimming pool

### Database Layer
```
lib/estates-compliance/database/custom-checks.ts
```
Functions for interacting with the `custom_checks` database table:
- `getCustomChecks()` - List with filters and pagination
- `getCustomCheckById()` - Get single check
- `createCustomCheck()` - Create new check
- `updateCustomCheck()` - Update existing check
- `archiveCustomCheck()` - Soft delete (archive)
- `deleteCustomCheck()` - Permanently delete
- `cloneCustomCheck()` - Clone existing check
- `incrementTemplateUsage()` - Track template usage

### Service Layer
```
lib/estates-compliance/services/CustomCheckService.ts
```
Business logic layer providing:
- High-level CRUD operations
- Template management (save as template, clone from template)
- Statistics and reporting
- Search and filtering

### API Routes
```
app/api/estates/checks/custom/route.ts
app/api/estates/checks/custom/[id]/route.ts
```

#### POST `/api/estates/checks/custom`
Create a new custom check:
```json
{
  "name": "Daily Gate Lock Check",
  "description": "Check all school gates are locked securely",
  "compliance_domain": "security",
  "frequency": "daily",
  "estimated_duration": 10,
  "evidence_required": ["Gate check log", "Photo of locked gates"],
  "checklist_items": ["Main entrance gate locked", "Playground gates secured"],
  "visibility": "private",
  "tags": ["security", "daily", "gates"]
}
```

Clone from template:
```json
{
  "clone_from": "builtin_template_daily_gate_lock",
  "name": "Morning Gate Check"  // Optional: override name
}
```

Clone from existing check:
```json
{
  "clone_from": "uuid-of-existing-check",
  "name": "Copy of Gate Check"
}
```

#### GET `/api/estates/checks/custom`
List custom checks with filters:
```
?domain=security&frequency=daily&page=1&pageSize=20
&include_public=true
```

#### GET `/api/estates/checks/custom/[id]`
Get a single check by ID

#### PUT `/api/estates/checks/custom/[id]`
Update a check

#### DELETE `/api/estates/checks/custom/[id]`
Archive (soft delete) a check. Use `?permanent=true` to permanently delete.

### Wizard UI
```
app/(dashboard)/estates-compliance/[domain]/new/page.tsx
```
A 6-step wizard for creating custom checks:

1. **Template Selection** - Choose from templates or start from scratch
2. **Check Details** - Name, description, compliance domain
3. **Requirements** - Duration, qualifications, evidence required
4. **Checklist** - Define checklist items
5. **Scheduling** - Frequency, visibility, tags
6. **Review** - Preview before creating

### Database Migration
```
supabase/migrations/20260123_custom_checks.sql
```
Creates the `custom_checks` table with:
- Full RLS (Row Level Security) policies
- Indexes for common queries
- Full-text search support
- Usage tracking for templates

## Usage Examples

### Creating a Custom Check from Scratch

```typescript
import { CustomCheckService } from '@/lib/estates-compliance';

const check = await CustomCheckService.create(
  organizationId,
  userId,
  {
    name: 'Daily Playground Inspection',
    description: 'Morning check of playground equipment',
    compliance_domain: 'playground',
    frequency: 'daily',
    estimated_duration: 15,
    evidence_required: ['Playground log'],
    checklist_items: [
      'Check for broken equipment',
      'Check for litter',
      'Check fencing'
    ],
    visibility: 'private',
    tags: ['playground', 'daily', 'safety']
  }
);
```

### Cloning from a Built-in Template

```typescript
const check = await CustomCheckService.cloneFromTemplate(
  'template_weekly_field_check',  // Template ID
  organizationId,
  userId,
  {
    name: 'Weekly Field Safety Check'  // Optional overrides
  }
);
```

### Saving a Check as a Template

```typescript
const template = await CustomCheckService.saveAsTemplate(
  checkId,
  'Weekly Field Check Template'  // Optional new name
);
```

### Searching Custom Checks

```typescript
const results = await CustomCheckService.search(
  organizationId,
  'field',
  { page: 1, pageSize: 20 }
);
```

### Getting Custom Checks by Domain

```typescript
const securityChecks = await CustomCheckService.getByDomain(
  organizationId,
  'security',
  { page: 1, pageSize: 20 }
);
```

## Available Templates

### Daily Checks
- **Daily Gate Lock Check** - Security check of all gates
- **Daily Premises Visual Check** - Walkaround hazard check
- **Swimming Pool Daily Check** - Water quality and safety

### Weekly Checks
- **Weekly School Field Check** - Field for dog poo, litter, holes
- **Weekly Kitchen Safety Check** - Fire safety in kitchens

### Monthly Checks
- **Monthly First Aid Kit Check** - Stock and expiry dates
- **Monthly Minibus Safety Check** - Vehicle inspection
- **Monthly Playground Equipment Check** - Visual inspection

### Termly Checks
- **Termly Classroom Safety Audit** - Comprehensive classroom check
- **Termly Forest School Area Check** - Outdoor learning area

### Ad-hoc/Seasonal
- **Winter Readiness Check** - Prepare for cold weather
- **Summer Holiday Security Check** - Pre-holiday security

### Specialized
- **Science Lab Safety Check** - Weekly lab inspection
- **Design Technology Workshop Check** - D&T safety
- **Swimming Pool Daily Check** - Pool safety and water quality

## Visibility Levels

1. **Private** - Only visible to the school that created it
2. **Organization** - Shared across the organization (for MATs)
3. **Public** - Available to all schools (future feature)

## Tag Categories

Suggested tags are automatically provided based on:
- **Frequency**: daily, weekly, monthly, termly, annually
- **Location**: premises, kitchen, science, playground, field
- **Domain**: safety, security, fire, electrical, gas, water
- **Type**: inspection, maintenance, testing, monitoring
- **Risk**: high-risk, low-risk, critical
- **Seasonal**: winter, summer, holiday

## Database Schema

```sql
custom_checks (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  compliance_domain TEXT NOT NULL,
  frequency TEXT NOT NULL,
  estimated_duration INTEGER,
  requires_qualification TEXT,
  evidence_required TEXT[],
  checklist_items TEXT[],
  notes TEXT,
  visibility TEXT DEFAULT 'private',
  tags TEXT[],
  is_template BOOLEAN DEFAULT false,
  template_parent_id TEXT,
  cloned_from UUID REFERENCES custom_checks(id),
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
)
```

## Integration with Compliance Tasks

Custom checks integrate with the existing compliance task system:
- Custom checks can generate recurring compliance tasks
- Tasks are created based on the check's frequency
- Evidence and checklist items are linked to task completion

## Future Enhancements

1. **Public Template Marketplace** - Share templates between schools
2. **AI Suggestions** - Suggest checks based on school profile
3. **Check Dependencies** - Checks that depend on other checks
4. **Bulk Operations** - Import/export checks in bulk
5. **Version History** - Track changes to custom checks
6. **Approval Workflow** - Require approval for shared templates
