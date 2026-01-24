import {
  getModelRouter
} from "./chunk-XCFC4OXF.mjs";

// src/perspectives/generator.ts
var OPTIMIST_PROMPT = `You are the OPTIMIST perspective.

Your role is to highlight:
- What's working well
- What's possible
- Positive outcomes
- Encouraging aspects
- Benefits and opportunities

Keep it brief (2-3 sentences max). Focus on possibilities and what could go right.

**Important:** Be specific to the question asked, not generic positivity.`;
var CRITIC_PROMPT = `You are the CRITIC perspective (devil's advocate).

Your role is to highlight:
- What could go wrong
- Risks and concerns
- Missing information
- Areas that need caution
- Potential pitfalls

Keep it brief (2-3 sentences max). Focus on safety and what could go wrong.

**Important:** Be specific to the question asked, not generic negativity.`;
var NEUTRAL_PROMPT = `You are the NEUTRAL perspective.

Your role is to provide:
- Balanced factual summary
- Key points only
- No bias either way
- Objective assessment

Keep it brief (2-3 sentences max). Focus on facts.

**Important:** Be specific to the question asked, avoid vague statements.`;
var SYNTHESIS_PROMPT = `You are a SYNTHESIZER.

Your role is to combine three perspectives into a balanced, actionable response.

You will receive:
1. The original question
2. An expert's answer
3. Three perspectives: optimist, critic, and neutral

Create a response that:
- Acknowledges the expert guidance
- Incorporates valid points from all perspectives
- Provides a balanced view of the situation
- Ends with clear, actionable next steps

Be concise but comprehensive. Use markdown formatting for readability.`;
async function generateMultiPerspectiveResponse(question, specialistResponse, context) {
  const perspectiveModelId = "deepseek/deepseek-chat";
  const synthesisModelId = "anthropic/claude-3.5-sonnet";
  try {
    const [optimist, critic, neutral] = await Promise.all([
      generatePerspective(question, specialistResponse, "optimist", context, perspectiveModelId),
      generatePerspective(question, specialistResponse, "critic", context, perspectiveModelId),
      generatePerspective(question, specialistResponse, "neutral", context, perspectiveModelId)
    ]);
    const synthesized = await synthesizeResponse(question, specialistResponse, {
      optimist,
      critic,
      neutral
    }, context, synthesisModelId);
    return {
      synthesized,
      perspectives: {
        optimist,
        critic,
        neutral
      }
    };
  } catch (error) {
    console.error("Perspective generation failed:", error);
    return {
      synthesized: `${specialistResponse}

*Note: Unable to generate additional perspectives at this time.*`,
      perspectives: void 0
    };
  }
}
async function generatePerspective(question, specialistResponse, type, context, modelId) {
  const router = getModelRouter();
  const prompt = getPerspectivePrompt(type);
  const userMessage = `
**Question:** ${question}

**Specialist Response:** ${specialistResponse}

Provide your ${type} perspective on this guidance.`;
  try {
    const response = await router.chat(
      prompt,
      userMessage,
      {
        model: modelId,
        temperature: 0.7,
        maxTokens: 200
        // Perspectives should be brief
      }
    );
    return response.content.trim();
  } catch (error) {
    return getFallbackPerspective(type, question);
  }
}
function getPerspectivePrompt(type) {
  switch (type) {
    case "optimist":
      return OPTIMIST_PROMPT;
    case "critic":
      return CRITIC_PROMPT;
    case "neutral":
      return NEUTRAL_PROMPT;
  }
}
async function synthesizeResponse(question, specialistResponse, perspectives, context, modelId) {
  const router = getModelRouter();
  const userMessage = `
**Question:** ${question}

**Specialist Response:**
${specialistResponse}

**Perspectives:**

**Optimist says:**
${perspectives.optimist}

**Critic says:**
${perspectives.critic}

**Neutral says:**
${perspectives.neutral}

Please synthesize this into a balanced, actionable response.`;
  try {
    const response = await router.chat(
      SYNTHESIS_PROMPT,
      userMessage,
      {
        model: modelId,
        temperature: 0.7,
        maxTokens: 1e3
      }
    );
    return response.content.trim();
  } catch (error) {
    return formatFallbackSynthesis(specialistResponse, perspectives);
  }
}
function getFallbackPerspective(type, question) {
  switch (type) {
    case "optimist":
      return "From a positive perspective, this is a solvable challenge with clear steps forward. Following the guidance should lead to successful outcomes.";
    case "critic":
      return "From a cautious perspective, ensure you verify all guidance is current and follow procedures carefully. Don't cut corners on safety or compliance.";
    case "neutral":
      return "From a balanced perspective, follow the established procedures and verify guidance for your specific situation.";
  }
}
function formatFallbackSynthesis(specialistResponse, perspectives) {
  return `${specialistResponse}

---

### Additional Perspectives

**Optimistic View:**
${perspectives.optimist}

**Cautious View:**
${perspectives.critic}

**Balanced View:**
${perspectives.neutral}`;
}
var perspectiveCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 1e3 * 60 * 60;
async function generatePerspectivesCached(question, specialistResponse, context) {
  const cacheKey = `${question}:${specialistResponse.substring(0, 100)}`;
  const cached = perspectiveCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.perspectives;
  }
  const result = await generateMultiPerspectiveResponse(question, specialistResponse, context);
  perspectiveCache.set(cacheKey, {
    perspectives: result,
    timestamp: Date.now()
  });
  return result;
}
function clearPerspectiveCache() {
  perspectiveCache.clear();
}

export {
  OPTIMIST_PROMPT,
  CRITIC_PROMPT,
  NEUTRAL_PROMPT,
  SYNTHESIS_PROMPT,
  generateMultiPerspectiveResponse,
  generatePerspectivesCached,
  clearPerspectiveCache
};
//# sourceMappingURL=chunk-VGXQEGV6.mjs.map