import OpenAI from 'openai';

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "https://schoolgle.co.uk", // Required by OpenRouter
                "X-Title": "Schoolgle", // Required by OpenRouter
            }
        });

        const response = await openai.embeddings.create({
            model: "text-embedding-3-small", // OpenRouter supports this
            input: text.replace(/\n/g, ' '),
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}
