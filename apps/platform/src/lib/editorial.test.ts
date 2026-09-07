import { describe, it, expect } from "vitest";
import { getPublishedInsights } from "@/data/insights";
import { getEditorial } from "./editorial";
import { moduleContent } from "./moduleContent";
import { moduleThemes, getModuleVars } from "./moduleThemes";
import ModulePage from "@/app/(marketing)/modules/[slug]/page";
import { GET } from "@/app/api/insights/[slug]/content/route";
describe("public editorial contract", () => {
  it("keeps the six report briefings substantial, sourced and consistent with their cards", () => {
    const briefings = getPublishedInsights().filter(
      (i) => i.format === "briefing",
    );
    expect(briefings).toHaveLength(6);
    for (const meta of briefings) {
      const article = getEditorial(meta.slug)!;
      const words = article.body
        .replace(/<[^>]+>/g, " ")
        .trim()
        .split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(650);
      expect(meta.readTime).toBe(`${Math.ceil(words / 220)} min`);
      expect(article.summary).toHaveLength(3);
      expect(meta.summary).toEqual(article.summary);
      expect(article.sources!.length).toBeGreaterThanOrEqual(3);
      expect(new Set(article.sources!.map((s) => s.url)).size).toBe(
        article.sources!.length,
      );
      for (const source of article.sources!) {
        expect(new URL(source.url).protocol).toBe("https:");
        expect(source.published.length).toBeGreaterThan(4);
        expect(article.body).toContain(source.url);
      }
    }
  });
  it.each(getPublishedInsights())(
    "$slug has a complete, safe article and matching API body",
    async ({ slug, title }) => {
      const article = getEditorial(slug);
      expect(article?.title).toBe(title);
      expect(
        article!.body.replace(/<[^>]+>/g, " ").split(/\s+/).length,
      ).toBeGreaterThan(180);
      expect(article!.body).not.toMatch(
        /<script|onerror=|javascript:|content is being prepared/i,
      );
      expect(article!.sourceUrl).toMatch(/^https:\/\//);
      const response = await GET(new Request("http://localhost"), {
        params: Promise.resolve({ slug }),
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(article!.body);
    },
  );
  it.each(["__proto__", "constructor", "../../AGENTS", "missing-article"])(
    "rejects unpublished or unsafe key %s",
    async (slug) => {
      expect(getEditorial(slug)).toBeUndefined();
      expect(
        (
          await GET(new Request("http://localhost"), {
            params: Promise.resolve({ slug }),
          })
        ).status,
      ).toBe(404);
    },
  );
  it.each([
    "hr",
    "finance",
    "estates",
    "compliance",
    "teaching",
    "send",
    "governance",
    "improvement",
  ])("navigation module %s has content and theme", (slug) => {
    expect(moduleThemes[slug]?.name).toBeTruthy();
    expect(moduleContent[slug]?.howEdHelps.length).toBeGreaterThan(0);
  });
});

describe("public module route boundary", () => {
  it.each(["__proto__", "constructor", "toString", "missing-module"])(
    "returns not found for non-module %s",
    async (slug) => {
      expect(getModuleVars(slug)).toEqual({});
      await expect(
        ModulePage({ params: Promise.resolve({ slug }) }),
      ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    },
  );
});
