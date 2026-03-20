/**
 * Test DB endpoint — DISABLED for security.
 * This route previously exposed database schema details without authentication.
 * Removed as part of pilot hardening (2026-03-18).
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been disabled for security reasons." },
    { status: 403 },
  );
}
