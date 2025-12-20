# MCP Tool Usage Examples: Hierarchy Setup

## Scenario: Create Aurora Multi-Academy Trust Hierarchy

### Step 1: Create Trust Organization

**Tool:** `create_organization`

**Input:**
```json
{
  "name": "Aurora Multi-Academy Trust",
  "type": "trust"
}
```

**Expected Response:**
```json
{
  "organization": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Aurora Multi-Academy Trust",
    "organizationType": "trust",
    "parentOrganizationId": null,
    "laCode": null,
    "urn": null,
    "dataSharingAgreement": false,
    "createdAt": "2025-02-10T12:00:00Z",
    "updatedAt": "2025-02-10T12:00:00Z"
  },
  "message": "Organization \"Aurora Multi-Academy Trust\" (trust) created successfully."
}
```

### Step 2: Create School Organization

**Tool:** `create_organization`

**Input:**
```json
{
  "name": "Aurora Primary",
  "type": "school",
  "parentId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Expected Response:**
```json
{
  "organization": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "Aurora Primary",
    "organizationType": "school",
    "parentOrganizationId": "123e4567-e89b-12d3-a456-426614174000",
    "laCode": null,
    "urn": null,
    "dataSharingAgreement": false,
    "createdAt": "2025-02-10T12:01:00Z",
    "updatedAt": "2025-02-10T12:01:00Z"
  },
  "message": "Organization \"Aurora Primary\" (school) created successfully under parent 123e4567-e89b-12d3-a456-426614174000."
}
```

### Step 3: Link School to Trust (Alternative Method)

**Note:** If the school was created without a parent, use this tool to link it later.

**Tool:** `link_school_to_parent`

**Input:**
```json
{
  "schoolId": "456e7890-e89b-12d3-a456-426614174001",
  "parentId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Expected Response:**
```json
{
  "school": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "Aurora Primary",
    "organizationType": "school",
    "parentOrganizationId": "123e4567-e89b-12d3-a456-426614174000",
    "laCode": null,
    "urn": null,
    "dataSharingAgreement": false,
    "createdAt": "2025-02-10T12:01:00Z",
    "updatedAt": "2025-02-10T12:02:00Z"
  },
  "parent": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Aurora Multi-Academy Trust",
    "organizationType": "trust"
  },
  "message": "School \"Aurora Primary\" successfully linked to trust \"Aurora Multi-Academy Trust\"."
}
```

### Step 4: Verify Hierarchy

**Query (via SQL or custom tool):**
```sql
SELECT 
  o.id,
  o.name,
  o.organization_type,
  o.parent_organization_id,
  p.name as parent_name
FROM organizations o
LEFT JOIN organizations p ON o.parent_organization_id = p.id
WHERE o.name IN ('Aurora Multi-Academy Trust', 'Aurora Primary')
ORDER BY 
  CASE WHEN o.parent_organization_id IS NULL THEN 0 ELSE 1 END;
```

**Expected Result:**
| id | name | organization_type | parent_organization_id | parent_name |
|----|------|------------------|------------------------|-------------|
| 123e4567-... | Aurora Multi-Academy Trust | trust | NULL | NULL |
| 456e7890-... | Aurora Primary | school | 123e4567-... | Aurora Multi-Academy Trust |

## Success Criteria Checklist

- [x] `create_organization` called twice (Trust, then School)
- [x] `link_school_to_parent` called (or parent set during creation)
- [x] Database shows `parent_organization_id` populated correctly
- [x] Hierarchy query confirms Trust → School relationship
- [x] RLS policies allow Trust users to see School data

## Error Scenarios

### Invalid: Trust with Parent
```json
{
  "name": "Invalid Trust",
  "type": "trust",
  "parentId": "123e4567-..."
}
```
**Error:** "Only schools can have parent organizations (Trusts and LAs cannot be children)"

### Invalid: School Linked to School
```json
{
  "schoolId": "456e7890-...",
  "parentId": "456e7890-..."  // Same school
}
```
**Error:** "School cannot be linked to itself"

### Invalid: Non-Admin User
**Error:** "Creating organizations requires admin role"

