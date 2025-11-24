import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
        }

        // Generate embedding for the search query
        const embedding = await generateEmbedding(query);

        // Search in Supabase using the match_documents RPC function
        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.5, // Adjust similarity threshold as needed
            match_count: 5 // Limit results
        });

        if (error) {
            console.error("Supabase Search Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ results: documents });

    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
