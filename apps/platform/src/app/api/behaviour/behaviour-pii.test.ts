/**
 * Behaviour Routes PII Tests
 *
 * Verifies that behaviour routes NEVER store pupil_name or ethnicity in Supabase.
 * All pupil identification must use pupil_hash (SHA-256 pseudonymised).
 * Names resolve LIVE from Google Drive at display time only.
 *
 * Run with: npx vitest run apps/platform/src/app/api/behaviour/behaviour-pii.test.ts
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Read route source files for static analysis ───────────────────

const ROUTES_DIR = path.resolve(__dirname);

function readRoute(relativePath: string): string {
  return fs.readFileSync(path.join(ROUTES_DIR, relativePath), "utf-8");
}

// ─── Tests: incidents/route.ts ─────────────────────────────────────

describe("behaviour/incidents/route.ts — PII safety", () => {
  const src = readRoute("incidents/route.ts");

  it("must NOT insert pupil_name into Supabase", () => {
    // The .insert() call should not contain pupil_name
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).not.toContain("pupil_name");
  });

  it("must insert pupil_hash into Supabase", () => {
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).toContain("pupil_hash");
  });

  it("must require pupil_hash (not pupil_name) in POST validation", () => {
    // Validation should check for pupil_hash, not pupil_name
    expect(src).toContain("pupil_hash");
    expect(src).not.toMatch(/if\s*\(\s*!pupil_name/);
  });

  it("must use createHmac for hashing", () => {
    expect(src).toContain("createHmac");
    expect(src).toContain("sha256");
  });

  it("demo data must use pupil_hash not pupil_name", () => {
    // Demo incident objects should not have pupil_name field
    const demoFn = src.match(
      /function generateDemoIncidents[\s\S]*?^}/m,
    );
    if (demoFn) {
      expect(demoFn[0]).not.toMatch(/pupil_name\s*:/);
      expect(demoFn[0]).toContain("pupil_hash");
    }
  });
});

// ─── Tests: incidents/[id]/route.ts ────────────────────────────────

describe("behaviour/incidents/[id]/route.ts — PII safety", () => {
  const src = readRoute("incidents/[id]/route.ts");

  it("must NOT allow pupil_name in PUT allowedFields", () => {
    const allowedMatch = src.match(
      /allowedFields\s*=\s*\[([\s\S]*?)\]/,
    );
    expect(allowedMatch).toBeTruthy();
    const fields = allowedMatch![1];
    expect(fields).not.toContain("pupil_name");
  });

  it("must NOT reference pupil_name anywhere in updates", () => {
    // The update logic should never touch pupil_name
    expect(src).not.toContain('"pupil_name"');
  });
});

// ─── Tests: exclusions/route.ts ────────────────────────────────────

describe("behaviour/exclusions/route.ts — PII safety", () => {
  const src = readRoute("exclusions/route.ts");

  it("must NOT insert pupil_name into Supabase", () => {
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).not.toContain("pupil_name");
  });

  it("must insert pupil_hash into Supabase", () => {
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).toContain("pupil_hash");
  });

  it("must NOT insert ethnicity into Supabase", () => {
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).not.toContain("ethnicity");
  });

  it("must NOT destructure ethnicity from request body", () => {
    // The POST handler should not extract ethnicity from the request body
    // Find all destructures from body and check none contain ethnicity
    const destructureMatches = src.matchAll(
      /const\s*\{([^}]*)\}\s*=\s*body/g,
    );
    for (const match of destructureMatches) {
      expect(match[1]).not.toContain("ethnicity");
    }
  });

  it("must require pupil_hash (not pupil_name) in POST validation", () => {
    expect(src).toContain("pupil_hash");
    expect(src).not.toMatch(/if\s*\(\s*!pupil_name/);
  });

  it("must use createHmac for hashing", () => {
    expect(src).toContain("createHmac");
    expect(src).toContain("sha256");
  });

  it("demo data must use pupil_hash not pupil_name", () => {
    const demoFn = src.match(
      /function generateDemoExclusions[\s\S]*?^}/m,
    );
    if (demoFn) {
      expect(demoFn[0]).not.toMatch(/pupil_name\s*:/);
      expect(demoFn[0]).toContain("pupil_hash");
    }
  });

  it("demo data must not contain ethnicity field", () => {
    const demoFn = src.match(
      /function generateDemoExclusions[\s\S]*?^}/m,
    );
    if (demoFn) {
      expect(demoFn[0]).not.toMatch(/ethnicity\s*:/);
    }
  });
});
