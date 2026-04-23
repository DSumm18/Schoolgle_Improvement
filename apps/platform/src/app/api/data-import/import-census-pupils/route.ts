/**
 * Import Pupils from Census XML
 *
 * POST /api/data-import/import-census-pupils
 *
 * Reads a DfE Census XML file and extracts pupil data to populate:
 * - ls_classes (grouped by year group)
 * - ls_pupils (with names and demographics)
 * - pupils (master table)
 *
 * This gives immediate pupil visibility without needing a separate CSV export.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { parseString } from "xml2js";

function yearGroupToKeyStage(yearGroup: string): "EYFS" | "KS1" | "KS2" {
  const yg = String(yearGroup).toUpperCase().trim();
  if (yg === "R" || yg === "RECEPTION" || yg === "N" || yg === "NURSERY") return "EYFS";
  if (yg === "1" || yg === "2") return "KS1";
  return "KS2";
}

function yearGroupLabel(ncYear: string): string {
  const yg = String(ncYear).toUpperCase().trim();
  if (yg === "R" || yg === "RECEPTION") return "Reception";
  if (yg === "N" || yg === "NURSERY") return "Nursery";
  const num = parseInt(yg.replace(/^Y/, ""));
  if (!isNaN(num) && num >= 1 && num <= 13) return `Year ${num}`;
  return yg;
}

interface CensusPupil {
  UPN: string;
  Forename: string;
  Surname: string;
  Gender: string;
  DOB: string;
  NCYear: string;
  Ethnicity: string;
  Language: string;
  FSM: string;
  SENProvision: string;
  SENTypePrimary: string;
  ServiceChild: string;
  EnrolStatus: string;
}

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const { organizationId } = auth;

  const body = await req.json();

  // Support XML content directly or fetch from Drive
  let xmlContent: string = "";

  if (body.xml) {
    xmlContent = body.xml;
  } else if (body.fileId) {
    // Try to fetch from Google Drive
    const fileId = body.fileId;

    // Get access token from OAuth
    const { data: tokens } = await supabase
      .from("user_oauth_tokens")
      .select("access_token")
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!tokens?.access_token) {
      return apiError("No Google OAuth token found. Please connect Google Drive.", 401);
    }

    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!fileResponse.ok) {
      return apiError(`Failed to fetch file from Drive: ${fileResponse.statusText}`, 500);
    }

    xmlContent = await fileResponse.text();
  } else {
    return apiError("Provide 'xml' content or 'fileId'", 400);
  }

  if (!xmlContent || xmlContent.length < 100) {
    return apiError("Invalid or empty XML content", 400);
  }

  // Parse XML
  let censusData: any;
  try {
    censusData = await new Promise((resolve, reject) => {
      parseString(xmlContent, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  } catch (err) {
    return apiError(`Failed to parse XML: ${err}`, 400);
  }

  const censusReturn = censusData?.CensusReturn;
  if (!censusReturn) {
    return apiError("Invalid Census XML format (missing CensusReturn)", 400);
  }

  const header = censusReturn.Headings || {};
  const pupils = Array.isArray(censusReturn.Pupil)
    ? censusReturn.Pupil
    : [censusReturn.Pupil].filter(Boolean);

  const censusTerm = header.Term || "UNK";
  const censusYear = parseInt(header.Year) || new Date().getFullYear();

  const results = {
    censusTerm,
    censusYear,
    pupilsProcessed: 0,
    pupilsImported: 0,
    classesCreated: 0,
    errors: [] as string[],
  };

  // Group pupils by year group to create classes
  const yearGroupMap = new Map<string, CensusPupil[]>();

  for (const pupil of pupils) {
    if (!pupil.UPN) continue;

    const ncYear = pupil.NCYear || "R";
    if (!yearGroupMap.has(ncYear)) {
      yearGroupMap.set(ncYear, []);
    }
    yearGroupMap.get(ncYear)!.push(pupil as CensusPupil);
    results.pupilsProcessed++;
  }

  const currentAcademicYear = "2025-26";

  // Create classes and import pupils
  for (const [ncYear, pupilList] of yearGroupMap.entries()) {
    const ygLabel = yearGroupLabel(ncYear);
    const keyStage = yearGroupToKeyStage(ncYear);
    const className = ygLabel; // Use year group as class name (e.g., "Year 4", "Reception")

    // Create class in ls_classes
    const { data: classRecord, error: classError } = await supabase
      .from("ls_classes")
      .upsert({
        organization_id: organizationId,
        year_group: ygLabel,
        class_name: className,
        key_stage: keyStage,
        pupil_count: pupilList.length,
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

    results.classesCreated++;

    const classId = classRecord.id;

    // Import pupils for this year group
    for (const pupil of pupilList) {
      const displayName = `enc:${pupil.Forename} ${pupil.Surname.charAt(0)}.`;
      const pupilId = pupil.UPN;
      const senProvision = (pupil.SENProvision || "").toUpperCase();
      const hasEhcp = senProvision === "E" || senProvision === "EHCP";
      const hasSendSupport = hasEhcp || senProvision === "K" || senProvision === "SEN SUPPORT";

      // Determine PP status
      const isPupilPremium =
        pupil.FSM === "Y" || pupil.FSM === "1" || pupil.FSM === "true";

      // Determine EAL status
      const isEal =
        pupil.Language && pupil.Language !== "ENG" && pupil.Language !== "eng";

      // Insert into ls_pupils
      const { error: lsPupilError } = await supabase
        .from("ls_pupils")
        .upsert({
          organization_id: organizationId,
          class_id: classId,
          pupil_ref: pupilId,
          display_name_encrypted: displayName,
          year_group: ygLabel,
          gender: pupil.Gender || null,
          has_ehcp: hasEhcp,
          has_send_support: hasSendSupport,
          send_primary_need: pupil.SENTypePrimary || null,
          is_pupil_premium: isPupilPremium,
          is_eal: isEal,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,pupil_ref"
        });

      if (lsPupilError) {
        results.errors.push(`Pupil ${pupilId}: ${lsPupilError.message}`);
        continue;
      }

      // Also insert into pupils master table
      const { error: masterPupilError } = await supabase
        .from("pupils")
        .upsert({
          organization_id: organizationId,
          pupil_id: pupilId,
          first_name: pupil.Forename,
          last_name: pupil.Surname,
          year_group: ygLabel,
          class_name: className,
          gender: pupil.Gender || null,
          date_of_birth: pupil.DOB || null,
          ethnicity: pupil.Ethnicity || null,
          sen_status: hasEhcp ? "E" : hasSendSupport ? "K" : null,
          primary_need: pupil.SENTypePrimary || null,
          fsm_eligible: isPupilPremium,
          is_pupil_premium: isPupilPremium,
          is_eal: isEal,
          is_active: true,
          import_source: "census_xml",
          imported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,pupil_id"
        });

      if (masterPupilError) {
        console.error(`Error inserting into pupils table: ${masterPupilError.message}`);
      }

      results.pupilsImported++;
    }
  }

  return apiSuccess({
    success: results.errors.length === 0,
    ...results,
    message: results.errors.length === 0
      ? `Imported ${results.pupilsImported} pupils from ${censusTerm} ${censusYear} census`
      : `Imported with ${results.errors.length} errors`,
    classes: Array.from(yearGroupMap.keys()).map(yg => ({
      name: yearGroupLabel(yg),
      pupilCount: yearGroupMap.get(yg)!.length,
    })),
  });
});
