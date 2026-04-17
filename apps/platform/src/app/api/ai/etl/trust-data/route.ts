import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `You are a world-class educational data analyst and extraction engine. 
You will be provided with raw, poorly formatted, unstructured tabular data pulled from a Trust-wide school tracking document.
Your job is to normalize and extract this data perfectly into a strict JSON schema.

Do your best to infer the meaning of columns:
- 'School' or 'Academy' -> school_name
- 'Year Group', 'Yr', 'NCY' -> year_group (Must be one of: "EYFS", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6")
- 'Cohort', 'NOR', 'Pupils' -> cohort (integer)
- 'SEND', 'SEN K' -> send (integer)
- 'EHCP', 'EHC Plan' -> ehcp (integer)
- 'FSM', 'Disadvantaged', 'PP' -> fsm (integer/percentage)

If you see academic metrics, extract them as decimal percentages (e.g., 65% or 0.65 -> 0.65):
For EYFS:
- GLD_All, GLD_FSM, GLD_NonFSM

For Year 1-6:
- R_ARE (Reading Age Related Expectation), R_GD (Reading Greater Depth)
- W_ARE, W_GD
- M_ARE, M_GD
- C_ARE, C_GD (Combined RWM)
- Phonics (Usually Year 1/2)
- MTC (Multiplication Tables Check, usually Year 4)

Similarly try to extract the FSM6 and NotFSM demographic splits if they exist (e.g., FSM6_R_ARE).

IMPORTANT OUPUT RULES:
- Output ONLY valid JSON containing an array called 'rows'.
- Do not wrap in markdown or backticks.
- If a value is blank, missing, or NA, use null.
`;

export async function POST(req: Request) {
  try {
    const { rawData } = await req.json();

    if (!rawData) {
      return NextResponse.json({ error: "No raw data provided" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Extract the following data:\n\n${rawData.substring(0, 150000)}` },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    let resultText = completion.choices[0]?.message?.content || "{}";
    
    // Clean markdown if the model hallucinates it despite instructions
    if (resultText.startsWith("```json")) resultText = resultText.replace(/```json\n/g, "").replace(/```/g, "");
    if (resultText.startsWith("```")) resultText = resultText.replace(/```/g, "");

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (err) {
      console.error("AI JSON Parse Error:", err);
      return NextResponse.json({ error: "Failed to parse AI output as JSON" }, { status: 500 });
    }

    if (!parsedResult.rows || !Array.isArray(parsedResult.rows)) {
      return NextResponse.json({ error: "AI output did not contain 'rows' array" }, { status: 500 });
    }

    // Now, transform the flat 'rows' array into the nested React state format `page.tsx` expects.
    const nextData: Record<string, Record<string, any>> = {
      "EYFS": {}, "Year 1": {}, "Year 2": {}, "Year 3": {}, 
      "Year 4": {}, "Year 5": {}, "Year 6": {}
    };
    const nextSchools = new Set<string>();

    const parseNum = (v: any) => (v === "" || v == null || isNaN(Number(v))) ? null : Number(v);

    parsedResult.rows.forEach((row: any) => {
      const school = row.school_name;
      const yg = row.year_group;
      if (!school || !yg || !nextData[yg]) return;
      
      nextSchools.add(school);
      
      nextData[yg][school] = {
        cohort: parseNum(row.cohort),
        send: parseNum(row.send),
        ehcp: parseNum(row.ehcp),
        fsm: parseNum(row.fsm),
      };
      
      if (yg === "EYFS") {
         nextData[yg][school].gld_all = parseNum(row.gld_all || row.GLD_All);
         nextData[yg][school].gld_fsm = parseNum(row.gld_fsm || row.GLD_FSM);
         nextData[yg][school].gld_notfsm = parseNum(row.gld_notfsm || row.GLD_NonFSM);
      } else {
         ['R', 'W', 'M', 'C'].forEach(s => {
            nextData[yg][school][`${s}_ARE`] = parseNum(row[`${s}_ARE`]);
            nextData[yg][school][`${s}_GD`] = parseNum(row[`${s}_GD`]);
         });
         nextData[yg][school].phonics = parseNum(row.phonics || row.Phonics);
         nextData[yg][school].mtc = parseNum(row.mtc || row.MTC);
         
         nextData[yg][school].fsm6 = {};
         nextData[yg][school].notfsm = {};
         
         ['R', 'W', 'M', 'C'].forEach(s => {
            nextData[yg][school].fsm6[`${s}_ARE`] = parseNum(row[`fsm6_${s}_are`] || row[`FSM6_${s}_ARE`]);
            nextData[yg][school].notfsm[`${s}_ARE`] = parseNum(row[`notfsm_${s}_are`] || row[`NotFSM_${s}_ARE`]);
         });
         nextData[yg][school].fsm6.phonics = parseNum(row.fsm6_phonics || row.FSM6_Phonics);
         nextData[yg][school].notfsm.phonics = parseNum(row.notfsm_phonics || row.NotFSM_Phonics);
         nextData[yg][school].fsm6.mtc = parseNum(row.fsm6_mtc || row.FSM6_MTC);
         nextData[yg][school].notfsm.mtc = parseNum(row.notfsm_mtc || row.NotFSM_MTC);
      }
    });

    return NextResponse.json({
      success: true,
      schools: Array.from(nextSchools),
      data: nextData
    });

  } catch (error: any) {
    console.error("ETL Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error connecting to AI" },
      { status: 500 }
    );
  }
}
