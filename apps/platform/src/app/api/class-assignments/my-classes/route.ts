import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { getClassContext } from "@/lib/class-context";

// GET: Returns the current user's class context (what they can see)
export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  const ctx = await getClassContext(
    auth.userId,
    auth.organizationId!,
    auth.role,
  );
  return apiSuccess(ctx);
});
