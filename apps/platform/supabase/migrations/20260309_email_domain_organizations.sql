-- Add email_domain column to organizations for inbound email-to-ticket security
-- Staff can only raise helpdesk tickets via email from their verified school domain

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email_domain TEXT,
  ADD COLUMN IF NOT EXISTS email_domain_verified BOOLEAN DEFAULT FALSE;

-- Index for fast domain lookups on inbound emails
CREATE INDEX IF NOT EXISTS idx_organizations_email_domain
  ON public.organizations(email_domain)
  WHERE email_domain IS NOT NULL;

COMMENT ON COLUMN public.organizations.email_domain IS 'Verified school email domain (e.g. stmarys.school.uk). Used to authenticate inbound helpdesk emails.';
COMMENT ON COLUMN public.organizations.email_domain_verified IS 'Whether the email domain has been verified by an admin.';
