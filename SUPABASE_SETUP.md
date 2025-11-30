# Supabase Database Setup Guide

## Overview
This guide will help you set up all required database tables for the Schoolgle application in Supabase.

## Prerequisites
- Supabase account and project created
- Project URL: `https://ygquvauptwyvlhkyxkwy.supabase.co`
- Service role key configured in `.env.local`

## Setup Steps

### Option 1: Run Complete Schema (Recommended for New Setup)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/
   - Select your project: `ygquvauptwyvlhkyxkwy`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Complete Schema**
   - Copy the entire contents of `supabase_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for completion (should see "Success" message)

### Option 2: Run Schema in Parts (For Large Databases)

If the complete schema times out, run these files in order:

1. **Part 1 - Core Tables** (`supabase_schema_part1_core.sql`)
   - Users, Organizations, Members, Invitations

2. **Part 2 - Assessments** (`supabase_schema_part2_assessments.sql`)
   - Ofsted/SIAMS Categories, Assessments, Evidence

3. **Part 3 - Documents** (`supabase_schema_part3_documents.sql`)
   - Document scanning, embeddings, evidence matches

4. **Part 4 - Operations** (`supabase_schema_part4_operations.sql`)
   - Actions, lesson observations, activity logs

5. **Part 5 - Modules & RLS** (`supabase_schema_part5_modules_rls.sql`)
   - Additional modules and Row Level Security policies

6. **Part 6 - Admin** (`supabase_schema_part6_admin.sql`)
   - Admin functions and views

## What Gets Created

### Core Tables
- ✅ `users` - User accounts (linked to Firebase Auth)
- ✅ `organizations` - Schools/organizations
- ✅ `organization_members` - User-organization relationships
- ✅ `invitations` - User invitations to organizations

### Ofsted Framework
- ✅ `ofsted_categories` - Main Ofsted categories
- ✅ `ofsted_subcategories` - Subcategories
- ✅ `ofsted_assessments` - School self-assessments
- ✅ `evidence_items` - Evidence tracking

### SIAMS Framework (Church Schools)
- ✅ `siams_strands` - SIAMS inspection strands
- ✅ `siams_assessments` - SIAMS assessments

### Document & Evidence Management
- ✅ `scanned_documents` - Uploaded/scanned documents
- ✅ `document_embeddings` - Vector embeddings for semantic search
- ✅ `evidence_matches` - AI-matched evidence to frameworks

### Actions & Observations
- ✅ `actions` - Improvement actions
- ✅ `action_notes` - Action notes/updates
- ✅ `lesson_observations` - Lesson observation records

### Additional Features
- ✅ `activity_log` - Audit trail
- ✅ Vector search capabilities (pgvector extension)
- ✅ Row Level Security (RLS) policies

## Verification Steps

After running the schema, verify tables were created:

1. **Check Table Count**
   ```sql
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
   Should show 20+ tables

2. **Verify Core Tables**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

3. **Check Ofsted Categories**
   ```sql
   SELECT COUNT(*) FROM ofsted_categories;
   ```
   Should return 7 rows (6 main categories + safeguarding)

4. **Verify Vector Extension**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
   Should show pgvector is installed

## Authentication Setup

### Enable Email Auth in Supabase

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Enable **Email confirmations** (recommended for production)

### Sync Firebase Users (If Migrating)

If you're migrating from Firebase, you'll need to:
1. Export users from Firebase
2. Import into Supabase `users` table
3. Update `auth.users` in Supabase

## Troubleshooting

### Error: "extension vector does not exist"
- The pgvector extension needs to be enabled
- Run: `create extension if not exists vector;`
- May require database restart

### Error: "permission denied"
- Make sure you're using the Service Role key
- Check your Supabase project permissions

### Tables Not Showing Up
- Refresh the Table Editor page
- Check SQL Editor output for errors
- Verify you're in the correct project

### RLS Errors When Testing
- RLS policies are configured for authenticated users
- Make sure you're logged in through Firebase
- Check `organization_members` table has your user_id

## Next Steps

After database setup:

1. ✅ Refresh your application at http://localhost:3000
2. ✅ Sign up for a new account (Firebase Auth)
3. ✅ Create/join an organization
4. ✅ Test Ofsted framework assessments
5. ✅ Test evidence scanning features

## Need Help?

- Check Supabase logs: **Database** → **Logs**
- Review table structure: **Table Editor**
- Test queries: **SQL Editor**
