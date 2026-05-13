import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = join(__dirname, "../../../../..");
const blockedProviderPrefixes = ["deep" + "seek/", "q" + "wen/"];
const scanRoots = [
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "docs",
  "gdpr",
  "apps/platform/src",
  "apps/platform/scripts",
  "apps/platform/supabase",
  "packages/core-ai/src",
  "packages/ed-backend/lib",
  "packages/ed-agents/src",
  "packages/ed-widget/src",
  "skills-lab",
  "test-ed-quick.mjs",
  "test-ed-simple.mjs",
  "test-full-integration.mjs",
];
const allowedPolicyFiles = new Set([
  "apps/platform/src/lib/ai/model-policy.ts",
  "apps/platform/src/lib/ai/model-policy.test.ts",
  "apps/platform/src/lib/ai/model-policy-source-scan.test.ts",
  "packages/ed-agents/src/models/model-policy.ts",
]);

function walk(path: string): string[] {
  const absolutePath = join(repoRoot, path);
  const stat = statSync(absolutePath);
  if (stat.isFile()) return [absolutePath];
  return readdirSync(absolutePath).flatMap((entry) => walk(join(path, entry)));
}

describe("source model policy scan", () => {
  it("does not contain disallowed model identifiers in product source or docs", () => {
    const files = scanRoots
      .flatMap(walk)
      .filter((file) => /\.(ts|tsx|js|mjs|md|sql|json)$/.test(file))
      .filter((file) => !file.includes("\\node_modules\\"))
      .filter((file) => !file.includes("\\.next\\"))
      .filter((file) => !file.includes("\\dist\\"))
      .filter((file) => !allowedPolicyFiles.has(relative(repoRoot, file).replace(/\\/g, "/")));

    const violations = files.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return blockedProviderPrefixes
        .filter((prefix) => content.toLowerCase().includes(prefix))
        .map((prefix) => `${relative(repoRoot, file)} contains ${prefix}`);
    });

    expect(violations).toEqual([]);
  });
});
