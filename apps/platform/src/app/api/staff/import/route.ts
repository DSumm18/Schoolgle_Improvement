import { NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildEmptyStaffImportCsv,
  buildStaffImportTemplateCsv,
} from "@/lib/staff-import-template";
import Papa from "papaparse";

// Valid role categories
const VALID_ROLE_CATEGORIES = [
  "headteacher",
  "deputy_headteacher",
  "assistant_headteacher",
  "subject_lead",
  "phase_lead",
  "class_teacher",
  "sendco",
  "business_manager",
  "site_manager",
  "governor",
  "teaching_assistant",
  "support_staff",
  "other",
];

// Normalize boolean values
type StaffImportRow = Record<string, string | undefined>;

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return (
      lower === "yes" || lower === "true" || lower === "y" || lower === "1"
    );
  }
  return false;
};

// Normalize salutation
const normalizeSalutation = (value: unknown): string | null => {
  if (!value) return null;
  const valid = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Miss"];
  const normalized = String(value).trim();
  return valid.includes(normalized) ? normalized : null;
};

// Normalize role category
const normalizeRoleCategory = (value: unknown): string => {
  if (!value) return "other";
  const normalized = String(value).toLowerCase().trim().replace(/[\s-]/g, "_");

  if (VALID_ROLE_CATEGORIES.includes(normalized)) {
    return normalized;
  }

  // Fuzzy matching for common variations
  const mappings: Record<string, string> = {
    head: "headteacher",
    head_teacher: "headteacher",
    ht: "headteacher",
    deputy: "deputy_headteacher",
    deputy_head: "deputy_headteacher",
    dht: "deputy_headteacher",
    assistant_head: "assistant_headteacher",
    ah: "assistant_headteacher",
    aht: "assistant_headteacher",
    subject_leader: "subject_lead",
    subject_coordinator: "subject_lead",
    phase_leader: "phase_lead",
    phase_coordinator: "phase_lead",
    teacher: "class_teacher",
    classteacher: "class_teacher",
    sen_co: "sendco",
    senco: "sendco",
    special_educational_needs_coordinator: "sendco",
    bm: "business_manager",
    sbm: "business_manager",
    school_business_manager: "business_manager",
    site: "site_manager",
    facilities: "site_manager",
    ta: "teaching_assistant",
    teaching_assistant_level_1: "teaching_assistant",
    teaching_assistant_level_2: "teaching_assistant",
    ta2: "teaching_assistant",
    support: "support_staff",
    admin: "support_staff",
    administrator: "support_staff",
  };

  return mappings[normalized] || "other";
};

function normalizeStaffHeader(header: string) {
  return header.toLowerCase().trim().replace(/\*/g, "").replace(/[\s-]/g, "_");
}

function findStaffHeaderIndex(lines: string[]) {
  const index = lines.findIndex((line) => {
    const headers = line.split(",").map(normalizeStaffHeader);
    return headers.includes("first_name") && headers.includes("last_name") && headers.includes("job_title");
  });
  return index >= 0 ? index : 0;
}

// POST /api/staff/import - Import staff from CSV
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const { csvData } = body;
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!csvData) {
    return apiError("csvData is required", 400);
  }

  // Filter out comment lines (starting with #) before parsing
  const lines = csvData.split("\n");
  const dataLines = lines.filter(
    (line: string) => !line.trim().startsWith("#"),
  );
  const filteredCsvData = dataLines.slice(findStaffHeaderIndex(dataLines)).join("\n");

  // Parse CSV (skipping comment lines)
  const parseResult = Papa.parse(filteredCsvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeStaffHeader,
  });

  if (parseResult.errors.length > 0) {
    console.error("CSV parse errors:", parseResult.errors);
    return apiError(
      "Failed to parse CSV: " +
        parseResult.errors.map((e) => e.message).join(", "),
      400,
    );
  }

  const rows = parseResult.data as StaffImportRow[];
  const results = {
    success: true,
    imported: 0,
    updated: 0,
    archived: 0,
    errors: [] as Array<{ row: number; data: StaffImportRow; error: string }>,
    warnings: [] as string[],
  };

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because header is row 1, and we're 0-indexed

    try {
      // Validate required fields
      if (!row.first_name || !row.last_name) {
        results.errors.push({
          row: rowNum,
          data: row,
          error: "Missing first_name or last_name",
        });
        continue;
      }

      if (!row.job_title) {
        results.errors.push({
          row: rowNum,
          data: row,
          error: "Missing job_title",
        });
        continue;
      }

      const normalizedData = {
        organization_id: orgId,
        salutation: normalizeSalutation(row.salutation),
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        employee_id: row.employee_id?.trim() || null,
        job_title: row.job_title.trim(),
        role_category: normalizeRoleCategory(row.role_category || row.role),
        is_super_user: normalizeBoolean(row.is_super_user),
        is_active: normalizeBoolean(
          row.is_active !== undefined ? row.is_active : true,
        ),
        import_source: "csv_import" as const,
        imported_at: new Date().toISOString(),
      };

      // Check action column (what to do with this row)
      const action = (row.action || row.status || "").toLowerCase().trim();
      const removeActions = [
        "remove",
        "delete",
        "archive",
        "inactive",
        "removed",
        "archived",
        "deleted",
      ];

      // Check if staff member already exists (by email or employee_id)
      let existingStaff = null;

      if (normalizedData.email) {
        const { data: byEmail } = await supabase
          .from("staff_directory")
          .select("id, is_active")
          .eq("organization_id", orgId)
          .eq("email", normalizedData.email)
          .maybeSingle();
        existingStaff = byEmail;
      }

      if (!existingStaff && normalizedData.employee_id) {
        const { data: byEmpId } = await supabase
          .from("staff_directory")
          .select("id, is_active")
          .eq("organization_id", orgId)
          .eq("employee_id", normalizedData.employee_id)
          .maybeSingle();
        existingStaff = byEmpId;
      }

      // Handle REMOVE action
      if (removeActions.includes(action)) {
        if (existingStaff) {
          const { error: updateError } = await supabase
            .from("staff_directory")
            .update({ is_active: false })
            .eq("id", existingStaff.id);

          if (updateError) {
            results.errors.push({
              row: rowNum,
              data: row,
              error: updateError.message,
            });
          } else {
            results.archived++;
          }
        } else {
          results.warnings.push(
            `Row ${rowNum}: Staff member "${normalizedData.first_name} ${normalizedData.last_name}" not found - cannot remove`,
          );
        }
        continue;
      }

      if (existingStaff) {
        // Update existing staff
        const { error: updateError } = await supabase
          .from("staff_directory")
          .update({
            ...normalizedData,
            is_active: normalizedData.is_active, // Preserve active status from CSV
          })
          .eq("id", existingStaff.id);

        if (updateError) {
          results.errors.push({
            row: rowNum,
            data: row,
            error: updateError.message,
          });
        } else {
          results.updated++;
        }
      } else {
        // Insert new staff
        const { error: insertError } = await supabase
          .from("staff_directory")
          .insert(normalizedData);

        if (insertError) {
          results.errors.push({
            row: rowNum,
            data: row,
            error: insertError.message,
          });
        } else {
          results.imported++;
        }
      }
    } catch (err: unknown) {
      results.errors.push({
        row: rowNum,
        data: row,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Add warnings for any unusual data patterns
  const noEmailCount = rows.filter((r) => !r.email).length;
  if (noEmailCount > 0) {
    results.warnings.push(
      `${noEmailCount} staff member(s) without email address`,
    );
  }

  const noEmployeeIdCount = rows.filter((r) => !r.employee_id).length;
  if (noEmployeeIdCount > 0) {
    results.warnings.push(
      `${noEmployeeIdCount} staff member(s) without employee ID`,
    );
  }

  return apiSuccess(results);
});

// GET /api/staff/import?type=template|export
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (type === "export" && organizationId) {
    // Export current staff as CSV for round-trip editing
    const { data: staff } = await supabase
      .from("staff_directory")
      .select("*")
      .eq("organization_id", organizationId)
      .order("last_name", { ascending: true });

    if (!staff || staff.length === 0) {
      // Return empty template with instructions
      return new NextResponse(buildEmptyStaffImportCsv(), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="staff_directory_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Build CSV with current data
    const rows = staff.map((s) => [
      s.salutation || "",
      s.first_name || "",
      s.last_name || "",
      s.email || "",
      s.phone || "",
      s.employee_id || "",
      s.job_title || "",
      s.role_category || "",
      s.is_super_user ? "yes" : "no",
      s.is_active ? "yes" : "no",
      s.is_active ? "keep" : "removed",
    ]);

    const csv = [
      buildEmptyStaffImportCsv(),
      ...rows.map((row) => row.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="staff_directory_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  if (type === "template") {
    return new NextResponse(buildStaffImportTemplateCsv(), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          'attachment; filename="staff_directory_template.csv"',
      },
    });
  }

  return apiError("Invalid request", 400);
});
