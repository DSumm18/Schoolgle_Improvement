# Google Workspace MCP Setup - Quick Guide

## The Problem
The google-workspace MCP server needs OAuth credentials to access your Google Drive.

## 5-Minute Setup (One-Time)

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Create/Select Project
- Click "Select a project" → "New Project"
- Name: "Schoolgle MCP" (or any name)
- Click "Create"

### 3. Enable APIs (Batch)
Go to: https://console.cloud.google.com/apis/dashboard
Click "+ ENABLE APIS AND SERVICES" and search for/enable:
- Google Drive API
- Google Sheets API
- Google Docs API
- Gmail API
- Google Calendar API

### 4. Create OAuth Credentials
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted: "Configure consent screen" → "External" → Create
4. OAuth client type: **Desktop app** (NOT Web application)
5. Name: "Claude MCP"
6. Click "Create"

### 5. Download Credentials
1. After creation, click the download icon (📥)
2. Save as `credentials.json`

### 6. Copy to MCP Directory
```bash
# Move the downloaded file to:
C:\Users\dsumm\.google-mcp\credentials.json
```

### 7. Add Account in Claude Code
```bash
npx google-workspace-mcp accounts add schoolgle
```

This will open a browser window → authorize → done.

## After Setup
Once configured, the MCP tools will work and I can:
- Create folders in your Google Drive
- Upload files directly
- Organize the Aurora test pack automatically

## Notes
- You only do this ONCE
- The credentials are for YOUR account (admin@schoolgle.co.uk)
- Google Desktop OAuth is safe - no web server needed
