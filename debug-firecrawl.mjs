import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "apps/platform/.env.local") });

async function debug() {
  const FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
  const key = process.env.FIRECRAWL_API_KEY;
  const client = new FirecrawlApp({ apiKey: key });

  console.log("Pinging Hope Education with proper format...");
  try {
      const result = await client.scrape("https://www.hope-education.co.uk/product/early-years/creative-play/glue-sticks-40g-pack-of-100/he212133", {
        formats: ['markdown'],
        timeout: 30000
      });
      console.log("Success?", result.success);
      console.log("Markdown snippet:", result.markdown?.substring(0, 300));
  } catch (err) {
      console.log("Error:", err.message);
  }
}
debug()
