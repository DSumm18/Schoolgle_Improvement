import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ---------------------------------------------------------------------------
// GET — Fetch schemes for a class
// ---------------------------------------------------------------------------

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;
  const classId = url.searchParams.get("classId");
  const action = url.searchParams.get("action");
  const organizationId = auth.organizationId ?? url.searchParams.get("organizationId");

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  // Oak search proxy
  if (action === "oak-search") {
    const subject = url.searchParams.get("subject") ?? "Mathematics";
    const keyStage = url.searchParams.get("keyStage") ?? "KS2";
    // Return a lightweight list — real Oak connector requires OAK_API_KEY
    // For now return mock units based on subject
    const mockUnits = generateMockOakUnits(subject, keyStage);
    return apiSuccess({ data: mockUnits });
  }

  if (!classId) {
    return apiError("classId is required", 400);
  }

  // Fetch scheme mappings
  const { data: mappings, error: mErr } = await supabase
    .from("ls_scheme_mappings")
    .select("*")
    .eq("class_id", classId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (mErr) {
    return apiError(mErr.message, 500);
  }

  // For each mapping, fetch progressions
  const result = await Promise.all(
    (mappings ?? []).map(async (m) => {
      const { data: progs } = await supabase
        .from("ls_scheme_progressions")
        .select("*")
        .eq("scheme_name", m.scheme_name)
        .eq("subject", m.subject)
        .order("unit_order", { ascending: true });

      return { ...m, progressions: progs ?? [] };
    }),
  );

  return apiSuccess({ data: result });
});

// ---------------------------------------------------------------------------
// POST — Save or parse a scheme
// ---------------------------------------------------------------------------

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const organizationId = auth.organizationId;

  const contentType = req.headers.get("content-type") ?? "";
  const parseOnly = req.headers.get("x-parse-only") === "true";

  // Handle FormData (PDF upload)
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    const classId = formData.get("classId") as string;

    if (!file || !(file instanceof File)) {
      return apiError("PDF file is required", 400);
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use the existing PDF scheme connector
    try {
      const { parsePdfScheme } = await import("@/lib/lesson-studio/pdf-scheme-connector");
      const parsed = await parsePdfScheme(buffer, file.name);

      // Convert to progressions format
      const progressions = [{
        term: "Autumn",
        unitName: parsed.title,
        unitOrder: 1,
        steps: parsed.objectives.map((obj, i) => ({
          step: i + 1,
          title: obj,
          nc_codes: [] as string[],
        })),
        ncCodes: [] as string[],
      }];

      return apiSuccess({
        data: {
          schemeName: parsed.title,
          subject: parsed.subject,
          progressions,
          raw: parseOnly ? undefined : parsed,
        },
      });
    } catch (err: unknown) {
      return apiError(
        err instanceof Error ? err.message : "Failed to parse PDF",
        400,
      );
    }
  }

  // Handle JSON body
  const body = await req.json();
  const action = body.action ?? "save";
  const orgId = organizationId ?? body.organizationId;

  if (!orgId) {
    return apiError("organizationId is required", 400);
  }

  // Parse text objectives
  if (action === "parse-text") {
    const { text, subject, yearGroup } = body;
    if (!text) {
      return apiError("text is required", 400);
    }

    // Heuristic: split by newlines, detect week/unit structure
    const lines = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 3);

    const progressions: Array<{
      term: string;
      unitName: string;
      unitOrder: number;
      steps: Array<{ step: number; title: string; nc_codes: string[] }>;
      ncCodes: string[];
    }> = [];

    let currentUnit = subject ? `${subject} Plan` : "Learning Plan";
    let currentSteps: Array<{ step: number; title: string; nc_codes: string[] }> = [];
    let unitOrder = 1;

    for (const line of lines) {
      // Detect unit/topic headings
      const unitMatch = line.match(
        /^(?:unit|topic|theme|block|module)\s*\d*\s*[:\-–]\s*(.+)/i,
      );
      const weekMatch = line.match(
        /^(?:week|lesson|session|step)\s*(\d+)\s*[:\-–]\s*(.+)/i,
      );

      if (unitMatch) {
        if (currentSteps.length > 0) {
          progressions.push({
            term: `Term ${progressions.length + 1}`,
            unitName: currentUnit,
            unitOrder,
            steps: currentSteps,
            ncCodes: extractNCCodes(currentSteps.map((s) => s.title).join(" ")),
          });
          unitOrder++;
        }
        currentUnit = unitMatch[1].trim();
        currentSteps = [];
      } else if (weekMatch) {
        currentSteps.push({
          step: parseInt(weekMatch[1], 10),
          title: weekMatch[2].trim(),
          nc_codes: extractNCCodes(weekMatch[2]),
        });
      } else {
        currentSteps.push({
          step: currentSteps.length + 1,
          title: line,
          nc_codes: extractNCCodes(line),
        });
      }
    }

    // Flush remaining
    if (currentSteps.length > 0) {
      progressions.push({
        term: `Term ${progressions.length + 1}`,
        unitName: currentUnit,
        unitOrder,
        steps: currentSteps,
        ncCodes: extractNCCodes(currentSteps.map((s) => s.title).join(" ")),
      });
    }

    return apiSuccess({
      data: {
        schemeName: `${subject} - ${yearGroup ?? "Plan"}`,
        subject,
        progressions,
      },
    });
  }

  // Save scheme
  if (action === "save") {
    const { classId, subject, schemeName, schemeConfig, progressions } = body;

    if (!classId || !subject || !schemeName) {
      return apiError("classId, subject, and schemeName are required", 400);
    }

    // Upsert scheme mapping
    const { data: mapping, error: mapErr } = await supabase
      .from("ls_scheme_mappings")
      .upsert(
        {
          organization_id: orgId,
          class_id: classId,
          subject,
          scheme_name: schemeName,
          scheme_config: schemeConfig ?? {},
        },
        { onConflict: "organization_id,class_id,subject" },
      )
      .select()
      .single();

    if (mapErr) {
      // If upsert fails, try insert
      const { data: insertData, error: insertErr } = await supabase
        .from("ls_scheme_mappings")
        .insert({
          organization_id: orgId,
          class_id: classId,
          subject,
          scheme_name: schemeName,
          scheme_config: schemeConfig ?? {},
        })
        .select()
        .single();

      if (insertErr) {
        return apiError(insertErr.message, 500);
      }
    }

    // Insert progressions
    if (progressions && Array.isArray(progressions)) {
      const rows = progressions.map(
        (p: {
          term: string;
          unitName: string;
          unitOrder: number;
          steps: Array<{ step: number; title: string; nc_codes: string[] }>;
          ncCodes: string[];
        }) => ({
          scheme_name: schemeName,
          subject,
          year_group: body.yearGroup ?? "",
          term: p.term,
          unit_name: p.unitName,
          unit_order: p.unitOrder,
          steps: p.steps,
          nc_objective_codes: p.ncCodes ?? [],
          methodology_notes: null,
        }),
      );

      // Delete old progressions for this scheme+subject
      await supabase
        .from("ls_scheme_progressions")
        .delete()
        .eq("scheme_name", schemeName)
        .eq("subject", subject);

      const { error: progErr } = await supabase
        .from("ls_scheme_progressions")
        .insert(rows);

      if (progErr) {
        console.error("[schemes/save] progression insert error:", progErr);
      }
    }

    return apiSuccess({ data: mapping ?? { scheme_name: schemeName } });
  }

  return apiError("Unknown action", 400);
});

// ---------------------------------------------------------------------------
// DELETE — Disconnect a scheme
// ---------------------------------------------------------------------------

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;
  const id = url.searchParams.get("id");
  const organizationId = auth.organizationId ?? url.searchParams.get("organizationId");

  if (!id) return apiError("id is required", 400);

  const { error } = await supabase
    .from("ls_scheme_mappings")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return apiError(error.message, 500);

  return apiSuccess({ success: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractNCCodes(text: string): string[] {
  // Match patterns like Y6-SC-4, KS2-MA-3, NC-RE-1
  const matches = text.match(/\b[A-Z]{1,3}\d?[-_][A-Z]{1,3}[-_]\d+[a-z]?\b/g);
  return matches ?? [];
}

function generateMockOakUnits(subject: string, keyStage: string) {
  const units: Record<string, string[]> = {
    Mathematics: [
      "Place Value", "Addition and Subtraction", "Multiplication and Division",
      "Fractions", "Decimals and Percentages", "Measurement", "Geometry",
      "Statistics", "Algebra", "Ratio and Proportion",
    ],
    Science: [
      "Living Things", "Animals Including Humans", "Materials",
      "Forces and Magnets", "Light", "Sound", "Electricity",
      "Earth and Space", "Evolution and Inheritance",
    ],
    English: [
      "Narrative Writing", "Poetry", "Non-Fiction", "Persuasive Writing",
      "Grammar and Punctuation", "Reading Comprehension", "Spelling",
    ],
  };

  const subjectUnits = units[subject] ?? units.Mathematics;
  return subjectUnits.map((title, i) => ({
    id: `oak-${subject.toLowerCase()}-${keyStage.toLowerCase()}-${i}`,
    title: `${title}`,
    snippet: `${keyStage} ${subject} - ${title}`,
  }));
}
