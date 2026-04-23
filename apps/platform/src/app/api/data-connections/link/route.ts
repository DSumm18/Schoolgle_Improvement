import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Microsoft Graph API for OneDrive (no API key needed for anonymous shared links)
// Shared links work via sharing URL directly

console.log('[DataConnections] API Key check:');
console.log('- has GOOGLE_API_KEY:', !!process.env.GOOGLE_API_KEY);
console.log('- has GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
console.log('- using:', process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'NONE'));
console.log('- key prefix:', process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 20) : 'MISSING');

/**
 * POST /api/data-connections/link
 * Connect a Google Drive or OneDrive folder via shared link.
 * This is the main school data folder (not just Ofsted evidence).
 */
export const POST = protectedRoute(async (auth, req) => {
  console.log('[DataConnections] POST called', {
    userId: auth.userId,
    organizationId: auth.organizationId,
    role: auth.role,
  });

  const { organizationId, folderId, connectedBy, provider = 'google' } = await req.json();
  const orgId = organizationId || auth.organizationId;

  console.log('[DataConnections] Request body:', { organizationId, folderId, connectedBy, orgId, provider });

  if (!orgId || !folderId) {
    return apiError("Missing organizationId or folderId", 400);
  }

  if (!['google', 'microsoft'].includes(provider)) {
    return apiError("Invalid provider. Must be 'google' or 'microsoft'", 400);
  }

  // Handle Google Drive
  if (provider === 'google') {
    if (!GOOGLE_API_KEY) {
      console.error('[DataConnections] No Google API key configured!');
      return apiError(
        "Google Drive integration not configured. Contact support.",
        500,
      );
    }

    // Validate folder is accessible
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY,
          fields: "id,name,mimeType",
          supportsAllDrives: "true",
        }),
    );

    if (!driveRes.ok) {
      if (driveRes.status === 404 || driveRes.status === 403) {
        return apiError(
          "Cannot access this folder. Please check it is shared as 'Anyone with the link' with Viewer access.",
          403,
        );
      }
      return apiError("Failed to validate folder access", 500);
    }

    const folderData = await driveRes.json();

    if (folderData.mimeType !== "application/vnd.google-apps.folder") {
      return apiError(
        "This link points to a file, not a folder. Please share a folder link.",
        400,
      );
    }

    // Scan subfolder structure to detect data categories
    const detectedFolders = await scanGoogleFolder(folderId);
    const totalFolders = Object.keys(detectedFolders).length;

    const supabase = createServiceRoleClient();

    const { data: connection, error: dbError } = await supabase
      .from("school_data_connections")
      .upsert(
        {
          organization_id: orgId,
          provider: "google",
          folder_id: folderId,
          folder_name: folderData.name,
          connected_by: connectedBy || auth.userId || null,
          connected_at: new Date().toISOString(),
          is_active: true,
          scan_status: "complete",
          scan_error: null,
          detected_folders: detectedFolders,
          total_folders: totalFolders,
          total_files: 0,
        },
        { onConflict: "organization_id,provider" },
      )
      .select("*")
      .single();

    if (dbError) {
      console.error("[DataConnection] DB error:", dbError);
      return apiError("Failed to save connection", 500);
    }

    return apiSuccess({
      connection,
      folderName: folderData.name,
      detectedFolders,
    });
  }

  // Handle Microsoft OneDrive
  if (provider === 'microsoft') {
    // For OneDrive shared folders, we use the sharing URL format
    // OneDrive shared URLs look like: https://1drv.ms/f/s!AbCdEfGhIjKlMnOpQrStUvWx
    // Or: https://onedrive.live.com/?authkey=...&cid=...&id=...

    // For now, we'll store the connection but note that full scanning
    // requires OAuth access (Microsoft Graph API doesn't support anonymous
    // access to shared folders without authentication)
    const supabase = createServiceRoleClient();

    // Extract a clean folder ID from the provided ID
    const cleanFolderId = folderId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);

    const { data: connection, error: dbError } = await supabase
      .from("school_data_connections")
      .upsert(
        {
          organization_id: orgId,
          provider: "microsoft",
          folder_id: cleanFolderId,
          folder_name: "OneDrive Shared Folder",
          connected_by: connectedBy || auth.userId || null,
          connected_at: new Date().toISOString(),
          is_active: true,
          scan_status: "pending_oauth",
          scan_error: null,
          detected_folders: {},
          total_folders: 0,
          total_files: 0,
        },
        { onConflict: "organization_id,provider" },
      )
      .select("*")
      .single();

    if (dbError) {
      console.error("[DataConnection] DB error:", dbError);
      return apiError("Failed to save connection", 500);
    }

    return apiSuccess({
      connection,
      folderName: "OneDrive Shared Folder",
      detectedFolders: {},
      note: "OneDrive folder connections require OAuth to scan contents. Please use the OAuth flow for full access.",
    });
  }

  return apiError("Invalid provider", 400);
});

// ============================================================================
// SCHOOL DATA FOLDER STRUCTURE
// ============================================================================
// This maps common folder names to data categories for intelligent scanning.
// Schools can name folders using these patterns for auto-detection.
//
// RECOMMENDED FOLDER STRUCTURE:
// 📁 School Data (root)
//   ├─ 📁 01_Census_Reports          → DfE census returns & validation
//   ├─ 📁 02_Pupil_Data
//   │   ├─ 📁 Admissions
//   │   ├─ 📁 Attendance
//   │   ├─ 📁 Assessments
//   │   ├─ 📁 SEN_Register
//   │   └─ 📁 Pupil_Premium
//   ├─ 📁 03_Staff_Records
//   │   ├─ 📁 HR_Records
//   │   ├─ 📁_Training
//   │   └─ 📁 DBS_Checks
//   ├─ 📁 04_Finance
//   │   ├─ 📁 Budgets
//   │   ├─ 📁 Payroll
//   │   └─ 📁 Purchasing
//   ├─ 📁 05_Governance
//   │   ├─ 📁 Board_Meetings
//   │   ├─ 📁 Policies
//   │   └─ 📁 Risk_Register
//   ├─ 📁 06_Safeguarding
//   ├─ 📁 07_Estates
//   │   ├─ 📁 Health_and_Safety
//   │   ├─ 📁 Premises
//   │   └─ 📁 Asset_Register
//   ├─ 📁 08_Compliance
//   ├─ 📁 09_Ofsted_Evidence
//   └─ 📁 10_SIAMS_Evidence
// ============================================================================

const FOLDER_PATTERNS: Record<string, string> = {
  // Census & DfE Data (NEW)
  "census": "census",
  "school census": "census",
  "dfe": "census",
  "department for education": "census",
  "census return": "census",
  "census data": "census",

  // Pupil Data
  "pupil data": "pupils",
  "pupil roll": "pupils",
  "pupil information": "pupils",
  admissions: "pupils",
  "in year applications": "pupils",

  // Attendance
  attendance: "attendance",
  "attendance data": "attendance",
  absences: "attendance",

  // Assessments
  assessment: "assessments",
  assessments: "assessments",
  tracker: "assessments",
  "tracking": "assessments",
  "attainment": "assessments",
  progress: "assessments",
  "key stage": "assessments",
  ks1: "assessments",
  ks2: "assessments",
  "phonics screening": "assessments",
  "multiplication check": "assessments",

  // SEN
  sen: "send",
  send: "send",
  "special educational needs": "send",
  "send register": "send",
  "ehcp": "send",
  "education health care plan": "send",

  // Pupil Premium
  "pupil premium": "pupil_premium",
  "disadvantaged": "pupil_premium",
  "pp strategy": "pupil_premium",

  // Behaviour
  behaviour: "behaviour",
  behavior: "behaviour",
  exclusions: "behaviour",
  "behaviour data": "behaviour",
  "behavior data": "behaviour",

  // Staff / HR
  staff: "staff",
  "staff data": "staff",
  "staff records": "staff",
  hr: "staff",
  "human resources": "staff",
  "personnel": "staff",
  "staff handbook": "staff",

  // Training
  training: "training",
  "cpd": "training",
  "professional development": "training",
  "performance management": "training",

  // DBS Checks
  dbs: "dbs",
  "disclosure and barring": "dbs",
  "single central record": "dbs",
  scr: "dbs",

  // Finance
  finance: "fms",
  "financial management": "fms",
  fms: "fms",
  "school budget": "fms",
  budget: "fms",
  "consistent financial reporting": "fms",
  cfr: "fms",

  // Payroll
  payroll: "payroll",
  "payroll data": "payroll",
  salaries: "payroll",

  // Purchasing
  purchasing: "purchasing",
  procurement: "purchasing",
  "contract management": "purchasing",

  // Governance
  governance: "governance",
  "governing body": "governance",
  "full governing body": "governance",
  fgb: "governance",
  "board meetings": "governance",
  "governor meetings": "governance",
  "committee meetings": "governance",
  "governor board": "governance",
  "governors": "governance",

  // Policies & Documents
  policies: "policies",
  "policy documents": "policies",
  "school policies": "policies",
  document: "policies",
  documents: "policies",
  documentation: "policies",

  // Risk
  risk: "risk",
  "risk register": "risk",
  "risk assessment": "risk",
  "risks": "risk",

  // Safeguarding
  safeguarding: "safeguarding",
  "child protection": "safeguarding",
  "looked after children": "safeguarding",
  lac: "safeguarding",
  dsl: "safeguarding",
  "designated safeguarding lead": "safeguarding",

  // Estates & Facilities
  estates: "estates",
  facilities: "estates",
  premises: "estates",
  "health and safety": "estates",
  health_safety: "estates",
  "health & safety": "estates",
  "h&s": "estates",
  "asset register": "estates",
  assets: "estates",
  "property": "estates",
  maintenance: "estates",

  // Compliance
  compliance: "compliance",
  gdpr: "compliance",
  "data protection": "compliance",
  "freedom of information": "compliance",
  foi: "compliance",

  // Ofsted Evidence
  ofsted: "ofsted",
  "ofsted evidence": "ofsted",
  "ofsted inspection": "ofsted",
  inspection: "ofsted",
  "section 8": "ofsted",
  "section 5": "ofsted",

  // SIAMS (Church Schools)
  siams: "siams",
  "siams evidence": "siams",
  "statutory inspection of anglican schools": "siams",
  "church school": "siams",
  "diocese": "siams",

  // Curriculum
  curriculum: "curriculum",
  "curriculum planning": "curriculum",
  "scheme of work": "curriculum",
  schemes: "curriculum",
  "lesson planning": "curriculum",
  "learning objectives": "curriculum",

  // Teaching & Learning
  "teaching and learning": "teaching_learning",
  "teaching & learning": "teaching_learning",
  "quality of education": "teaching_learning",
  pedagogy: "teaching_learning",

  // Communications
  communications: "communications",
  newsletters: "communications",
  "parent communications": "communications",
  "school newsletter": "communications",
  website: "communications",
  "school website": "communications",
  "social media": "communications",

  // Meetings (General)
  meetings: "meetings",
  "staff meetings": "meetings",
  "parent meetings": "meetings",
  "meeting minutes": "meetings",

  // External Reports
  "external reports": "external_reports",
  "dfe reports": "external_reports",
  "local authority": "external_reports",
  "la reports": "external_reports",
};

async function scanGoogleFolder(
  rootFolderId: string,
  parentPath = "",
): Promise<
  Record<string, { category: string; files: number; folderId: string }>
> {
  if (!GOOGLE_API_KEY) return {};

  const result: Record<
    string,
    { category: string; files: number; folderId: string }
  > = {};

  try {
    // List items in this folder
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY,
          q: `'${rootFolderId}' in parents and trashed = false`,
          fields: "files(id,name,mimeType)",
          pageSize: "100",
          supportsAllDrives: "true",
          includeItemsFromAllDrives: "true",
        }),
    );

    if (!listRes.ok) return result;

    const listData = await listRes.json();
    const items = listData.files || [];

    let fileCount = 0;
    const subfolders: { id: string; name: string }[] = [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        subfolders.push({ id: item.id, name: item.name });
      } else {
        fileCount++;
      }
    }

    // Detect category for this folder
    const folderName = parentPath || "root";
    const lowerName = folderName.toLowerCase();
    let detectedCategory = "unknown";

    for (const [pattern, category] of Object.entries(FOLDER_PATTERNS)) {
      if (lowerName.includes(pattern)) {
        detectedCategory = category;
        break;
      }
    }

    // If this folder has files and a detected category, record it
    if (fileCount > 0 && detectedCategory !== "unknown") {
      result[folderName] = {
        category: detectedCategory,
        files: fileCount,
        folderId: rootFolderId,
      };
    }

    // Recurse into subfolders (max 2 levels deep)
    const depth = parentPath.split("/").filter(Boolean).length;
    if (depth < 3) {
      for (const sub of subfolders) {
        const subPath = parentPath ? `${parentPath}/${sub.name}` : sub.name;
        const subResult = await scanFolderStructure(sub.id, subPath);
        Object.assign(result, subResult);
      }
    }
  } catch (err) {
    console.error("[DataConnection] Scan error:", err);
  }

  return result;
}
