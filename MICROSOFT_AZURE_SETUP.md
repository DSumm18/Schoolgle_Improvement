# How to Get Microsoft Azure OAuth Credentials

## Step-by-Step Guide

### 1. Go to Azure Portal
- Visit: https://portal.azure.com/
- Sign in with your Microsoft account

### 2. Register an Application
- Go to: **Azure Active Directory** → **App registrations**
- Click **"+ New registration"**

### 3. Configure App Registration
- **Name:** "Schoolgle" (or your preferred name)
- **Supported account types:** 
  - Select: "Accounts in any organizational directory and personal Microsoft accounts"
- **Redirect URI:**
  - Platform: **Web**
  - URIs: 
    - `http://localhost:3000/auth/callback`
    - `https://schoolgle.co.uk/auth/callback`
    - `https://www.schoolgle.co.uk/auth/callback`
- Click **"Register"**

### 4. Get Your Credentials
After registration, you'll see the **Overview** page:
- **Application (client) ID** - This is your Client ID (copy it!)
- **Directory (tenant) ID** - This is your Tenant ID (copy it!)

### 5. Create a Client Secret
- Go to: **Certificates & secrets** (in the left sidebar)
- Click **"+ New client secret"**
- **Description:** "Schoolgle Local Dev"
- **Expires:** Choose "24 months" (or your preference)
- Click **"Add"**
- **IMPORTANT:** Copy the **Value** immediately (you won't see it again!)
  - This is your Client Secret

### 6. Configure API Permissions (Optional)
- Go to: **API permissions**
- Click **"+ Add a permission"**
- Select **"Microsoft Graph"**
- Select **"Delegated permissions"**
- Add: `User.Read` (for basic profile)
- Click **"Add permissions"**

### 7. Add to Supabase
- Go to: https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers
- Toggle **"Azure"** ON
- Paste:
  - **Client ID** → Client ID field (from Step 4)
  - **Client Secret** → Client Secret field (from Step 5)
  - **Tenant ID** → Tenant ID field (from Step 4)
    - Or use `common` for multi-tenant
- **Redirect URL** should include:
  - `http://localhost:3000/auth/callback`
  - `https://schoolgle.co.uk/auth/callback`
  - `https://www.schoolgle.co.uk/auth/callback`
- Click **"Save"**

## Quick Links

- **Azure Portal:** https://portal.azure.com/
- **App Registrations:** https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
- **Supabase Auth Providers:** https://supabase.com/dashboard/project/ygquvauptwyvlhkyxkwy/auth/providers

## Troubleshooting

**"AADSTS50011: Redirect URI mismatch"**
- Make sure the redirect URI in Azure **exactly matches**:
  - `http://localhost:3000/auth/callback`
- Check: App registrations → Your app → Authentication → Redirect URIs

**"Invalid client secret"**
- Client secrets expire! Create a new one if yours expired
- Make sure you copied the **Value** (not the Secret ID)

**"Tenant not found"**
- Use `common` as Tenant ID for multi-tenant apps
- Or use your specific Tenant ID from the Overview page

