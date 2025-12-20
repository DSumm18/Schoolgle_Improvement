Phase 5: DfE integration complete
Discovery report
DfE tables found:
dfe_data.schools - School basic info (URN, name, type, phase, LA)
dfe_data.school_profiles - Extended profile data
dfe_data.school_history - Historical data
dfe_data.area_demographics - Area demographics
dfe_data.local_authority_finance - LA finance
dfe_data.school_area_links - School-area relationships
Linking strategy: organizations.urn → dfe_data.schools.urn
Implementation
Risk tool (packages/mcp-server/src/tools/risk.ts)
Calculates risk: Time + Change + Performance
Queries DfE tables (no ingestion needed)
Returns risk score, predicted window, factors, recommendations
Dashboard updated (apps/platform/src/app/dashboard/page.tsx)
Shows school name from DfE
Displays last inspection date/rating
Shows headteacher tenure (with "New" badge)
Displays predicted window and risk factors
API route (apps/platform/src/app/api/risk/profile/route.ts)
Endpoint: POST /api/risk/profile
Calls the MCP risk tool
MCP server registration
Tool registered: get_inspection_risk_profile
Available via MCP protocol
Next steps
Create RPC functions in Supabase (see PHASE5_DFE_INTEGRATION_REPORT.md):
get_last_inspection(school_urn)
get_performance_trends(school_urn)
get_headteacher_info(school_urn)
These replace the fallback queries and use your actual DfE table structure.
No ingestion script needed — uses existing DfE data.