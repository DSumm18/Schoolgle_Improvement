# Cloud Connection Wizard — Specification

**Date:** 2026-03-19
**Status:** Design specification (not yet built)

---

## Purpose

A visual, guided wizard that helps a school connect their cloud storage to Schoolgle. Replaces the current "paste link" approach with a more intuitive flow.

---

## Recommended Flow

### Step 1: Choose Provider

Two large cards:

- **Google Workspace** — "Connect your school's Google Drive"
- **Microsoft 365** — "Connect your school's OneDrive or SharePoint"

Each shows:

- Provider logo
- Brief description
- "Connect" button
- Note: "Read-only access — Schoolgle cannot change your files"

### Step 2: Authenticate

- Google: OAuth 2.0 with `drive.readonly` scope
- Microsoft: OAuth 2.0 with `Files.Read` scope
- Clear messaging: "Schoolgle is requesting read-only access to your files"

If admin approval is needed:

> "Your school's Google/Microsoft admin may need to approve Schoolgle as an app. This is normal — ask your IT lead to check the admin console."

### Step 3: Select Folder

- Visual folder browser (tree view)
- "Select your school data folder" prompt
- Shows folder path as breadcrumb
- "Select This Folder" button

### Step 4: Review Detection

- Shows what Schoolgle found in the folder
- Category cards with file counts (pupils, staff, finance, etc.)
- "These are the data sources Schoolgle will use"
- Each category shows which modules it powers

### Step 5: Confirm

- Summary: "Connected to [Folder Name] in [Provider]"
- Status: "Active — Read-only"
- "You can disconnect or change this at any time"
- "Done" button → returns to Data Connections page

---

## Language Guidelines

| Do                                              | Don't                            |
| ----------------------------------------------- | -------------------------------- |
| "Connect your school's Google Drive"            | "Upload your files to Schoolgle" |
| "Read-only access"                              | "We need access to your files"   |
| "Schoolgle will use this to power your modules" | "We will import your data"       |
| "Disconnect at any time"                        | "Delete your connection"         |
| "Your IT admin may need to approve this"        | "Contact your administrator"     |

---

## Technical Notes

### Google Workspace

- Current implementation uses share link + API key (no user OAuth for basic browse)
- Full OAuth implemented for Drive file download
- Folder scanning uses recursive API calls with category detection

### Microsoft 365

- Client-side SDK loader exists (`onedrive.ts`)
- API functions for folder listing and file download exist in `cloud-service.ts`
- Not yet wired to UI — needs OAuth callback route

---

## Current State

| Aspect             | Google                                     | Microsoft                |
| ------------------ | ------------------------------------------ | ------------------------ |
| Backend API        | FUNCTIONAL                                 | FUNCTIONAL (code exists) |
| OAuth flow         | FUNCTIONAL (share link shortcut available) | NOT WIRED                |
| Folder scanning    | FUNCTIONAL                                 | FUNCTIONAL (code exists) |
| File download      | FUNCTIONAL                                 | FUNCTIONAL (code exists) |
| UI wizard          | NOT BUILT                                  | NOT BUILT                |
| Category detection | FUNCTIONAL (9 patterns)                    | Same logic (shared)      |
