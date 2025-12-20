-- Migration: Register get_assessments tool
-- Date: 2025-01-26
-- Purpose: Add get_assessments tool to tool_definitions for Ofsted Inspector module

-- Register get_assessments tool
insert into tool_definitions (tool_key, tool_name, description, module_key, risk_level, requires_approval) values
  ('get_assessments', 'Get Assessments', 'Retrieves Ofsted assessment data including school self-assessments and AI-generated assessments for subcategories', 'ofsted_inspector', 'low', false)
on conflict (tool_key) do update set
  tool_name = excluded.tool_name,
  description = excluded.description,
  module_key = excluded.module_key,
  risk_level = excluded.risk_level,
  requires_approval = excluded.requires_approval;

