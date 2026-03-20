/**
 * Debug SQL endpoint — DISABLED for security.
 * This route previously allowed arbitrary SQL execution without authentication.
 * Removed as part of pilot hardening (2026-03-18).
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been disabled for security reasons." },
    { status: 403 },
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been disabled for security reasons." },
    { status: 403 },
  );
}
