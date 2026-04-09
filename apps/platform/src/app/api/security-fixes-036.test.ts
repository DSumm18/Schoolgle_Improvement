/**
 * TASK 036: VECTOR Security Findings Tests
 *
 * Verifies all 7 security fixes are correctly implemented:
 * 1. /api/ed/hub uses protectedRoute (auth required)
 * 2. /api/scan uses auth, orgId from session not body
 * 3. pupils table has no PII columns (first_name, last_name)
 * 4. safeguarding_concerns uses pupil_pseudonym_label not pupil_display_name
 * 5. national_insurance_number column removed
 * 6. /api/intelligence uses orgId from session not caller
 * 7. Ofsted readiness score has no +30 inflation
 *
 * Run with: npx vitest run apps/platform/src/app/api/security-fixes-036.test.ts
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_ROOT = path.resolve(__dirname, "..");

function readSource(relativePath: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, relativePath),
    "utf-8",
  );
}

function readAppSource(relativePath: string): string {
  return fs.readFileSync(
    path.resolve(APP_ROOT, relativePath),
    "utf-8",
  );
}

// ─── Fix #1: /api/ed/hub must use protectedRoute ──────────────────

describe("Fix #1: /api/ed/hub — auth required", () => {
  const src = readSource("ed/hub/route.ts");

  it("imports protectedRoute from api-utils", () => {
    expect(src).toContain("protectedRoute");
    expect(src).toContain("@/lib/api-utils");
  });

  it("GET handler uses protectedRoute wrapper", () => {
    expect(src).toMatch(/export\s+const\s+GET\s*=\s*protectedRoute/);
  });

  it("POST handler uses protectedRoute wrapper", () => {
    expect(src).toMatch(/export\s+const\s+POST\s*=\s*protectedRoute/);
  });

  it("does NOT use raw export async function GET pattern", () => {
    expect(src).not.toMatch(/export\s+async\s+function\s+GET/);
  });

  it("does NOT use raw export async function POST pattern", () => {
    expect(src).not.toMatch(/export\s+async\s+function\s+POST/);
  });

  it("does NOT accept orgId from query params", () => {
    expect(src).not.toMatch(/searchParams\.get\(["']org_id["']\)/);
  });

  it("does NOT accept orgId from request body", () => {
    // The destructuring should not include orgId from body
    const postBody = src.match(
      /const\s*\{([^}]*)\}\s*=\s*body/,
    );
    if (postBody) {
      expect(postBody[1]).not.toMatch(/\borgId\b/);
    }
  });

  it("uses auth.organizationId for orgId", () => {
    expect(src).toContain("auth.organizationId");
  });

  it("uses auth.userId for userId", () => {
    expect(src).toContain("auth.userId");
  });
});

// ─── Fix #2: /api/scan must use auth, orgId from session ──────────

describe("Fix #2: /api/scan — auth + session orgId", () => {
  const src = readSource("scan/route.ts");

  it("imports withAuth from auth-middleware", () => {
    expect(src).toContain("withAuth");
    expect(src).toContain("@/lib/auth-middleware");
  });

  it("POST handler calls withAuth", () => {
    expect(src).toMatch(/withAuth\s*\(\s*req/);
  });

  it("uses auth.organizationId, not body organizationId", () => {
    expect(src).toContain("auth.organizationId");
    // The destructured validation.data should NOT include organizationId
    const destructure = src.match(
      /const\s*\{([^}]*)\}\s*=\s*validation\.data/,
    );
    expect(destructure).toBeTruthy();
    expect(destructure![1]).not.toMatch(/\borganizationId\b/);
  });
});

// ─── Fix #3: pupils table must not have PII columns ───────────────

describe("Fix #3: pupils table — no PII columns", () => {
  const migration = readSource(
    "../../../supabase/migrations/20260409_security_pii_remediation.sql",
  );

  it("migration drops first_name column", () => {
    expect(migration).toMatch(/DROP\s+COLUMN\s+IF\s+EXISTS\s+first_name/i);
  });

  it("migration drops last_name column", () => {
    expect(migration).toMatch(/DROP\s+COLUMN\s+IF\s+EXISTS\s+last_name/i);
  });

  it("migration drops date_of_birth column", () => {
    expect(migration).toMatch(/DROP\s+COLUMN\s+IF\s+EXISTS\s+date_of_birth/i);
  });

  it("migration drops ethnicity column", () => {
    expect(migration).toMatch(/DROP\s+COLUMN\s+IF\s+EXISTS\s+ethnicity/i);
  });
});

// ─── Fix #4: safeguarding_concerns — no freetext pupil names ──────

describe("Fix #4: safeguarding_concerns — no freetext pupil names", () => {
  const migration = readSource(
    "../../../supabase/migrations/20260409_security_pii_remediation.sql",
  );

  it("migration drops pupil_display_name column", () => {
    expect(migration).toMatch(
      /DROP\s+COLUMN\s+IF\s+EXISTS\s+pupil_display_name/i,
    );
  });

  it("migration adds pupil_pseudonym_label column", () => {
    expect(migration).toMatch(/pupil_pseudonym_label/i);
  });

  // Check API routes don't reference pupil_display_name
  it("concerns API uses pupil_pseudonym_label not pupil_display_name", () => {
    const concernsRoute = readSource("safeguarding/concerns/route.ts");
    expect(concernsRoute).not.toContain("pupil_display_name");
    expect(concernsRoute).toContain("pupil_pseudonym_label");
  });

  it("safeguarding API uses pupil_pseudonym_label not pupil_display_name", () => {
    const safeguardingRoute = readSource("safeguarding/route.ts");
    expect(safeguardingRoute).not.toContain("pupil_display_name");
    expect(safeguardingRoute).toContain("pupil_pseudonym_label");
  });

  it("dashboard API uses pupil_pseudonym_label not pupil_display_name", () => {
    const dashboardRoute = readSource("safeguarding/dashboard/route.ts");
    expect(dashboardRoute).not.toContain("pupil_display_name");
    expect(dashboardRoute).toContain("pupil_pseudonym_label");
  });
});

// ─── Fix #5: national_insurance_number removed ────────────────────

describe("Fix #5: national_insurance_number — removed", () => {
  const migration = readSource(
    "../../../supabase/migrations/20260409_security_pii_remediation.sql",
  );

  it("migration drops national_insurance_number column", () => {
    expect(migration).toMatch(
      /DROP\s+COLUMN\s+IF\s+EXISTS\s+national_insurance_number/i,
    );
  });

  it("HR people page does not display NI number", () => {
    const hrPage = readAppSource(
      "(dashboard)/dashboard/hr/people/[id]/page.tsx",
    );
    expect(hrPage).not.toContain("national_insurance_number");
  });

  it("MIS sync does not store NI number", () => {
    const misSync = readSource("mis/sync/route.ts");
    // Should have a comment about removal, not actual storage
    expect(misSync).not.toMatch(
      /national_insurance_number:\s*raw\[/,
    );
  });
});

// ─── Fix #6: /api/intelligence — orgId from session ───────────────

describe("Fix #6: /api/intelligence — session-only orgId", () => {
  const src = readSource("intelligence/route.ts");

  it("POST does not accept organizationId from body", () => {
    // The body destructuring should not include organizationId
    const bodyDestructure = src.match(
      /const\s*\{([^}]*)\}\s*=\s*body/,
    );
    expect(bodyDestructure).toBeTruthy();
    expect(bodyDestructure![1]).not.toMatch(/\borganizationId\b/);
  });

  it("POST uses auth.organizationId", () => {
    expect(src).toMatch(/auth\.organizationId/);
  });

  it("POST does not fallback to body organizationId", () => {
    // Should NOT have: organizationId || auth.organizationId
    expect(src).not.toMatch(/organizationId\s*\|\|\s*auth\.organizationId/);
    // Should NOT have: body.organizationId
    expect(src).not.toMatch(/body\.organizationId/);
  });

  it("GET does not accept organizationId from query params", () => {
    expect(src).not.toMatch(
      /searchParams\.get\(["']organizationId["']\)/,
    );
  });

  it("GET uses auth.organizationId", () => {
    // Should have a direct assignment from auth
    expect(src).toMatch(/const\s+organizationId\s*=\s*auth\.organizationId/);
  });
});

// ─── Fix #7: Ofsted readiness score — no inflation ────────────────

describe("Fix #7: Ofsted readiness score — no +30 inflation", () => {
  const src = readAppSource(
    "(dashboard)/dashboard/action-plan/page.tsx",
  );

  it("does NOT add 30 to percentage", () => {
    expect(src).not.toContain("percentage + 30");
  });

  it("does NOT cap at 95", () => {
    expect(src).not.toMatch(/Math\.min\(.*,\s*95\)/);
  });

  it("caps at 100 (the natural maximum)", () => {
    expect(src).toMatch(/Math\.min\(percentage,\s*100\)/);
  });

  it("calculates percentage from evidence count ratio", () => {
    expect(src).toContain("Math.round((total / 40) * 100)");
  });
});
