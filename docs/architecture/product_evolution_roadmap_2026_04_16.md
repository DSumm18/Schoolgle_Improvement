# Schoolgle Intelligence Canvas - Product Roadmap
**Date:** 16th April 2026

## 1. The 3-Tier Layered Strategy
The product relies on a staggered, tiered conversion loop.

### Tier 1: The "Visualisation" Entry Point (Top of Funnel)
- **Concept:** The user drops a basic spreadsheet (e.g., standard Trust percentages). 
- **Value:** The AI instantly unpacks it into a beautiful, generative dashboard. 
- **Goal:** This is the entrance. It wows them by simply bypassing manual CSV reading. It is structurally safe (no deep GDPR risk since it's macro-percentages).

### Tier 2: The MCP External Overlay (Contextual Power)
- **Concept:** The user is logged in. We introduce "Smart Connectors" via the existing `mcp-server`.
- **Mechanism:** We layer the uploaded data with external geospatial APIs to prove the school does not exist in a vacuum.
- **Tools:** 
  - `Distance / Routing API`: Maps attendance drops against postcodes.
  - `data.police.uk`: Correlates behavioral exclusions against localized street crime.
  - `Adzuna API`: Explains staff retention deficits via localized economic tech hiring salaries.

### Tier 3: The Granular Micro-Level (Pupil Demographics)
- **Concept:** Deep integration into Schoolgle internal databases.
- **Value:** Moving beyond generic spreadsheets. Connecting the deep DfE Census (FSM, EAL) directly to internal pupil-level assessment tracking.
- **The Pitfall Addressed (Moderation Inflation):** We must be extremely careful. An apparent Year 6 failure might actually be a Year 2 assessment/moderation failure (inflated baselines). The system must trace pupil cohort tracking longitudinally.

## 2. Preventing Rule Hallucination (Ofsted Readiness)
**Crucial Directive:** Do not "invent" AI rules for determining Ofsted performance.
- The codebase already contains an exhaustive deterministic rule engine in `apps/platform/src/lib/ofsted/inspection-criteria.ts` and `apps/platform/src/lib/ofsted-framework.ts`.
- The Intelligence Canvas must rely entirely on those deterministic rules to flag warnings, rather than allowing the LLM to hallucinate inspection criteria.
- Equivalently, Faith School compliance must directly invoke the `siams.ts` rule engines.

## 3. The Generative Loop (Ed Chatbot)
The analysis doesn't stop at "raising a flag". It must trigger solutions within the Schoolgle ecosystem.
- Example: If the AI determines EAL linguistical gaps are driving down Maths scores, it doesn't just recommend TAs—it recommends configuring **"Ed the Chatbot"** inside the school network to natively translate structural maths algorithms in real-time.

---
*Note: This document exists to prevent future LLMs/Developers from recreating dashboard routing logic in silos, overriding the Ofsted deterministic frameworks, or abandoning the MCP connection strategy.*
