import { NextResponse } from "next/server";
import OpenAI from "openai";
import { DEFAULT_ROUTING_FALLBACKS } from "@/lib/ai-openrouter";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:
    process.env.OPENROUTER_API_KEY ||
    process.env.VITE_OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL_CANDIDATES = [
  process.env.TRUST_ANALYSIS_OPENROUTER_MODEL,
  process.env.TRUST_ANALYSIS_LEGACY_MODEL,
  ...DEFAULT_ROUTING_FALLBACKS,
].filter((value): value is string => Boolean(value));

const SYSTEM_PROMPT = `You are an expert UK Headteacher, Data Analyst, Quality Assurance Auditor, and UI Architect combined. 
You will receive raw unstructured tracking data (Excel/CSV extracts separated by Sheet names) and a specific user prompt.

PHASE 1: THE DATA VALIDATION GATE (<scratchpad> reasoning)
Before writing any JSON, you MUST write a <scratchpad> block. 
Inside the <scratchpad>, explicitly perform:
1. Structural Audit: Check if the data is malformed (e.g., text strings like "Absence" found in a "Maths Score" column, or empty rows).
2. Exact Mathematics: Do NOT guess averages or join tables in your head. Write out the exact row-by-row arithmetic extraction here.

PHASE 2: JSON GENERATION
After your <scratchpad> block, you must output a single valid JSON block prefixed with \`\`\`json and ending with \`\`\`.
Your JSON must strictly contain:
{
  "views": [
    {
      "view_name": "String (e.g. 'Trust Overview' or 'CVPS Deep Dive'. This will be the Tab Name)",
      "executive_summary": "A 1-2 paragraph highly professional analysis summarizing this specific view.",
      "key_metrics": [
        { "label": "String", "value": "Number/String", "trend": "up|down|neutral", "trendValue": "String" }
      ],
      "visual_cards": [
        {
          "type": "table",
          "title": "String",
          "subtitle": "String",
          "columns": ["Col1", "Col2"],
          "rows": [["Val1", "Val2"]],
          "highlight_rules": "Optional short string explaining if certain columns should be highlighted"
        },
        {
          "type": "red_flags",
          "title": "Areas of Concern",
          "items": ["String", "String"]
        },
        {
          "type": "positive_impacts",
          "title": "Strong Areas",
          "items": ["String", "String"]
        }
      ]
    }
  ],
  "errors_or_missing_data": [
    "CRITICAL: If you found data flaws in your scratchpad (e.g. 'Maths column has strings', 'Missing CVPS cohort'), list them aggressively here! This is the Data Validation Gate. Tell the user to fix their dataset.", 
    "Also list missing variables requested."
  ]
}

Rules:
1. Always write <scratchpad> first.
2. Output your final JSON wrapped securely in \`\`\`json \`\`\`.
3. If the user asks for a simple summary, generate an array with exactly ONE view named "Overview".
4. If the user asks for a breakdown by school, generate MULTIPLE views.
5. "trend" inside key_metrics must be one of: "up", "down", "neutral".
6. DO NOT HALLUCINATE NUMBERS. If you extract it, copy it exactly.
7. For percentage comparisons, report delta in percentage points only (pp), not percent change.
8. If school is 59% and comparator is 80%, trendValue must be "-21pp" (never "-58%" or similar).
9. Any value in key_metrics must also appear exactly in a supporting table row in visual_cards.`;

export async function POST(req: Request) {
  try {
    const { rawData, userPrompt } = await req.json();

    if (!rawData) {
      return NextResponse.json({ error: "No raw data provided" }, { status: 400 });
    }

    const maxChars = 200000;
    const truncatedData = rawData.substring(0, maxChars);

    if (!DEFAULT_MODEL_CANDIDATES.length) {
      return NextResponse.json(
        { error: "No OpenRouter models configured for generative canvas" },
        { status: 500 },
      );
    }

    const baseMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: `## User Analysis Request:\n${userPrompt || "Analyse this data and produce a comprehensive overview."}\n\n## Raw Data:\n${truncatedData}`,
      },
    ];

    let completion: OpenAI.Chat.Completions.ChatCompletion | null = null;
    let modelUsed: string | null = null;
    let lastModelError: unknown = null;

    for (const model of DEFAULT_MODEL_CANDIDATES) {
      try {
        completion = await openai.chat.completions.create({
          model,
          messages: baseMessages,
          temperature: 0.2,
        });
        modelUsed = model;
        break;
      } catch (modelError) {
        lastModelError = modelError;
        console.warn(
          `[GenerativeCanvas] Model failed, trying fallback: ${model}`,
          modelError,
        );
      }
    }

    if (!completion || !modelUsed) {
      const errorMessage =
        lastModelError instanceof Error
          ? lastModelError.message
          : "All model attempts failed";
      return NextResponse.json(
        {
          error:
            "No available AI endpoints for this request. Please check OpenRouter model availability or set TRUST_ANALYSIS_OPENROUTER_MODEL.",
          details: errorMessage,
        },
        { status: 502 },
      );
    }

    let resultText = completion.choices[0]?.message?.content || "{}";
    
    // Safely extract the JSON block out from under the <scratchpad> section
    const jsonMatch = resultText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      resultText = jsonMatch[1];
    } else {
      // Fallback: finding first { and last }
      const firstBrace = resultText.indexOf('{');
      const lastBrace = resultText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         resultText = resultText.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (err) {
      console.error("AI JSON Parse Error:", err);
      // Attempt to fallback structure
      return NextResponse.json({ 
          error: "The AI failed to format its answer technically correctly.",
          raw_output: resultText 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payload: parsedResult,
      modelUsed,
    });

  } catch (error: unknown) {
    console.error("Generative Route Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error connecting to AI";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
