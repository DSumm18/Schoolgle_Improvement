import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Preset rate limit configurations */
export const RATE_LIMITS = {
  /** AI/LLM endpoints - expensive, limit heavily */
  ai: { maxRequests: 20, windowSeconds: 60 } as RateLimitConfig,
  /** Standard API endpoints */
  standard: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
  /** Auth endpoints - prevent brute force */
  auth: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  /** Public/unauthenticated endpoints */
  public: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
};

/**
 * Simple in-memory rate limiter.
 *
 * Returns null if the request is within limits, or a 429 NextResponse if exceeded.
 *
 * Key is typically `userId` or IP address for unauthenticated routes.
 *
 * Usage:
 * ```ts
 * const limited = checkRateLimit(`ai:${auth.userId}`, RATE_LIMITS.ai);
 * if (limited) return limited;
 * ```
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): NextResponse | null {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return null;
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}

/**
 * Get a rate limit key from a request, using IP as fallback for unauthenticated routes.
 */
export function getRateLimitKey(
  request: Request,
  prefix: string,
  userId?: string,
): string {
  if (userId) {
    return `${prefix}:${userId}`;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:ip:${ip}`;
}
