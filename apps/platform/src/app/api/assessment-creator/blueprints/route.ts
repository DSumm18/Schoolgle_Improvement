import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { buildAssessmentBlueprint } from "@/lib/assessment-creator/blueprint";
import type { AssessmentMode } from "@/lib/assessment-creator/types";

const MODES: AssessmentMode[] = ["quick_check", "unit_check", "retention_check", "statutory_readiness"];
const SUBJECTS = ["reading", "writing", "maths", "science", "spag"];
const YEAR_GROUPS = ["EYFS", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];
const TERMS = ["Autumn 1", "Autumn 2", "Spring 1", "Spring 2", "Summer 1", "Summer 2"];

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const organizationId = body.organizationId || auth.organizationId;

  if (!organizationId) return apiError("organizationId required", 400);
  if (!body.schoolId || !body.classId) return apiError("schoolId and classId required", 400);
  if (!SUBJECTS.includes(body.subject)) return apiError("subject is invalid", 400);
  if (!YEAR_GROUPS.includes(body.yearGroup)) return apiError("yearGroup is invalid", 400);
  if (!TERMS.includes(body.term)) return apiError("term is invalid", 400);
  if (!MODES.includes(body.mode)) return apiError("mode is invalid", 400);

  const blueprint = buildAssessmentBlueprint({
    organizationId,
    schoolId: body.schoolId,
    classId: body.classId,
    subject: body.subject,
    yearGroup: body.yearGroup,
    term: body.term,
    mode: body.mode,
    curriculumScheme: body.curriculumScheme,
    taughtObjectives: body.taughtObjectives ?? [],
    blend: body.blend,
  });

  return apiSuccess(blueprint);
}, { orgOptional: true });
