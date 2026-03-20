/**
 * Database setup endpoint — DISABLED for security.
 * This route previously exposed migration instructions without authentication.
 * Removed as part of pilot hardening (2026-03-18).
 *
 * For database setup, use:
 *   cd apps/platform && npx supabase db push
 * Or run migrations manually via Supabase SQL editor.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been disabled. Use Supabase CLI for database setup.",
    },
    { status: 403 },
  );
}
