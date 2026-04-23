-- Add scope tracking to school_data_connections
-- This ensures we track whether a connection is scoped to a specific folder

ALTER TABLE public.school_data_connections
ADD COLUMN IF NOT EXISTS scope_limited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scope_description TEXT;

-- Add comment
COMMENT ON COLUMN public.school_data_connections.scope_limited IS 'True if connection only accesses a specific folder (e.g., "Schoolgle Drive")';
COMMENT ON COLUMN public.school_data_connections.scope_description IS 'Human-readable description of access scope';

-- Update existing OAuth connections to be marked as scoped
UPDATE public.school_data_connections
SET scope_limited = true,
    scope_description = 'Only accesses the "Schoolgle Drive" folder'
WHERE provider = 'google' AND folder_name = 'Schoolgle Drive';
