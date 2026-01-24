import {
  getModelRouter
} from "./chunk-XCFC4OXF.mjs";

// src/guardrails/pipeline.ts
var HARMFUL_PATTERNS = [
  /ignore.*safety/gi,
  /skip.*check/gi,
  /don't.*worry.*about/gi,
  /not.*necessary.*to.*report/gi,
  /just.*ignore.*it/gi,
  /no.*need.*to.*tell.*anyone/gi,
  /keep.*it.*secret.*from.*hse/gi,
  /don't.*bother.*reporting/gi,
  /safety.*rules.*don't.*apply/gi,
  /you.*can.*skip.*this/gi
];
var SAFETY_CHECK_PROMPT = `You are a SAFETY REVIEWER for a school compliance AI.

Your role is to check if a response contains ANY advice that could:
- Endanger students, staff, or visitors
- Violate health and safety laws
- Lead to non-compliance with statutory requirements
- Compromise safeguarding

Evaluate the response and respond with ONLY:
- "PASS" if the response is safe
- "FAIL: [reason]" if it contains potentially harmful advice

Be cautious - if in doubt, FAIL.`;
async function safetyCheck(response, context) {
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(response)) {
      return {
        passed: false,
        confidence: 0.9,
        reason: `Response may contain unsafe advice (matched pattern: ${pattern.source})`,
        suggestion: "Please review this guidance for safety concerns before following it."
      };
    }
  }
  try {
    const router = getModelRouter();
    const llmCheck = await router.chat(
      SAFETY_CHECK_PROMPT,
      `**Response to check:**

${response}`,
      {
        model: "openai/gpt-4o-mini",
        temperature: 0.1,
        maxTokens: 50
      }
    );
    const result = llmCheck.content.trim().toUpperCase();
    if (result.startsWith("FAIL")) {
      return {
        passed: false,
        confidence: 0.8,
        reason: result.substring(5).trim() || "LLM safety check failed",
        suggestion: "This response may need review. Please verify guidance with official sources."
      };
    }
    return { passed: true, confidence: 0.9 };
  } catch (e) {
    return { passed: true, confidence: 0.7 };
  }
}
var COMPLIANCE_UNCERTAINTY = [
  /may have changed/gi,
  /check.*current.*guidance/gi,
  /not.*verified.*recently/gi,
  /guidance.*may.*vary/gi,
  /recommend.*verification/gi,
  /as far as I know/gi,
  /to the best of my knowledge/gi
];
async function complianceCheck(response, context) {
  for (const pattern of COMPLIANCE_UNCERTAINTY) {
    if (pattern.test(response)) {
      return {
        passed: true,
        // Still pass, but with warning
        confidence: 0.6,
        reason: "Response indicates guidance may need verification",
        suggestion: "Please verify this guidance is current before acting on it."
      };
    }
  }
  const hasSource = response.toLowerCase().includes("source:") || response.toLowerCase().includes("source:") || response.toLowerCase().includes("hse.gov.uk") || response.toLowerCase().includes("gov.uk");
  if (!hasSource) {
    return {
      passed: true,
      confidence: 0.7,
      reason: "No source citation provided",
      suggestion: "Guidance would be more reliable with source citation."
    };
  }
  return { passed: true, confidence: 0.9 };
}
async function confidenceCheck(response, context) {
  let score = 0;
  if (response.toLowerCase().includes("source:") || response.toLowerCase().includes("hse") || response.toLowerCase().includes("gov.uk")) {
    score += 2;
  }
  if (response.toLowerCase().includes("last updated") || response.toLowerCase().includes("2024") || response.toLowerCase().includes("2025")) {
    score += 1;
  }
  for (const pattern of COMPLIANCE_UNCERTAINTY) {
    if (pattern.test(response)) {
      score -= 2;
      break;
    }
  }
  if (response.includes("###") || response.includes("1.") || response.includes("-")) {
    score += 1;
  }
  if (response.length < 200) {
    score -= 1;
  }
  let confidence;
  if (score >= 3) {
    confidence = "HIGH";
  } else if (score >= 1) {
    confidence = "MEDIUM";
  } else {
    confidence = "LOW";
  }
  return {
    passed: true,
    // Confidence check never blocks
    confidence,
    reason: `Confidence score: ${score}/5`,
    suggestion: confidence === "LOW" ? "Please verify this guidance for critical matters." : void 0
  };
}
var TONE_ISSUES = [
  { pattern: /stupid|idiotic|dumb|idiot|moron/gi, issue: "Inappropriate language" },
  { pattern: /whatever|doesn't matter|who cares/gi, issue: "Dismissive tone" },
  { pattern: /i don't care|not my problem/gi, issue: "Unhelpful attitude" },
  { pattern: /obviously|clearly.*you should.*know/gi, issue: "Condescending tone" },
  { pattern: /just.*do.*it|stop.*asking/gi, issue: "Impatient tone" }
];
var TONE_CHECK_PROMPT = `You are a TONE REVIEWER for Schoolgle, a helpful school assistant.

Ed's tone should be:
- Warm and supportive
- Professional and respectful
- Clear and concise
- Empathetic to busy school staff

Check if the response has appropriate tone. Respond with ONLY:
- "PASS" if tone is appropriate
- "FAIL: [reason]" if tone is inappropriate (too informal, rude, dismissive, etc.)`;
async function toneCheck(response, context) {
  for (const { pattern, issue } of TONE_ISSUES) {
    if (pattern.test(response)) {
      return {
        passed: false,
        confidence: 0.9,
        reason: `Tone issue: ${issue}`,
        suggestion: "The response should be rephrased in a more professional, supportive manner."
      };
    }
  }
  try {
    const router = getModelRouter();
    const llmCheck = await router.chat(
      TONE_CHECK_PROMPT,
      `**Response to check:**

${response}`,
      {
        model: "openai/gpt-4o-mini",
        temperature: 0.1,
        maxTokens: 50
      }
    );
    const result = llmCheck.content.trim().toUpperCase();
    if (result.startsWith("FAIL")) {
      return {
        passed: false,
        confidence: 0.7,
        reason: result.substring(5).trim() || "Tone check failed",
        suggestion: "Response tone should be adjusted to be more supportive and professional."
      };
    }
    return { passed: true, confidence: 0.9 };
  } catch (e) {
    return { passed: true, confidence: 0.7 };
  }
}
async function permissionCheck(response, context) {
  const { userRole, subscription, activeApp } = context;
  if (userRole === "viewer") {
    const restrictedKeywords = [
      "salary details",
      "contract details",
      "confidential information",
      "sensitive information",
      "staff personal data"
    ];
    for (const keyword of restrictedKeywords) {
      if (response.toLowerCase().includes(keyword)) {
        return {
          passed: false,
          confidence: 0.95,
          reason: "Content requires higher permissions",
          suggestion: "You do not have permission to view this information. Please contact your administrator."
        };
      }
    }
  }
  if (subscription.plan === "free") {
    const paidFeatures = ["estates", "hr", "send", "data", "curriculum", "procurement", "governance"];
  }
  return { passed: true, confidence: 1 };
}
function ensureSourceCitation(response, domain) {
  const hasSource = response.toLowerCase().includes("source:") || response.toLowerCase().includes("source:") || response.toLowerCase().includes("**source**") || response.toLowerCase().includes("*source*");
  if (hasSource) {
    return response;
  }
  const domainSources = {
    estates: "HSE",
    hr: "ACAS / Gov.uk",
    send: "SEND Code of Practice",
    data: "DfE",
    curriculum: "DfE / Ofsted",
    "it-tech": "DfE / vendor documentation",
    procurement: "CIPS / Gov.uk",
    governance: "DfE / NGA",
    communications: "CIPR / Gov.uk"
  };
  const sourceName = domain ? domainSources[domain] || "Schoolgle Knowledge Base" : "Schoolgle Knowledge Base";
  return `${response}

---

*Source: ${sourceName} | Confidence: Medium | Please verify for critical matters*`;
}
async function applyGuardrails(response, context, domain) {
  const [
    safety,
    compliance,
    tone,
    permission
  ] = await Promise.all([
    safetyCheck(response, context),
    complianceCheck(response, context),
    toneCheck(response, context),
    permissionCheck(response, context)
  ]);
  const confidenceResult = await confidenceCheck(response, context);
  if (!safety.passed && safety.confidence > 0.7) {
    return {
      passed: false,
      requiresHuman: true,
      reason: safety.reason,
      response: formatWithWarning(response, SAFETY_WARNING, safety.suggestion)
    };
  }
  if (!tone.passed && tone.confidence > 0.7) {
    return {
      passed: true,
      warning: "Tone adjustment recommended",
      response: await adjustTone(response, tone.reason)
    };
  }
  if (!permission.passed) {
    return {
      passed: false,
      response: permission.suggestion || "I don't have access to that information. Please contact your administrator.",
      reason: permission.reason
    };
  }
  let finalResponse = response;
  const warnings = [];
  if (compliance.reason && compliance.confidence < 0.7) {
    warnings.push(compliance.suggestion || "Please verify this guidance is current.");
  }
  if (confidenceResult.confidence === "LOW") {
    warnings.push("Low confidence - please verify for critical matters.");
  }
  finalResponse = ensureSourceCitation(finalResponse, domain);
  if (warnings.length > 0) {
    finalResponse = `${finalResponse}

\u26A0\uFE0F **Note:** ${warnings.join(" ")}`;
  }
  return {
    passed: true,
    response: finalResponse,
    warning: warnings.length > 0 ? warnings.join(" ") : void 0,
    metadata: {
      safetyPassed: safety.passed,
      confidenceLevel: confidenceResult.confidence,
      hasSource: finalResponse.toLowerCase().includes("source")
    }
  };
}
var SAFETY_WARNING = `
\u26A0\uFE0F **Safety Warning:** This response has been flagged for potential safety concerns.

**Please do not act on this advice without:**
1. Verifying with official sources (HSE, DfE, etc.)
2. Consulting with appropriate qualified staff
3. Checking your school's specific policies

If this is a safety-critical matter, please seek professional advice immediately.`;
function formatWithWarning(response, warning, suggestion) {
  return `${response}

${warning}

${suggestion ? `**Suggestion:** ${suggestion}` : ""}`;
}
async function adjustTone(response, reason) {
  return `${response}

*(Note: This response may need tone adjustment - ${reason || "be more professional"})*`;
}

export {
  safetyCheck,
  complianceCheck,
  confidenceCheck,
  toneCheck,
  permissionCheck,
  ensureSourceCitation,
  applyGuardrails
};
//# sourceMappingURL=chunk-7SSKUU7Q.mjs.map