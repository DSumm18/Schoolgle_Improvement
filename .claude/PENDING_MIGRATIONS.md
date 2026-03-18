# PENDING DATABASE MIGRATIONS

**Created**: 2026-03-18
**Status**: PENDING — Run these via Supabase MCP or Supabase CLI when access token is available

## Instructions for Claude Code

When a session has Supabase MCP tools or `SUPABASE_ACCESS_TOKEN` available, run these 7 migration files **in order** against the production Supabase database. Each file is idempotent (uses `CREATE TABLE IF NOT EXISTS` or similar patterns).

After running all migrations successfully, delete this file and commit.

## Migration Files (run in this order)

| Order | File | Path | Purpose |
|-------|------|------|---------|
| 1 | `20260314_staff_connectors.sql` | `apps/platform/supabase/migrations/20260314_staff_connectors.sql` | Staff responsibility engine — connector_types, staff_connectors, connector_tasks, connector_change_log, contract_connector_links |
| 2 | `20260314_icfp_staffing_modeller.sql` | `apps/platform/supabase/migrations/20260314_icfp_staffing_modeller.sql` | ICFP staffing/budget modeller tables |
| 3 | `20260315_lesson_studio.sql` | `apps/platform/supabase/migrations/20260315_lesson_studio.sql` | Lesson planning — ls_classes, ls_pupils, ls_timetable_slots, ls_scheme_mappings, etc. |
| 4 | `20260315_school_notices_display_feed.sql` | `apps/platform/supabase/migrations/20260315_school_notices_display_feed.sql` | school_notices, notice_acknowledgements, display_presets, quick_messages |
| 5 | `20260315_video_rooms_assembly_comms.sql` | `apps/platform/supabase/migrations/20260315_video_rooms_assembly_comms.sql` | video_rooms, video_room_participants, assembly_schedules, communication_settings |
| 6 | `20260315_emergency_broadcast_branding.sql` | `apps/platform/supabase/migrations/20260315_emergency_broadcast_branding.sql` | school_branding, emergency_zones, emergency_broadcasts, emergency_display_devices, emergency_acknowledgements, emergency_broadcast_log, emergency_zone_instructions |
| 7 | `20260315_comms_enhancements.sql` | `apps/platform/supabase/migrations/20260315_comms_enhancements.sql` | notice_templates, scheduled_notices, comms_analytics, emergency_drill_schedule, emergency_drill_reports, school_calendar_events |

## How to Run

### Option A: Supabase MCP (if available)
```
Use the Supabase MCP execute_sql tool to run each file's contents in order.
```

### Option B: Supabase CLI
```bash
export SUPABASE_ACCESS_TOKEN=<token>
cd apps/platform
npx supabase db push
```

### Option C: Manual
Copy-paste each file into Supabase Dashboard → SQL Editor → Run.

## Also Needed

After merging `claude/sen-funding-research-8Aff3` into `master` on GitHub, the Vercel deploy will pick up the code changes. The migrations are required for the new features to work:

- **Communications Hub** (`/dashboard/comms`)
- **Classroom Display** (`/display`)
- **Emergency Broadcast** (`/dashboard/emergency-broadcast`)
- **Staff Connectors** (`/dashboard/connectors`)
- **Staffing Modeller** (`/dashboard/finance/staffing-modeller`)
- **Lesson Studio** (`/dashboard/teaching-learning/lesson-studio`)
