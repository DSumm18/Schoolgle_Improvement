import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('apps/platform/.env.local') });

async function runTests() {
    console.log('Starting Firecrawl Schema Extraction Test (Real Seeding Test)...\n');

    const targetUrls = [
        { name: 'Ryman Business', url: 'https://www.ryman.co.uk/bic-cristal-ballpoint-pens-medium-point-pack-of-10-black' },
        { name: 'WHSmith', url: 'https://www.whsmith.co.uk/products/whsmith-blue-medium-ballpoint-pens-mixed-pack-of-10/0000008581786.html' }
    ];

    try {
        const { firecrawlExtract } = await import('./apps/platform/src/lib/deal-finder/extractors/firecrawl');
        for (const target of targetUrls) {
            console.log(`Extracting data from ${target.name} (${target.url})...`);
            try {
                // firecrawlExtract automatically enforces the Zod schema and maps prices, etc.
                const result = await firecrawlExtract(target.url);
                console.log(`✅ Success for ${target.name}`);
                console.log(JSON.stringify(result, null, 2));
            } catch (err) {
                console.log(`❌ Error for ${target.name}: ${err.message}\n`);
            }
            console.log("------------------------------------------");
        }
    } catch (err) {
        console.error('Failed to load internal module', err);
    }
}

runTests();
