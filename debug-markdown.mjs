import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "apps/platform/.env.local") });

async function checkScrape() {
  const FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
  const client = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  
  const urls = [
      "https://www.hope-education.co.uk/product/early-years/creative-play/glue-sticks-40g-pack-of-100/he212133"
  ];
  
  for (const url of urls) {
      console.log(`\nChecking Markdown for ${url}...`);
      try {
          const result = await client.scrape(url, {
              formats: ['markdown'],
              timeout: 30000
          });
          
          if (result.success) {
              console.log("MARKDOWN OUTPUT SNIPPET:");
              console.log(result.markdown?.slice(0, 1000));
          } else {
              console.log("FAIL:", result.error);
          }
      } catch (err) {
          console.error("CRASH:", err);
      }
  }
}

checkScrape();
