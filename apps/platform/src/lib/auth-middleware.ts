import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabase-server";

/**
 * Authenticated user context returned by withAuth
 */
export interface AuthContext {
  userId: string;
  email: string;
  organizationId: string;
  role:
    | "admin"
    | "headteacher"
    | "slt"
    | "teacher"
    | "governor"
    | "caretaker"
    | "viewer";
}

/**
 * Options for the withAuth middleware
 */
interface WithAuthOptions {
  /** Minimum role required (checked in order of privilege) */
  requiredRole?: AuthContext["role"];
  /** If true, organizationId is optional (for user-level routes like profile) */
  orgOptional?: boolean;
}

/** Role hierarchy - higher index = more privilege */
const ROLE_HIERARCHY: AuthContext["role"][] = [
  "viewer",
  "caretaker",
  "teacher",
  "governor",
  "slt",
  "headteacher",
  "admin",
];

function hasMinimumRole(
  userRole: AuthContext["role"],
  requiredRole: AuthContext["role"],
): boolean {
  return (
    ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole)
  );
}

/**
 * Authentication middleware for API routes.
 *
 * Validates the Supabase session from cookies and resolves the user's
 * organization membership. Returns 401 if not authenticated, 403 if
 * the user lacks the required role.
 *
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (auth) => {
 *     // auth.userId, auth.organizationId, auth.role available
 *     return NextResponse.json({ data: 'ok' });
 *   });
 * }
 * ```
 */
export async function withAuth(
  request: NextRequest,
  handler: (auth: AuthContext, request: NextRequest) => Promise<NextResponse>,
  options: WithAuthOptions = {},
): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // Get organizationId from request (query param or body)
    let organizationId: string | null = null;

    // Check query params first
    const { searchParams } = new URL(request.url);
    organizationId = searchParams.get("organizationId");

    // For POST/PUT/PATCH, also check the body (without consuming it)
    if (!organizationId && ["POST", "PUT", "PATCH"].includes(request.method)) {
      try {
        const cloned = request.clone();
        const body = await cloned.json();
        organizationId = body.organizationId || null;
      } catch {
        // Body might not be JSON, that's fine
      }
    }

    if (!organizationId && !options.orgOptional) {
      return NextResponse.json(
        { error: "organizationId is required", code: "MISSING_ORG" },
        { status: 400 },
      );
    }

    // Verify organization membership
    let role: AuthContext["role"] = "viewer";

    if (organizationId) {
      const { data: membership, error: memberError } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .single();

      if (memberError || !membership) {
        return NextResponse.json(
          { error: "Not a member of this organization", code: "FORBIDDEN" },
          { status: 403 },
        );
      }

      role = membership.role as AuthContext["role"];
    }

    // Check role requirement
    if (options.requiredRole && !hasMinimumRole(role, options.requiredRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "INSUFFICIENT_ROLE" },
        { status: 403 },
      );
    }

    const auth: AuthContext = {
      userId: user.id,
      email: user.email || "",
      organizationId: organizationId || "",
      role,
    };

    return await handler(auth, request);
  } catch (error: any) {
    console.error("[withAuth] Error:", error.message);
    return NextResponse.json(
      { error: "Authentication error", code: "AUTH_ERROR" },
      { status: 500 },
    );
  }
}
