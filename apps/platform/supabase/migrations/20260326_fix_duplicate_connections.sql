-- Fix Duplicate Google Drive Connections
-- Issue: Aurora Primary School has 2 connection records with same folder_id but different org_ids

-- First, let's see which organizations are actually valid
-- Keep the connection for the active organization, remove the inactive one

BEGIN;

-- Check the current state
SELECT
  id,
  organization_id,
  folder_id,
  folder_name,
  is_active,
  connected_at
FROM school_data_connections
WHERE folder_id = '14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8'
ORDER BY is_active DESC, connected_at DESC;

-- Keep the ACTIVE connection (org: 7c5f74f5-0f8b-41b9-9e3a-6c3d7e8f9a0b)
-- Delete the INACTIVE connection (org: c64ed86b-9eab-49ee-9829-0706ff371083)

DELETE FROM school_data_connections
WHERE id IN (
  SELECT id
  FROM school_data_connections
  WHERE folder_id = '14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8'
    AND is_active = false
  LIMIT 1  -- Delete only the inactive one
);

COMMIT;

-- Verify fix
SELECT
  folder_id,
  COUNT(*) as connection_count
FROM school_data_connections
GROUP BY folder_id
HAVING COUNT(*) > 1;

-- Should return no rows if duplicates are removed
