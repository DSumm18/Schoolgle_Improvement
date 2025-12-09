/**
 * Rate Limiting Middleware
 * Security & Validation Specialist - Agent 6
 *
 * Implements in-memory rate limiting for API endpoints to prevent abuse.
 * For production, consider using Redis or a distributed rate limiting solution.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean; // Only count failed requests
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const requestStore = new Map<string, RequestRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (record.resetTime < now) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or user ID if available
 */
function getClientIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP from various headers (considering proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limiting middleware
 *
 * @example
 * const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 });
 * const limitResult = await limiter.check(req, userId);
 * if (!limitResult.allowed) {
 *   return limitResult.response;
 * }
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false
  } = config;

  return {
    /**
     * Check if request should be allowed
     */
    check: async (
      req: NextRequest,
      userId?: string
    ): Promise<{ allowed: boolean; response?: NextResponse; remaining?: number }> => {
      const identifier = getClientIdentifier(req, userId);
      const key = `${req.nextUrl.pathname}:${identifier}`;
      const now = Date.now();

      let record = requestStore.get(key);

      // Initialize or reset if window expired
      if (!record || record.resetTime < now) {
        record = {
          count: 0,
          resetTime: now + windowMs
        };
      }

      // Increment count
      record.count++;
      requestStore.set(key, record);

      // Check if limit exceeded
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);

        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: message,
              retryAfter: `${retryAfter} seconds`,
              limit: maxRequests,
              window: `${windowMs / 1000} seconds`
            },
            {
              status: 429,
              headers: {
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
              }
            }
          )
        };
      }

      return {
        allowed: true,
        remaining: maxRequests - record.count
      };
    },

    /**
     * Reset rate limit for a specific identifier
     */
    reset: (req: NextRequest, userId?: string) => {
      const identifier = getClientIdentifier(req, userId);
      const key = `${req.nextUrl.pathname}:${identifier}`;
      requestStore.delete(key);
    }
  };
}

// ============================================================================
// Predefined Rate Limiters
// ============================================================================

/**
 * Standard rate limiter: 100 requests per minute
 */
export const standardLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests. Please wait before trying again.'
});

/**
 * Strict rate limiter for expensive operations: 10 requests per minute
 */
export const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Rate limit exceeded for this operation. Please wait before trying again.'
});

/**
 * AI/LLM rate limiter: 20 requests per minute
 * For endpoints that call external AI APIs
 */
export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: 'Too many AI requests. Please wait before trying again.'
});

/**
 * File upload limiter: 5 uploads per minute
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Too many file uploads. Please wait before uploading again.'
});

/**
 * Evidence scanning limiter: 3 scans per 5 minutes
 * Very expensive operation with cloud API calls and AI processing
 */
export const scanLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3,
  message: 'Too many scan requests. This is a resource-intensive operation. Please wait 5 minutes before scanning again.'
});

/**
 * GDPR deletion limiter: 1 request per hour
 * Critical operation that should be heavily rate limited
 */
export const gdprLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1,
  message: 'GDPR deletion can only be requested once per hour. Please contact support if you need assistance.'
});

/**
 * Search limiter: 30 requests per minute
 */
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: 'Too many search requests. Please wait before searching again.'
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
  return response;
}

/**
 * Create a rate-limited endpoint wrapper
 *
 * @example
 * export const POST = withRateLimit(
 *   strictLimiter,
 *   async (req) => {
 *     // Your handler logic
 *   }
 * );
 */
export function withRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  handler: (req: NextRequest) => Promise<NextResponse>,
  getUserId?: (req: NextRequest) => Promise<string | undefined>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Get user ID if provided
    const userId = getUserId ? await getUserId(req) : undefined;

    // Check rate limit
    const limitResult = await limiter.check(req, userId);

    if (!limitResult.allowed) {
      return limitResult.response!;
    }

    // Execute handler
    return handler(req);
  };
}
