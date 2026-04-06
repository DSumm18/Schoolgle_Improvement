// PRODUCTION GUARD: Block in non-dev environments
const __isDev = process.env.NODE_ENV === "development";

/**
 * Seed data endpoint — DISABLED for security.
 * This route previously allowed unauthenticated data population.
 * Removed as part of pilot hardening (2026-03-18).
 *
 * For development seeding, use the Supabase SQL editor directly
 * or run migration files from apps/platform/supabase/migrations/.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been disabled. Use Supabase SQL editor for data seeding.",
    },
    { status: 403 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been disabled. Use Supabase SQL editor for data seeding.",
    },
    { status: 403 },
  );
}
