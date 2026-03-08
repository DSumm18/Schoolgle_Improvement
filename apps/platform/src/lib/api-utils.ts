import { NextRequest, NextResponse } from "next/server";
import { AuthContext, withAuth } from "./auth-middleware";
import {
  checkRateLimit,
  getRateLimitKey,
  RATE_LIMITS,
  type RateLimitConfig,
} from "./rate-limit";

// ─── Response Helpers ────────────────────────────────────────────────

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

export function apiError(
  message: string,
  status: number = 500,
  code?: string,
  details?: any,
) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

// ─── Error Handling ──────────────────────────────────────────────────

export async function withErrorHandling(
  fn: () => Promise<NextResponse>,
  context: string = "API Request",
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error: any) {
    console.error(`[${context}] Error:`, {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    // Handle Supabase specific errors
    if (error.code === "PGRST116") {
      return apiError("Resource not found", 404, "NOT_FOUND");
    }

    if (error.code === "PGRST301" || error.code === "42501") {
      return apiError("Access denied by database policy", 403, "RLS_DENIED");
    }

    if (error.code === "23505") {
      return apiError("Resource already exists", 409, "DUPLICATE");
    }

    if (error.code === "23503") {
      return apiError(
        "Referenced resource not found",
        400,
        "FOREIGN_KEY_VIOLATION",
      );
    }

    if (error.status === 401 || error.message?.includes("JWT")) {
      return apiError("Unauthorized session", 401, "UNAUTHORIZED");
    }

    return apiError(
      process.env.NODE_ENV === "development"
        ? error.message
        : "An internal server error occurred",
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }
}

// ─── Composable Route Handler ────────────────────────────────────────

interface ProtectedRouteOptions {
  /** Minimum role required */
  requiredRole?: AuthContext["role"];
  /** Rate limit config (defaults to RATE_LIMITS.standard) */
  rateLimit?: RateLimitConfig | false;
  /** Rate limit key prefix */
  rateLimitPrefix?: string;
}

/**
 * Composable protected route handler that combines auth + rate limiting + error handling.
 *
 * Usage:
 * ```ts
 * export const GET = protectedRoute(async (auth, request) => {
 *   const data = await fetchData(auth.organizationId);
 *   return apiSuccess(data);
 * }, { requiredRole: 'teacher' });
 * ```
 */
export function protectedRoute(
  handler: (auth: AuthContext, request: NextRequest) => Promise<NextResponse>,
  options: ProtectedRouteOptions = {},
) {
  return async (request: NextRequest) => {
    return withErrorHandling(async () => {
      return withAuth(
        request,
        async (auth, req) => {
          // Apply rate limiting
          if (options.rateLimit !== false) {
            const config = options.rateLimit || RATE_LIMITS.standard;
            const prefix = options.rateLimitPrefix || "api";
            const limited = checkRateLimit(
              getRateLimitKey(req, prefix, auth.userId),
              config,
            );
            if (limited) return limited;
          }

          return handler(auth, req);
        },
        { requiredRole: options.requiredRole },
      );
    }, `Protected Route: ${request.nextUrl.pathname}`);
  };
}

/**
 * Rate-limited AI route handler with stricter limits.
 *
 * Usage:
 * ```ts
 * export const POST = aiRoute(async (auth, request) => {
 *   const result = await callAI(...);
 *   return apiSuccess(result);
 * });
 * ```
 */
export function aiRoute(
  handler: (auth: AuthContext, request: NextRequest) => Promise<NextResponse>,
  options: Omit<ProtectedRouteOptions, "rateLimit" | "rateLimitPrefix"> = {},
) {
  return protectedRoute(handler, {
    ...options,
    rateLimit: RATE_LIMITS.ai,
    rateLimitPrefix: "ai",
  });
}
