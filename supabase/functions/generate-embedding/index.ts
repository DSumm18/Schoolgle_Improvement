import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.15.0'; // Use npm specifier for Deno

// Retrieve the API key from the environment variables securely set via 'supabase secrets set'
const API_KEY = Deno.env.get('GEMINI_API_KEY');
const EMBEDDING_MODEL = 'text-embedding-004'; // Google's recommended embedding model

// Basic error checking for the API key during function initialization
if (!API_KEY) {
  console.error("FATAL: GEMINI_API_KEY environment variable not set for Edge Function.");
  // Optionally, prevent the function from starting if the key is missing in a production scenario
  // Deno.exit(1);
}

// Initialize the Google AI client only if the API key is present
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

console.log('generate-embedding function initialized.');

// Start serving requests
serve(async (req: Request) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Ensure this is a POST request
  if (req.method !== 'POST') {
    console.log('Method Not Allowed');
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if the AI client was initialized (API key was present)
  if (!genAI) {
     console.error('Embedding service not initialized (missing API key).');
     return new Response(JSON.stringify({ error: 'Embedding service not initialized due to missing API key.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Extract the text from the request body
    const { text } = await req.json();

    // Validate input text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
       console.log('Bad request: Missing or invalid "text" field.');
       return new Response(JSON.stringify({ error: 'Missing or invalid "text" field in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating embedding for text: "${text.substring(0, 50)}..."`);

    // Generate the embedding using the specified model
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text.trim()); // Trim whitespace
    const embedding = result.embedding;

    // Validate the result from the embedding model
    if (!embedding || !embedding.values || embedding.values.length === 0) {
       console.error('Failed to generate embedding - no values returned from model.');
       throw new Error('Failed to generate embedding - no values returned from model.');
    }

    console.log(`Embedding generated successfully. Vector length: ${embedding.values.length}`);

    // Return the generated embedding vector
    return new Response(JSON.stringify({ embedding: embedding.values }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Log detailed error and return a generic server error response
    console.error('Error processing embedding request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `Failed to generate embedding: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});