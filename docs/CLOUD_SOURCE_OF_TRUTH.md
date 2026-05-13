# Schoolgle Cloud Source of Truth

Last updated: 28 April 2026

This document defines the intended clean cloud setup for Schoolgle. It is a planning and audit document only. Do not delete, rotate, or disable existing cloud projects/credentials until the live app has been checked against this map.

## Target State

Schoolgle should have one canonical production cloud setup:

- **Supabase** is the source of truth for authentication sessions, users, organisations, membership, app data, and connector records.
- **Google Cloud** provides Google OAuth for Supabase login and the Google Drive Schoolgle Connector.
- **Microsoft Entra ID / Azure** provides Microsoft OAuth for Supabase login and the future OneDrive/SharePoint Connector.
- **OpenRouter** provides the LLM gateway for approved AI model providers.
- **Firebase** is legacy unless a specific active dependency is found and documented.

Recommended canonical names:

- Google Cloud project: `Schoolgle Live`
- Microsoft Entra app registration: `Schoolgle Live`
- Supabase project: `Schoolgle Live`
- Google OAuth client: `Schoolgle Web Client`
- Google Drive connector user-facing name: `Schoolgle Connector`
- Connector support/contact identity: `connector@schoolgle.co.uk`

## Current App Architecture

### Authentication

The active app auth flow is Supabase-based:

- The app imports `SupabaseAuthContext` for login/session state.
- Google login uses `supabase.auth.signInWithOAuth({ provider: "google" })`.
- Microsoft login uses `supabase.auth.signInWithOAuth({ provider: "azure" })`.
- User profile and organisation membership are reconciled into Supabase through `/api/auth/profile`.

This means Google and Microsoft are identity providers for Supabase. They are not the app database.

### Database

Supabase is the operational application database. The app stores:

- users and organisation membership
- subscriptions and module access
- tasks/actions
- school intelligence and DfE data
- connector records, including `school_data_connections`
- app/module data

### AI

AI calls are routed through OpenRouter. Some configured model IDs are Google Gemini models, but those calls are made through OpenRouter rather than directly through the Google Cloud project.

### Google Drive Connector

The Google Drive Connector is separate from Google login.

Target behaviour:

- Use Google OAuth scope `https://www.googleapis.com/auth/drive.file`.
- Create or use a top-level folder named `Schoolgle`.
- Create product folders inside the `Schoolgle` folder.
- Store only the `Schoolgle` folder ID in Supabase.
- Scan only inside that folder boundary.
- Do not fall back to Drive root.

Expected folder map:

```text
Schoolgle
├── Ofsted Readiness
├── Trust Assessor
├── MIS Exports
│   ├── Pupil Data
│   ├── Attendance
│   ├── Assessments
│   ├── Behaviour
│   └── Staff & HR
├── Policies
├── Compliance
├── Finance
│   └── Budget Reports
└── Estates
    └── Energy Invoices
```

### Microsoft Connector

Microsoft login already exists through Supabase provider `azure`.

The OneDrive/SharePoint Connector is not complete yet. Target behaviour should mirror the Google Connector:

- Use Microsoft Graph with least-privilege file/folder permissions.
- Create or select a `Schoolgle` folder in OneDrive or SharePoint.
- Store only the approved folder/site/drive item reference in Supabase.
- Scan only inside that folder boundary.
- Support school-owned SharePoint document libraries as the preferred enterprise model.

## Canonical Environment Variables

### Supabase

Required by the app:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Google

Used for the Google Drive Connector and/or Supabase Google login provider configuration:

```text
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET
GOOGLE_CLIENT_SECRET
```

Important: avoid maintaining multiple Google client IDs for the same environment unless there is a documented reason.

### Microsoft

Likely target variables for the future Microsoft Connector:

```text
NEXT_PUBLIC_MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_TENANT_ID
```

Supabase Microsoft login may also require configuring Azure credentials inside the Supabase dashboard.

### AI

```text
OPENROUTER_API_KEY
OPENAI_API_KEY
```

Prefer `OPENROUTER_API_KEY` for the current model-routing strategy.

### Website Crawling

```text
FIRECRAWL_API_KEY
```

Used where configured for website/Ofsted/compliance scanning.

## Google Cloud Target Setup

Create or nominate one canonical Google Cloud project:

```text
Schoolgle Live
```

Enable APIs:

- Google Drive API
- Any OAuth consent dependencies required by Google

OAuth consent screen:

- App name: `Schoolgle`
- Support email: a monitored Schoolgle account
- Developer contact email: a monitored Schoolgle account
- Scopes:
  - `openid`
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/drive.file`

OAuth web client:

- Name: `Schoolgle Web Client`
- Authorized JavaScript origins:
  - `http://localhost:3000`
  - `https://schoolgle.co.uk`
  - production/staging Vercel domains if used
- Authorized redirect URIs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/api/data-connections/oauth/callback`
  - `https://schoolgle.co.uk/auth/callback`
  - `https://schoolgle.co.uk/api/data-connections/oauth/callback`
  - production/staging Vercel callback URLs if used

## Microsoft Target Setup

Create or nominate one canonical Microsoft Entra app registration:

```text
Schoolgle Live
```

Required capabilities:

- Supabase Microsoft login provider.
- Future OneDrive/SharePoint Connector.

Recommended redirect URIs:

- Supabase OAuth callback URL for Microsoft login.
- `http://localhost:3000/api/data-connections/microsoft/callback`
- `https://schoolgle.co.uk/api/data-connections/microsoft/callback`

Likely Microsoft Graph permission model to confirm during implementation:

- User sign-in profile scopes for authentication.
- Least-privilege file/folder scopes for OneDrive/SharePoint connector.
- Admin consent route for school/trust tenants where needed.

## Cleanup Rules

Do not delete old Google Cloud, Firebase, Azure, or Supabase projects immediately.

Use this sequence:

1. Identify which credentials the live app is using.
2. Label old/test projects as `Legacy` or `Do not use`.
3. Move local development onto the canonical project.
4. Move staging/production onto the canonical project.
5. Confirm Google login, Microsoft login, Google Drive Connector, and AI calls work.
6. Only then disable or remove old projects/credentials after an explicit approval.

## Open Questions Before Consolidation

- Final production domain list.
- Whether staging gets its own OAuth client or shares `Schoolgle Live`.
- Whether Microsoft Connector should create a folder in user OneDrive or require a SharePoint document library.
- Whether connector secrets are stored in Supabase directly or encrypted using a dedicated key management pattern.
- Whether `connector@schoolgle.co.uk` is a monitored mailbox, alias, or just a product identity.

## Action-Time Confirmations Required

Ask for explicit confirmation immediately before:

- Creating a new Google Cloud project.
- Creating or changing OAuth clients.
- Changing redirect URIs.
- Creating Microsoft Entra app registrations.
- Changing Supabase auth provider settings.
- Rotating secrets.
- Disabling or deleting any old credentials/projects.
- Changing production environment variables.

