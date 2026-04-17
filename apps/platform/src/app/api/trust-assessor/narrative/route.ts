import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { executeSkill } from '@/lib/intelligence-brain/skills';

/**
 * POST /api/trust-assessor/narrative
 * Generates AI narrative using the Intelligence Brain's skill system.
 *
 * Body: {
 *   type: 'trust-overview' | 'school' | 'ofsted-review' | 'data-quality',
 *   schoolAbbrev?: string,
 *   data: { ... computed metrics ... }
 * }
 */
export const POST = protectedRoute(async (_auth, req: NextRequest) => {
  const body = await req.json();
  const { type, schoolAbbrev, data } = body;

  if (!type || !data) {
    return apiError('type and data are required', 400);
  }

  // Map request type to brain skill
  const skillMap: Record<string, string> = {
    'trust-overview': 'trust-overview-analyst',
    'school': 'school-assessment-analyst',
    'ofsted-review': 'ofsted-readiness-reviewer',
    'data-quality': 'data-quality-auditor',
  };

  const skillId = skillMap[type];
  if (!skillId) {
    return apiError(`Unknown narrative type: ${type}. Available: ${Object.keys(skillMap).join(', ')}`, 400);
  }

  try {
    const result = await executeSkill(skillId, {
      ...data,
      ...(schoolAbbrev ? { schoolAbbrev } : {}),
    });

    return apiSuccess({
      narrative: result.output,
      generatedAt: result.generatedAt,
      model: result.model,
      skillId: result.skillId,
      type,
      schoolAbbrev,
      tokenUsage: result.tokenUsage,
    });
  } catch (err) {
    console.error('[trust-assessor/narrative] Skill execution error:', err);
    return apiError(
      `Failed to generate narrative: ${err instanceof Error ? err.message : 'Unknown error'}`,
      500,
    );
  }
}, { orgOptional: true });
