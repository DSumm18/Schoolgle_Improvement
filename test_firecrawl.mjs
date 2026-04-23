import FirecrawlApp from '@mendable/firecrawl-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('apps/platform/.env.local') });

const apiKey = process.env.FIRECRAWL_API_KEY;
if (!apiKey) {
    console.error('FIRECRAWL_API_KEY is not defined in apps/platform/.env.local');
    process.exit(1);
}

const firecrawl = new FirecrawlApp({ apiKey: apiKey });

const targetUrls = [
    { name: 'YPO', url: 'https://www.ypo.co.uk/product/detail/pens-and-pencils/ballpoint-pens/ypo-ballpoint-pens-medium-blue-pack-of-50/700010' },
    { name: 'ESPO', url: 'https://www.espo.org/stationery-office-equipment.html' },
    { name: 'TTS Group', url: 'https://www.tts-group.co.uk/blue-medium-ballpoint-pens-50pk/1000851.html' },
    { name: 'Lyreco UK', url: 'https://www.lyreco.com/group/uk/en/products/stationery' },
    { name: 'RM Education', url: 'https://www.rm.com/products/hardware' }
];

async function runTests() {
    console.log('Starting Firecrawl feasibility test...\n');
    for (const target of targetUrls) {
        console.log(`Testing ${target.name} (${target.url})...`);
        try {
            const scrapeResult = await firecrawl.scrapeUrl(target.url, {
                formats: ['markdown'],
                markdownOptions: {
                    waitFor: 2000
                }
            });

            if (scrapeResult.success) {
                console.log(`✅ Success for ${target.name}`);
                console.log(`   Title: ${scrapeResult.metadata?.title || 'No Title extracted'}`);
                // Just log a small snippet of the markdown to confirm it got real data
                const mdSnippet = scrapeResult.markdown ? scrapeResult.markdown.slice(0, 50).replace(/\n/g, ' ') : 'No Markdown';
                console.log(`   Snippet: ${mdSnippet}...\n`);
            } else {
                console.log(`❌ Failed for ${target.name}: ${JSON.stringify(scrapeResult.error || scrapeResult)}\n`);
            }
        } catch (error) {
            console.log(`❌ Error for ${target.name}: ${error.message}\n`);
        }
    }
}

runTests();
