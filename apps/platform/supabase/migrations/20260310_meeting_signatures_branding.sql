-- Meeting signatures & GDPR consent

-- Add recording consent to meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS recording_consent BOOLEAN;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS recording_consent_at TIMESTAMPTZ;

-- Signatures table
CREATE TABLE IF NOT EXISTS meeting_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_role TEXT NOT NULL CHECK (signer_role IN ('leader', 'attendee', 'witness')),
  signature_data TEXT NOT NULL, -- base64 canvas data
  signature_method TEXT NOT NULL DEFAULT 'canvas' CHECK (signature_method IN ('canvas', 'typed', 'uploaded')),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meeting_signatures_meeting ON meeting_signatures(meeting_id);

-- RLS
ALTER TABLE meeting_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_signatures_select" ON meeting_signatures
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "meeting_signatures_insert" ON meeting_signatures
  FOR INSERT WITH CHECK (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Add branding support to meeting_minutes
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS branding_config JSONB;
