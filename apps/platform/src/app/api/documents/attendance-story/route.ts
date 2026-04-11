import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { generateAttendanceStory } from '@/lib/documents/attendance-story';

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { urn } = body as { urn: number };

  if (!urn || typeof urn !== 'number') {
    return apiError('Missing or invalid urn in request body', 400);
  }

  try {
    const result = await generateAttendanceStory({
      urn,
      organizationId: auth.organizationId,
      userId: auth.userId,
    });
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate attendance story';
    return apiError(message, 500);
  }
});
