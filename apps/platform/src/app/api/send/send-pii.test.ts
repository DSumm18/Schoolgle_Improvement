/**
 * SEND Register + MIS Sync + Document Generation PII Tests
 *
 * Verifies that:
 * - SEND register routes NEVER store or return pupil PII (first_name, last_name)
 * - MIS sync does NOT store date_of_birth
 * - Document generation does NOT persist recipient PII to generated_documents
 *
 * Run with: npx vitest run apps/platform/src/app/api/send/send-pii.test.ts
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function readSource(relativePath: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, relativePath),
    "utf-8",
  );
}

// ─── SEND Register: /api/send/register/route.ts ──────────────────

describe("send/register/route.ts — PII safety", () => {
  const src = readSource("register/route.ts");

  it("POST must insert pupil_hash into Supabase", () => {
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).toContain("pupil_hash");
  });

  it("POST must NOT insert first_name or last_name into Supabase", () => {
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).not.toMatch(/\bfirst_name\b/);
    expect(insertBody).not.toMatch(/\blast_name\b/);
  });

  it("MIS fallback display_label must NOT contain first_name or last_name", () => {
    // The MIS fallback mapping should not use r.first_name or r.last_name
    // in the display_label (or anywhere that gets returned to the client)
    const misFallbackMatch = src.match(
      /misResult\.data\.map\(([\s\S]*?)\)\s*;/,
    );
    if (misFallbackMatch) {
      const mappingBody = misFallbackMatch[1];
      expect(mappingBody).not.toMatch(/r\.first_name/);
      expect(mappingBody).not.toMatch(/r\.last_name/);
    }
  });

  it("must use createHmac for pupil hashing", () => {
    expect(src).toContain("createHmac");
    expect(src).toContain("sha256");
  });
});

// ─── SEND Register: /api/send/register/[id]/route.ts ─────────────

describe("send/register/[id]/route.ts — PII safety", () => {
  const src = readSource("register/[id]/route.ts");

  it("PUT must NOT allow first_name or last_name in allowedFields", () => {
    const allowedMatch = src.match(
      /allowedFields\s*=\s*\[([\s\S]*?)\]/,
    );
    expect(allowedMatch).toBeTruthy();
    const fields = allowedMatch![1];
    expect(fields).not.toContain("first_name");
    expect(fields).not.toContain("last_name");
  });

  it("PUT must NOT reference first_name in update logic", () => {
    expect(src).not.toContain('"first_name"');
  });

  it("PUT must NOT reference last_name in update logic", () => {
    expect(src).not.toContain('"last_name"');
  });
});

// ─── MIS Sync: /api/mis/sync/route.ts ────────────────────────────

describe("mis/sync/route.ts — PII safety", () => {
  const src = readSource("../mis/sync/route.ts");

  it("must NOT store date_of_birth in staff_directory", () => {
    // The demographic update block should not include date_of_birth
    const demoUpdatesMatch = src.match(
      /demoUpdates[\s\S]*?\.update\(demoUpdates\)/,
    );
    if (demoUpdatesMatch) {
      expect(demoUpdatesMatch[0]).not.toMatch(
        /demoUpdates\.date_of_birth\s*=/,
      );
      expect(demoUpdatesMatch[0]).not.toMatch(
        /demoUpdates\["date_of_birth"\]/,
      );
    }
    // Also check that no .update() or .insert() call writes date_of_birth
    // The directoryRecord should not include date_of_birth
    const directoryRecordMatch = src.match(
      /directoryRecord[\s\S]*?=\s*\{([\s\S]*?)\};/,
    );
    if (directoryRecordMatch) {
      expect(directoryRecordMatch[1]).not.toContain("date_of_birth");
    }
  });
});

// ─── Documents Generate: /api/documents/generate/route.ts ────────

describe("documents/generate/route.ts — PII safety", () => {
  const src = readSource("../documents/generate/route.ts");

  it("must NOT persist recipient_name in generated_documents insert", () => {
    // The .insert() call should not include recipient_name directly
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    expect(insertBody).not.toMatch(/\brecipient_name\b/);
  });

  it("must NOT persist raw placeholder_values containing PII", () => {
    // placeholder_values should either not be stored or be sanitised
    const insertMatch = src.match(/\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const insertBody = insertMatch![1];
    // Should not store raw placeholderValues — should either omit or sanitise
    expect(insertBody).not.toMatch(/\bplaceholder_values:\s*resolvedValues\b/);
  });
});
