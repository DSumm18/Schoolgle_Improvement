const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing Supabase keys in .env.local");
        console.log("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Testing Supabase Connection...");

    // 1. Test basic connection
    const { data, error } = await supabase.from('documents').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("❌ Connection Failed:", error.message);
        return;
    }

    console.log("✅ Connected to Supabase!");
    console.log(`   Current document count: ${data || 0}`);

    // 2. Test Vector Insertion (Dummy Data)
    console.log("\nTesting Vector Insertion...");
    const dummyEmbedding = Array(1536).fill(0.1); // Dummy 1536-dim vector

    const { error: insertError } = await supabase.from('documents').insert({
        content: "Test document from verification script",
        metadata: { source: "test-script" },
        embedding: dummyEmbedding
    });

    if (insertError) {
        console.error("❌ Insert Failed:", insertError.message);
    } else {
        console.log("✅ Vector Insert Successful!");
    }
}

testSupabase();
