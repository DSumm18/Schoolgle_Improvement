/**
 * Combined Class + Pupil Import
 *
 * POST /api/data-import/classes-pupils
 *
 * Imports classes with teachers and their pupils in one go.
 * Use this format when you have:
 * - Class name
 * - Teacher name
 * - Pupil list (by pupil_id or name)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import Papa from "papaparse";

function yearGroupToKeyStage(yearGroup: string): "EYFS" | "KS1" | "KS2" {
  const yg = yearGroup.toUpperCase().trim();
  if (yg === "R" || yg === "RECEPTION" || yg === "N" || yg === "NURSERY") return "EYFS";
  if (yg === "1" || yg === "2") return "KS1";
  return "KS2";
}

function yearGroupLabel(yearGroup: string): string {
  const yg = yearGroup.toUpperCase().trim();
  if (yg === "R" || yg === "RECEPTION") return "Reception";
  if (yg === "N" || yg === "NURSERY") return "Nursery";
  return `Year ${yg}`;
}

function mapSenStatusToHasEhcp(senStatus: string | null): boolean {
  if (!senStatus) return false;
  return senStatus.toUpperCase() === "E";
}

function mapSenStatusToHasSendSupport(senStatus: string | null): boolean {
  if (!senStatus) return false;
  const s = senStatus.toUpperCase();
  return s === "K" || s === "E";
}

const VALID_PRIMARY_NEEDS = [
  "SPLD", "MLD", "SLD", "PMLD", "SEMH", "SLCN", "HI", "VI", "MSI", "PD", "ASD", "OTH", "NSA",
];

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const { organizationId } = auth;

  const body = await req.json();

  // Support both CSV text and pre-parsed data
  let importData: any[] = [];
  let fileName = "import";

  if (body.csv) {
    // Parse CSV
    const csvLines = body.csv.split("\n").filter((l: string) => !l.trim().startsWith("#"));
    const filteredCsv = csvLines.join("\n");

    const parseResult = Papa.parse(filteredCsv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.toLowerCase().trim().replace(/[\s-]/g, "_"),
    });

    if (parseResult.errors.length > 0) {
      return apiError("CSV parse error: " + parseResult.errors.map((e: any) => e.message).join(", "), 400);
    }

    importData = parseResult.data as any[];
    fileName = body.filename || "import.csv";
  } else if (body.data && Array.isArray(body.data)) {
    importData = body.data;
  } else if (body.classes) {
    importData = body.classes;
  } else {
    return apiError("Provide 'csv' text or 'data' array or 'classes' array", 400);
  }

  // Expected columns (flexible):
  // Required: class_name, year_group
  // Optional: teacher_name, pupil_id, first_name, last_name, sen_status, primary_need, etc.
  //
  // Format options:
  // 1. One row per pupil: class_name, teacher_name, pupil_id, first_name, last_name, year_group
  // 2. One row per class: class_name, teacher_name, year_group, pupil_ids (comma-separated)

  const results = {
    classesCreated: 0,
    pupilsAdded: 0,
    errors: [] as string[],
  };

  const currentAcademicYear = "2025-26";

  // Group data by class
  const classMap = new Map<string, {
    className: string;
    yearGroup: string;
    keyStage: "EYFS" | "KS1" | "KS2";
    teacherName: string | null;
    pupils: any[];
  }>();

  // Process each row
  for (let i = 0; i < importData.length; i++) {
    const row = importData[i];
    const rowNum = i + 1;

    const className = (row.class_name || "").trim();
    const teacherName = (row.teacher_name || "").trim() || null;
    let yearGroup = (row.year_group || "").trim();

    if (!className) {
      results.errors.push(`Row ${rowNum}: Missing class_name`);
      continue;
    }

    if (!yearGroup) {
      results.errors.push(`Row ${rowNum}: Missing year_group`);
      continue;
    }

    // Normalize year group
    const ygLabel = yearGroupLabel(yearGroup);
    const keyStage = yearGroupToKeyStage(yearGroup);

    // Get or create class entry
    if (!classMap.has(className)) {
      classMap.set(className, {
        className,
        yearGroup: ygLabel,
        keyStage,
        teacherName,
        pupils: [],
      });
    } else if (teacherName) {
      // Update teacher name if provided
      const existing = classMap.get(className)!;
      if (!existing.teacherName) {
        existing.teacherName = teacherName;
      }
    }

    // Check if this row has pupil data
    const pupilId = (row.pupil_id || "").trim();
    const firstName = (row.first_name || "").trim();
    const lastName = (row.last_name || "").trim();

    if (pupilId || (firstName && lastName)) {
      const classEntry = classMap.get(className)!;

      // Handle comma-separated pupil_ids
      if (pupilId && pupilId.includes(",")) {
        const ids = pupilId.split(",").map((s: string) => s.trim());
        ids.forEach((id: string) => {
          classEntry.pupils.push({ pupil_id: id });
        });
      } else {
        classEntry.pupils.push({
          pupil_id: pupilId || `AUTO-${className}-${classEntry.pupils.length + 1}`,
          first_name: firstName || "Unknown",
          last_name: lastName || "Unknown",
          year_group: ygLabel,
          class_name: className,
          gender: (row.gender || "").trim() || null,
          sen_status: (row.sen_status || "").trim().toUpperCase() || null,
          primary_need: (row.primary_need || "").trim().toUpperCase() || null,
          is_pupil_premium: row.is_pupil_premium === "yes" || row.is_pupil_premium === true,
          is_eal: row.is_eal === "yes" || row.is_eal === true,
        });
      }
    }
  }

  // Now create the classes and pupils
  for (const [className, classData] of classMap.entries()) {
    // 1. Create/update the class in ls_classes
    const { data: classRecord, error: classError } = await supabase
      .from("ls_classes")
      .upsert({
        organization_id: organizationId,
        year_group: classData.yearGroup,
        class_name: className,
        key_stage: classData.keyStage,
        teacher_name: classData.teacherName,
        pupil_count: classData.pupils.length,
        academic_year: currentAcademicYear,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "organization_id,class_name,academic_year"
      })
      .select()
      .single();

    if (classError) {
      results.errors.push(`Class ${className}: ${classError.message}`);
      continue;
    }

    if (!classRecord.created_at || classRecord.created_at.toISOString() === classRecord.updated_at.toISOString()) {
      // New record (created_at and updated_at are the same for new records)
      results.classesCreated++;
    }

    const classId = classRecord.id;

    // 2. Create pupils in ls_pupils and pupils tables
    for (const pupil of classData.pupils) {
      const displayName = `enc:${pupil.first_name} ${pupil.last_name.charAt(0)}.`;

      const hasEhcp = pupil.sen_status === "E";
      const hasSendSupport = pupil.sen_status === "K" || pupil.sen_status === "E";

      // Insert into ls_pupils (Lesson Studio)
      const { error: lsPupilError } = await supabase
        .from("ls_pupils")
        .upsert({
          organization_id: organizationId,
          class_id: classId,
          pupil_ref: pupil.pupil_id,
          display_name_encrypted: displayName,
          year_group: classData.yearGroup,
          gender: pupil.gender,
          has_ehcp: hasEhcp,
          has_send_support: hasSendSupport,
          send_primary_need: pupil.primary_need,
          is_pupil_premium: pupil.is_pupil_premium,
          is_eal: pupil.is_eal,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,pupil_ref"
        });

      if (lsPupilError) {
        results.errors.push(`Pupil ${pupil.pupil_id}: ${lsPupilError.message}`);
        continue;
      }

      // Also insert into pupils master table
      const { error: masterPupilError } = await supabase
        .from("pupils")
        .upsert({
          organization_id: organizationId,
          pupil_id: pupil.pupil_id,
          first_name: pupil.first_name,
          last_name: pupil.last_name,
          year_group: classData.yearGroup,
          class_name: className,
          gender: pupil.gender,
          sen_status: pupil.sen_status,
          primary_need: pupil.primary_need,
          is_pupil_premium: pupil.is_pupil_premium,
          is_eal: pupil.is_eal,
          is_active: true,
          import_source: "csv",
          imported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,pupil_id"
        });

      if (masterPupilError) {
        console.error(`Error inserting into pupils table: ${masterPupilError.message}`);
        // Don't count as error - ls_pupils is the important one for Pupil Records
      }

      results.pupilsAdded++;
    }
  }

  return apiSuccess({
    success: results.errors.length === 0,
    ...results,
    message: results.errors.length === 0
      ? `Imported ${results.pupilsAdded} pupils across ${classMap.size} classes`
      : `Imported with ${results.errors.length} errors`,
    classes: Array.from(classMap.entries()).map(([name, data]) => ({
      name,
      teacher: data.teacherName,
      pupilCount: data.pupils.length,
    })),
  });
});
