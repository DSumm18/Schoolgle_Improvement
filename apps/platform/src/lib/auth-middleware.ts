import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "./supabase-server";

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
 * Resolve the authenticated Supabase user from the request.
 * Tries cookie-based session first (SSR), then falls back to
 * Authorization: Bearer <token> header (client-side fetch with localStorage sessions).
 */
async function resolveUser(request: NextRequest) {
  // 1. Try cookie-based session (works when @supabase/ssr sets cookies)
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log('[AuthMiddleware] Cookie auth attempt:', {
      hasUser: !!user,
      userId: user?.id,
      error: error?.message
    });

    if (!error && user) return { user, supabase };
  } catch {
    // Cookie-based auth failed, try Bearer token
  }

  // 2. Fall back to Authorization header (client stores session in localStorage)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (!error && user) return { user, supabase };
  }

  return null;
}

/**
 * Authentication middleware for API routes.
 *
 * Validates the Supabase session from cookies or Authorization header
 * and resolves the user's organization membership. Returns 401 if not
 * authenticated, 403 if the user lacks the required role.
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
    const resolved = await resolveUser(request);

    if (!resolved) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const { user } = resolved;

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

    // Verify organization membership (use service role to bypass RLS)
    let role: AuthContext["role"] = "viewer";
    const adminClient = createServiceRoleClient();

    if (organizationId) {
      // Check if user is a super admin first (super admins can access any org)
      console.log('[AuthMiddleware] Checking super admin for user_id:', user.id);

      const { data: superAdminCheck, error: superAdminError } = await adminClient
        .from("super_admins")
        .select("access_level")
        .eq("user_id", user.id)
        .maybeSingle();

      const isSuperAdmin = !!superAdminCheck;

      console.log('[AuthMiddleware] Super admin check result:', {
        userId: user.id,
        isSuperAdmin,
        superAdminCheck,
        superAdminError
      });

      // If not a super admin, check organization membership
      if (!isSuperAdmin) {
        const { data: membership, error: memberError } = await adminClient
          .from("organization_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("organization_id", organizationId)
          .single();

        if (memberError || !membership) {
          console.error('[AuthMiddleware] Org membership check failed:', {
            userId: user.id,
            organizationId,
            memberError,
            membership
          });
          return NextResponse.json(
            { error: "Not a member of this organization", code: "FORBIDDEN" },
            { status: 403 },
          );
        }

        role = membership.role as AuthContext["role"];
      } else {
        // Super admins get admin privileges
        role = "admin";
      }
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
