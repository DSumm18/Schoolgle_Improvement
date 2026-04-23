# Aurora Onboarding Pack - Current Status

**Date:** 2026-03-21
**Status:** Ready to upload to Google Drive once MCP is working

## What's Complete

### Test Pack Created
Location: `C:\Dev\Schoolgle_Improvement\schoolgle-drive-test-pack\Schoolgle Drive - Aurora Primary\`

### Files Ready (17 total)
1. **01 - School Details/**: school_profile.csv
2. **02 - MIS Exports/** (7 real Aurora files):
   - Pupils: arbor_pupil_roll.xlsx (420 pupils)
   - Staff: arbor_staff_export.xlsx (35 staff)
   - Classes: arbor_teacher_class_history.xlsx (14 classes)
   - Attendance: arbor_attendance_termly.xlsx
   - Behaviour: arbor_behaviour_export.xlsx
   - SEND: sen_register_arbor.xlsx
   - Assessment: insight_tracker_export.xlsx
3. **03 - Finance/** (3 real Aurora files):
   - Budget: fms_budget_summary_3yr.xlsx
   - Cost Centres: fms_detailed_cost_centre_2024-25.xlsx, fms_detailed_cost_centre_2025-26.xlsx
4. **04 - Site Plans & Premises/** (2 synthetic):
   - room_register_aurora.csv (35 rooms)
   - room_class_mapping_2025-26.csv (14 class mappings)
5. **05 - Estates & Compliance/** (3 synthetic):
   - asset_register_2025.csv (150 assets)
   - contractor_register_2025.csv (12 contractors)
   - statutory_compliance_calendar_2025.csv (15 statutory checks)
6. **06 - Historic Imports/** (1 real):
   - historical_ks2_results.xlsx

### Validation Passed
- ✅ 420 pupils, 35 staff, 14 classes validated
- ✅ All MIS exports integrity checks passed
- ✅ Room register: 35 rooms across 4 floors
- ✅ Asset register: 150 assets with compliance tagging
- ✅ Contractor register: 12 contractors with accreditations
- ✅ Compliance calendar: 15 statutory checks

## Google Drive MCP Status

### Configured
- OAuth credentials obtained
- Account "schoolgle" added successfully
- Tokens stored in: `C:\Users\dsumm\.google-mcp\tokens\schoolgle.json`
- MCP status: ✅ Server is ready

### Claude Config
In `C:\Users\dsumm\.claude.json`:
```json
"mcpServers": {
  "google-workspace": {
    "type": "stdio",
    "command": "cmd",
    "args": ["/c", "npx", "-y", "google-workspace-mcp"],
    "env": {
      "GOOGLE_CREDENTIALS": "C:\\Users\\dsumm\\.google-mcp\\credentials.json"
    }
  }
}
```

## Next Steps After Restart

1. Test Google Drive MCP: `mcp__google-workspace__list_files`
2. Create folder "Schoolgle Drive - Aurora Primary" in Drive
3. Upload all 17 files to appropriate subfolders
4. Test onboarding scan in Schoolgle platform

## Zip Backup
Location: `C:\Dev\Schoolgle_Improvement\Aurora-Primary-Onboarding-Pack.zip` (986 KB)
