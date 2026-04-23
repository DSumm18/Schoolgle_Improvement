/**
 * Sync Pupils to Lesson Studio
 *
 * POST /api/pupils/sync-to-lesson-studio
 *
 * Reads from the master `pupils` table and populates `ls_classes` and `ls_pupils`
 * for the Teaching & Learning → Pupil Records view.
 *
 * This bridges the gap between:
 * - `pupils` table (populated by CSV import, MIS integrations)
 * - `ls_pupils` / `ls_classes` tables (used by Lesson Studio, Pupil Records page)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

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

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const { organizationId } = auth;

  // Get all active pupils from master table
  const { data: pupils, error: pupilsError } = await supabase
    .from("pupils")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (pupilsError) {
    console.error("[Sync to Lesson Studio] Error fetching pupils:", pupilsError);
    return apiError("Failed to fetch pupils", 500);
  }

  if (!pupils || pupils.length === 0) {
    return apiSuccess({
      success: true,
      message: "No pupils found to sync",
      classesCreated: 0,
      pupilsSynced: 0,
    });
  }

  const currentAcademicYear = "2025-26"; // TODO: make this dynamic

  // Group pupils by class_name to create classes
  const classMap = new Map<string, {
    className: string;
    yearGroup: string;
    keyStage: "EYFS" | "KS1" | "KS2";
    pupilCount: number;
    pupils: typeof pupils;
  }>();

  // First pass: group by class_name (or year_group if no class_name)
  for (const pupil of pupils) {
    const className = pupil.class_name?.trim() || yearGroupLabel(pupil.year_group);
    const ygLabel = yearGroupLabel(pupil.year_group);

    if (!classMap.has(className)) {
      classMap.set(className, {
        className,
        yearGroup: ygLabel,
        keyStage: yearGroupToKeyStage(pupil.year_group),
        pupilCount: 0,
        pupils: [],
      });
    }

    const classData = classMap.get(className)!;
    classData.pupilCount++;
    classData.pupils.push(pupil);
  }

  // Create or update classes
  let classesCreated = 0;
  let pupilsSynced = 0;

  for (const [className, classData] of classMap.entries()) {
    // Upsert class
    const { data: classRecord, error: classError } = await supabase
      .from("ls_classes")
      .upsert({
        organization_id: organizationId,
        year_group: classData.yearGroup,
        class_name: className,
        key_stage: classData.keyStage,
        pupil_count: classData.pupilCount,
        academic_year: currentAcademicYear,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "organization_id,class_name,academic_year"
      })
      .select()
      .single();

    if (classError) {
      console.error(`[Sync] Error upserting class ${className}:`, classError);
      continue;
    }

    if (classRecord && !classRecord.created_at?.toString().includes(classRecord.updated_at?.toString() || "")) {
      classesCreated++; // Actually created (not just updated)
    }

    const classId = classRecord.id;

    // Sync pupils for this class
    for (const pupil of classData.pupils) {
      const displayName = `enc:${pupil.first_name} ${pupil.last_name.charAt(0)}.`;

      // Map SEN status
      const hasEhcp = mapSenStatusToHasEhcp(pupil.sen_status);
      const hasSendSupport = mapSenStatusToHasSendSupport(pupil.sen_status);

      // Determine attainment from any existing data (defaults to null)
      // In a real sync, you might pull this from assessment data
      const attainmentReading = null;
      const attainmentWriting = null;
      const attainmentMaths = null;
      const attainmentScience = null;

      const { error: pupilError } = await supabase
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
          is_looked_after: pupil.is_looked_after,
          attainment_reading: attainmentReading,
          attainment_writing: attainmentWriting,
          attainment_maths: attainmentMaths,
          attainment_science: attainmentScience,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,pupil_ref"
        });

      if (pupilError) {
        console.error(`[Sync] Error upserting pupil ${pupil.pupil_id}:`, pupilError);
      } else {
        pupilsSynced++;
      }
    }
  }

  return apiSuccess({
    success: true,
    message: `Synced ${pupilsSynced} pupils across ${classMap.size} classes`,
    classesCreated: classMap.size,
    pupilsSynced,
    totalPupilsInMaster: pupils.length,
    classes: Array.from(classMap.keys()).map(name => ({
      name,
      ...classMap.get(name)!,
    })),
  });
});
