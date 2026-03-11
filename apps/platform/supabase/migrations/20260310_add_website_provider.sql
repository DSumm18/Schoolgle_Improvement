-- Add 'website' as a valid document provider for website compliance scans
-- This allows the website scanner to store evidence documents alongside
-- Google Drive and OneDrive documents

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_provider_check;
ALTER TABLE documents ADD CONSTRAINT documents_provider_check
  CHECK (provider = ANY (ARRAY['local', 'google_drive', 'onedrive', 'website']));
