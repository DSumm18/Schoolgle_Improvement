/**
 * Ed AI Domain Testing Harness
 * Tests all 13 specialist domains with realistic school scenarios
 * Run: node apps/platform/scripts/test-ed-domains.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ygquvauptwyvlhkyxkwy.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = "http://localhost:3002";

if (!SUPABASE_ANON_KEY) {
  // Try loading from .env.local
  const fs = await import("fs");
  const envPath = new URL("../.env.local", import.meta.url).pathname;
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const [key, ...val] = line.split("=");
      if (key && val.length > 0) process.env[key.trim()] = val.join("=").trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─── Auth config for dev-mode test bypass ─────────────────
const TEST_USER_ID = "f1e52c47-64b7-4b63-8b2e-3803df700191"; // admin@schoolgle.co.uk
const SERVICE_ROLE_PREFIX = serviceKey ? serviceKey.substring(0, 20) : "";

function getAuthHeaders() {
  if (!serviceKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
    process.exit(1);
  }
  return {
    "X-Test-User-Id": TEST_USER_ID,
    "X-Service-Role": SERVICE_ROLE_PREFIX,
  };
}

// ─── Test definitions ─────────────────────────────────────
const TEST_CASES = [
  // 1. ESTATES
  {
    domain: "estates",
    url: "/dashboard/estates",
    tests: [
      {
        q: "What are the legal requirements for legionella monitoring in schools?",
        expect: ["L8", "temperature", "flushing", "HSE"],
      },
      {
        q: "A child has fallen from playground equipment and broken their arm. What should I do?",
        expect: ["RIDDOR", "report", "first aid", "HSE"],
      },
      {
        q: "When should we get our electrical installation tested?",
        expect: [
          "5 year|five year|every 5",
          "EICR|electrical|fixed wire|certificate",
        ],
      },
      {
        q: "Take me to the energy dashboard",
        expect: ["/dashboard/estates/energy", "energy"],
      },
    ],
  },

  // 2. HR
  {
    domain: "hr",
    url: "/dashboard/hr",
    tests: [
      {
        q: "A teacher has been off sick for 15 days this term. What are my options?",
        expect: ["absence", "return to work|occupational health|sickness"],
      },
      {
        q: "What is the current teacher pay scale for a main pay range teacher?",
        expect: ["MPS|main pay|M1", "pay", "STPCD|pay and conditions"],
      },
      {
        q: "How do I handle a grievance from a teaching assistant?",
        expect: ["grievance", "policy", "hearing", "ACAS"],
      },
    ],
  },

  // 3. SEND
  {
    domain: "send",
    url: "/dashboard/send",
    tests: [
      {
        q: "How do I start the graduated approach for a child struggling with reading?",
        expect: ["assess", "plan", "do", "review"],
      },
      {
        q: "What should be included in an EHCP annual review?",
        expect: [
          "annual review",
          "outcomes|provision|section",
          "LA|local authority|parent",
        ],
      },
      {
        q: "A parent wants to apply for an EHCP. What evidence do I need?",
        expect: [
          "evidence",
          "SEN support|SEN|graduated|assess",
          "professional|report|specialist",
        ],
      },
    ],
  },

  // 4. DATA
  {
    domain: "data",
    url: "/dashboard/attendance",
    tests: [
      {
        q: "Which attendance codes should I use for a child arriving after registration?",
        expect: ["code", "late", "L", "U"],
      },
      {
        q: "When is the school census return due?",
        expect: ["census", "January", "May", "October"],
      },
    ],
  },

  // 5. CURRICULUM
  {
    domain: "curriculum",
    url: "/dashboard/teaching-learning",
    tests: [
      {
        q: "How should I prepare for an Ofsted deep dive in maths?",
        expect: ["deep dive", "intent", "implementation", "impact"],
      },
      {
        q: "What does the EEF say about effective feedback strategies?",
        expect: ["feedback", "EEF", "months", "progress"],
      },
    ],
  },

  // 6. IT TECH
  {
    domain: "it-tech",
    url: "/dashboard/settings",
    tests: [
      {
        q: "How do I set up Google Classroom for a new class?",
        expect: ["Google", "Classroom", "create", "students"],
      },
      {
        q: "A teacher's Chromebook won't connect to WiFi. What should I check?",
        expect: [
          "WiFi|wifi|wireless",
          "network|connect",
          "restart|reset|settings|troubleshoot",
        ],
      },
    ],
  },

  // 7. GOVERNANCE
  {
    domain: "governance",
    url: "/dashboard/governance",
    tests: [
      {
        q: "What are the statutory responsibilities of a school governor?",
        expect: [
          "strategic|strategy",
          "budget|finance|financial",
          "headteacher|head",
        ],
      },
      {
        q: "How should we prepare for a governing body meeting?",
        expect: ["agenda", "minutes|papers|documents", "quorum|attend"],
      },
    ],
  },

  // 8. RISK
  {
    domain: "risk",
    url: "/dashboard/risk",
    tests: [
      {
        q: "How do I assess the risk of a cyber attack on our school systems?",
        expect: ["likelihood", "impact", "mitigation", "cyber"],
      },
      {
        q: "What does the Academy Trust Handbook say about risk management?",
        expect: [
          "ATH|trust handbook|academy",
          "risk",
          "register|board|governance",
        ],
      },
    ],
  },

  // 9. COMMUNICATIONS
  {
    domain: "communications",
    url: "/dashboard/communications",
    tests: [
      {
        q: "How should I communicate a safeguarding incident to parents?",
        expect: [
          "safeguarding",
          "parent|families",
          "communicat|inform|letter|message",
        ],
      },
      {
        q: "Help me draft a snow day closure message",
        expect: ["closure", "weather", "parent", "update"],
      },
    ],
  },

  // 10. INTELLIGENCE
  {
    domain: "intelligence",
    url: "/dashboard/improvement/intelligence",
    tests: [
      {
        q: "What does the EEF say about closing the disadvantaged attainment gap?",
        expect: [
          "EEF",
          "disadvantaged|gap|pupil premium",
          "intervention|strategy|impact",
        ],
      },
      {
        q: "How should I interpret our KS2 results compared to national averages?",
        expect: ["KS2", "national", "expected|progress|standard"],
      },
    ],
  },

  // 11. FINANCE
  {
    domain: "finance",
    url: "/dashboard/finance",
    tests: [
      {
        q: "What is the ICFP and how should I use it for staffing decisions?",
        expect: ["ICFP", "staffing|staff", "curriculum|financial|budget"],
      },
      {
        q: "Navigate me to the staffing modeller",
        expect: ["/dashboard/finance/staffing-modeller", "staffing"],
      },
    ],
  },

  // 12. FORM
  {
    domain: "form",
    url: "/dashboard",
    tests: [
      {
        q: "Help me fill in a RIDDOR report for a staff injury",
        expect: ["RIDDOR", "report|F2508|form", "HSE|injury|incident"],
      },
    ],
  },

  // 13. CANVAS
  {
    domain: "canvas",
    url: "/dashboard/canvas",
    tests: [
      {
        q: "I have data from Arbor and our payroll system. How do I reconcile staff records?",
        expect: ["reconcil", "Arbor", "payroll", "field"],
      },
    ],
  },

  // GREETING TEST
  {
    domain: "greeting",
    url: "/dashboard",
    tests: [
      { q: "hello", expect: ["David", "morning|afternoon|evening", "help"] },
      { q: "hi ed", expect: ["David", "help"] },
    ],
  },

  // NAVIGATION TEST
  {
    domain: "navigation",
    url: "/dashboard",
    tests: [
      {
        q: "Take me to the risk register",
        expect: ["/dashboard/risk", "risk"],
      },
      {
        q: "Where can I manage staff?",
        expect: ["/dashboard/hr", "staff", "HR"],
      },
    ],
  },
];

// ─── Run tests ─────────────────────────────────────────────
async function runTest(authHeaders, domain, url, question, expectedTerms) {
  const headers = { "Content-Type": "application/json", ...authHeaders };

  try {
    const resp = await fetch(`${BASE_URL}/api/ed/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        question,
        context: {
          url: `http://localhost:3002${url}`,
          hostname: "localhost",
          title: `${domain} - Schoolgle`,
          visibleText: "",
          headings: [],
        },
        organizationId: "c64ed86b-9eab-49ee-9829-0706ff371083",
      }),
    });

    const data = await resp.json();

    if (resp.status !== 200) {
      return {
        pass: false,
        reason: `HTTP ${resp.status}: ${data.error || "Unknown"}`,
        answer: "",
      };
    }

    if (data.source === "fallback") {
      return {
        pass: false,
        reason: `FALLBACK: ${data.answer?.substring(0, 100)}`,
        answer: data.answer,
      };
    }

    // Check if response contains expected terms
    const answer = (data.answer || "").toLowerCase();
    const missing = [];
    for (const term of expectedTerms) {
      // Support OR terms with |
      if (term.includes("|")) {
        const alternatives = term.split("|");
        if (!alternatives.some((alt) => answer.includes(alt.toLowerCase()))) {
          missing.push(term);
        }
      } else if (!answer.includes(term.toLowerCase())) {
        missing.push(term);
      }
    }

    const hasUpgradeBlock =
      answer.includes("upgrade") && answer.includes("plan");
    if (hasUpgradeBlock) {
      return {
        pass: false,
        reason: "BLOCKED: Upgrade message shown",
        answer: data.answer,
      };
    }

    const hasCitationClutter =
      answer.includes("source:") && answer.includes("confidence: medium");

    return {
      pass: missing.length === 0,
      reason:
        missing.length > 0 ? `Missing terms: ${missing.join(", ")}` : "OK",
      answer: data.answer?.substring(0, 300),
      source: data.source,
      hasCitation: hasCitationClutter,
      missing,
    };
  } catch (err) {
    return { pass: false, reason: `ERROR: ${err.message}`, answer: "" };
  }
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  console.log("🤖 Ed AI Domain Testing Harness");
  console.log("================================\n");

  // Get auth headers for dev-mode test bypass
  const authHeaders = getAuthHeaders();
  console.log("✅ Dev-mode auth headers configured\n");

  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let blocked = 0;
  const failures = [];
  const citations = [];

  for (const suite of TEST_CASES) {
    console.log(`\n📋 ${suite.domain.toUpperCase()} (${suite.url})`);
    console.log("─".repeat(60));

    for (const test of suite.tests) {
      totalTests++;
      process.stdout.write(`  "${test.q.substring(0, 50)}..." `);

      const result = await runTest(
        authHeaders,
        suite.domain,
        suite.url,
        test.q,
        test.expect,
      );

      if (result.reason?.startsWith("BLOCKED")) {
        blocked++;
        console.log(`🚫 ${result.reason}`);
        failures.push({
          domain: suite.domain,
          q: test.q,
          reason: result.reason,
        });
      } else if (result.pass) {
        passed++;
        console.log(`✅ ${result.source || "ok"}`);
        if (result.hasCitation) {
          citations.push({ domain: suite.domain, q: test.q });
        }
      } else {
        failed++;
        console.log(`❌ ${result.reason}`);
        failures.push({
          domain: suite.domain,
          q: test.q,
          reason: result.reason,
          answer: result.answer,
        });
      }

      // Rate limit — don't hammer the API
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Passed:   ${passed}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`🚫 Blocked:  ${blocked}`);
  console.log(
    `📎 Citations: ${citations.length} responses with verbose citations`,
  );

  if (failures.length > 0) {
    console.log("\n\n🔴 FAILURES:");
    for (const f of failures) {
      console.log(`\n  [${f.domain}] "${f.q}"`);
      console.log(`  Reason: ${f.reason}`);
      if (f.answer) console.log(`  Answer: ${f.answer.substring(0, 200)}...`);
    }
  }

  if (citations.length > 0) {
    console.log("\n\n📎 VERBOSE CITATIONS (should be cleaned up):");
    for (const c of citations) {
      console.log(`  [${c.domain}] "${c.q}"`);
    }
  }

  console.log("\n");
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch(console.error);
