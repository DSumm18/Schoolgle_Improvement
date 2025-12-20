-- Migration: Register Admin Tools
-- Date: 2025-02-02
-- Purpose: Register import_students_batch and create_cohort tools
-- Note: Run this if you already ran 20240201_precision_teaching.sql before these tools were added

-- Register admin tools
insert into tool_definitions (tool_key, tool_name, description, module_key, risk_level, requires_approval) values
  ('import_students_batch', 'Import Students Batch', 'Bulk imports students with UPN hashing. Privacy-First: UPNs are hashed using SHA-256 before storage. Requires admin or SLT role.', 'core', 'medium', false),
  ('create_cohort', 'Create Cohort', 'Creates a new cohort with filter criteria. Immediately counts and reports how many existing students match the criteria.', 'core', 'low', false)
on conflict (tool_key) do update set
  tool_name = excluded.tool_name,
  description = excluded.description,
  module_key = excluded.module_key,
  risk_level = excluded.risk_level,
  requires_approval = excluded.requires_approval;

