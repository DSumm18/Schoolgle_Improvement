import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(__dirname, "index.ts"), "utf8");

describe("Supabase audit MCP safety", () => {
  it("does not include hardcoded Supabase credentials or fallback secrets", () => {
    expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY\s*\|\|/);
    expect(source).not.toMatch(/SUPABASE_URL\s*\|\|/);
    expect(source).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    expect(source).not.toMatch(/https:\/\/[a-z0-9]+\.supabase\.co/i);
  });

  it("does not expose row-reading or demo mutation tools", () => {
    expect(source).not.toMatch(/get_table_info/);
    expect(source).not.toMatch(/get_user_completions/);
    expect(source).not.toMatch(/check_recent_completion/);
    expect(source).not.toMatch(/sample_row/);
    expect(source).not.toMatch(/\.select\('\*'\)/);
  });
});
