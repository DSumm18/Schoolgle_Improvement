import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export type ObjectiveStatus =
  | "not_started"
  | "introduced"
  | "taught"
  | "assessed"
  | "evidenced";

export interface CurriculumObjectiveRow {
  id: string;
  objective_code: string;
  objective_text: string;
  strand: string | null;
  sub_strand: string | null;
  display_order: number;
  status: ObjectiveStatus;
  first_taught_date: string | null;
  times_taught: number;
  times_assessed: number;
  coverage_depth: string | null;
}

export interface StrandGroup {
  strand: string;
  objectives: CurriculumObjectiveRow[];
  taught_count: number;
  evidenced_count: number;
  total: number;
}

export interface SubjectGroup {
  subject: string;
  strands: StrandGroup[];
  taught_count: number;
  evidenced_count: number;
  total: number;
}

function deriveStatus(
  coverage: { times_taught: number; times_assessed: number } | null,
  lessonDepth: string | null
): ObjectiveStatus {
  if (coverage && coverage.times_assessed > 0) {
    // If assessed and has been taught more than once with assessment, consider evidenced
    if (coverage.times_taught >= 2 && coverage.times_assessed >= 1) {
      return "evidenced";
    }
    return "assessed";
  }
  if (coverage && coverage.times_taught > 0) {
    return "taught";
  }
  if (lessonDepth) {
    return "introduced";
  }
  return "not_started";
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const url = req.nextUrl;
  const classId = url.searchParams.get("classId");
  const subjectFilter = url.searchParams.get("subject");
  const yearGroupFilter = url.searchParams.get("yearGroup");

  if (!classId) return apiError("classId is required", 400);

  // Determine year group: use param or look up from class
  let yearGroup = yearGroupFilter;
  if (!yearGroup) {
    const { data: cls } = await supabase
      .from("ls_classes")
      .select("year_group")
      .eq("id", classId)
      .single();
    yearGroup = cls?.year_group ?? null;
  }

  if (!yearGroup) return apiError("Could not determine year group", 400);

  // Get NC2014 framework
  const { data: framework } = await supabase
    .from("ls_curriculum_frameworks")
    .select("id")
    .eq("code", "NC2014")
    .single();

  if (!framework) return apiError("NC2014 framework not found", 404);

  // Load objectives for the year group
  let objectivesQuery = supabase
    .from("ls_curriculum_objectives")
    .select("*")
    .eq("framework_id", framework.id)
    .eq("year_group", yearGroup)
    .order("subject")
    .order("display_order");

  if (subjectFilter) {
    objectivesQuery = objectivesQuery.eq("subject", subjectFilter);
  }

  const { data: objectives, error: objErr } = await objectivesQuery;
  if (objErr) return apiError(objErr.message, 500);
  if (!objectives || objectives.length === 0) {
    return apiSuccess({ subjects: [], yearGroup, totalObjectives: 0 });
  }

  // Load coverage data for this class
  const { data: coverage } = await supabase
    .from("ls_curriculum_coverage")
    .select("nc_objective_code, first_taught_date, times_taught, times_assessed")
    .eq("class_id", classId);

  const coverageMap = new Map<string, {
    first_taught_date: string | null;
    times_taught: number;
    times_assessed: number;
  }>();
  for (const c of coverage ?? []) {
    coverageMap.set(c.nc_objective_code, c);
  }

  // Load lesson objective links: find max coverage_depth per objective for this class
  // Join through lesson plans to get class_id filter
  const { data: lessonObjectives } = await supabase
    .from("ls_lesson_objectives")
    .select("objective_id, coverage_depth, lesson_plan_id")
    .in(
      "lesson_plan_id",
      // Sub-select: all lesson plan IDs for this class
      (
        await supabase
          .from("ls_lesson_plans")
          .select("id")
          .eq("class_id", classId)
      ).data?.map((p) => p.id) ?? []
    );

  // Map objective_id -> best coverage_depth
  const depthOrder = ["introduced", "practised", "applied", "assessed"];
  const lessonDepthMap = new Map<string, string>();
  for (const lo of lessonObjectives ?? []) {
    const existing = lessonDepthMap.get(lo.objective_id);
    const existingIdx = existing ? depthOrder.indexOf(existing) : -1;
    const newIdx = depthOrder.indexOf(lo.coverage_depth ?? "introduced");
    if (newIdx > existingIdx) {
      lessonDepthMap.set(lo.objective_id, lo.coverage_depth ?? "introduced");
    }
  }

  // Build grouped response
  const subjectMap = new Map<string, SubjectGroup>();

  for (const obj of objectives) {
    const cov = coverageMap.get(obj.objective_code) ?? null;
    const depth = lessonDepthMap.get(obj.id) ?? null;
    const status = deriveStatus(cov, depth);

    const row: CurriculumObjectiveRow = {
      id: obj.id,
      objective_code: obj.objective_code,
      objective_text: obj.objective_text,
      strand: obj.strand,
      sub_strand: obj.sub_strand,
      display_order: obj.display_order,
      status,
      first_taught_date: cov?.first_taught_date ?? null,
      times_taught: cov?.times_taught ?? 0,
      times_assessed: cov?.times_assessed ?? 0,
      coverage_depth: depth,
    };

    // Group by subject
    if (!subjectMap.has(obj.subject)) {
      subjectMap.set(obj.subject, {
        subject: obj.subject,
        strands: [],
        taught_count: 0,
        evidenced_count: 0,
        total: 0,
      });
    }
    const sg = subjectMap.get(obj.subject)!;
    sg.total++;
    if (status === "taught" || status === "assessed" || status === "evidenced") sg.taught_count++;
    if (status === "evidenced") sg.evidenced_count++;

    // Group by strand within subject
    const strandName = obj.strand ?? "General";
    let strand = sg.strands.find((s) => s.strand === strandName);
    if (!strand) {
      strand = { strand: strandName, objectives: [], taught_count: 0, evidenced_count: 0, total: 0 };
      sg.strands.push(strand);
    }
    strand.objectives.push(row);
    strand.total++;
    if (status === "taught" || status === "assessed" || status === "evidenced") strand.taught_count++;
    if (status === "evidenced") strand.evidenced_count++;
  }

  const subjects = Array.from(subjectMap.values());

  return apiSuccess({
    subjects,
    yearGroup,
    totalObjectives: objectives.length,
  });
});
