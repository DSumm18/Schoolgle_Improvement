-- Migration: Scanner Tenant Hardening
-- Date: 2025-12-31
-- Purpose: Add unique constraints required for multi-tenant scan upserts

BEGIN;

-- 1. Hardening Documents table
-- Ensure organization_id is present for all new records
ALTER TABLE public.documents ALTER COLUMN organization_id SET NOT NULL;

-- Create unique index for atomic upserts from cloud scanner
-- We use a partial index where external_id is not null (cloud files)
DROP INDEX IF EXISTS documents_org_external_id_idx;
CREATE UNIQUE INDEX documents_org_external_id_idx ON public.documents (organization_id, external_id) 
WHERE external_id IS NOT NULL;

-- 2. Hardening Evidence Matches table
-- Ensure organization_id is present for all new records
ALTER TABLE public.evidence_matches ALTER COLUMN organization_id SET NOT NULL;

-- Create unique index for atomic upserts of evidence matches
DROP INDEX IF EXISTS evidence_matches_org_doc_sub_item_idx;
CREATE UNIQUE INDEX evidence_matches_org_doc_sub_item_idx ON public.evidence_matches 
(organization_id, document_id, subcategory_id, evidence_item);

COMMIT;
