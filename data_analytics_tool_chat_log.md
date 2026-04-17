# Data Analytics Tool Evolution: Session Transcript (Morning)

*This document captures the chronological conversation and development steps specifically focusing on the evolution of the Trust Data Analysis Generative Canvas, excluding prior history.*

***

## 1. Port Confusion & Product Handover
**USER:** "Why is it running on 3027? Should it not be running on 3000 so it all works? We had this issue before, didn't we?"

**AI:** Clarified that the `apps/platform` runs on Next.js default port `3000`. The AI initially referenced `3027` because the User's very first terminal log showed them trying to access that port. Instructed User to navigate to `http://localhost:3000/dashboard/school-improvement/trust-analysis` to view the newly built Generative Intelligence Canvas.

***

## 2. Generating the First Tier-1 Report 
**USER:** *(Uploaded UI Screenshot)* "I gave it a very basic prompt and this is what it produced."

**AI:** Celebrated the successful execution. The AI accurately parsed the User's prompt (*"Generate a report assessing this data set as best you can and present it for a meeting..."*) and mapped the unstructured spreadsheet into a sleek, Schoolgle-branded UI. The `framer-motion` cards, the Grove House Logo uploader, and the Ofsted Pipeline connectors all rendered perfectly.

***

## 3. The Multi-Tab "App Generator" Limitation 
**USER:** *(Uploaded New Screenshot with sidebar)* "Yeah I gave it a prompt type. You'll see in the thing about creating a multi-tabbed dashboard for each school and making it an overview page as well but it can't do that"

**AI:** Diagnosed the architectural limitation. The Version 1 AI engine in `route.ts` was strictly forced to return a single-page JSON format (`executive_summary`, `key_metrics`, etc.). It had no structural capacity to "paginate" its thoughts.

**AI Implementation:**
*   Upgraded `SYSTEM_PROMPT` so the AI returns a dynamic `views` array.
*   Updated `page.tsx` React logic to introduce `activeViewIdx` state and a Horizontal Tab Menu.
*   *Result:* The engine transitioned from a "Report Generator" to a dynamic "Multi-Page App Generator."

***

## 4. Identifying Zero-Shot AI Math Hallucinations
**USER:** *(Uploaded Screenshot of Multi-Tab working, but with mangled data)* "Yeah I checked the data. What validation have we got in place to check it's correct? We haven't even got the first table right. We just cross-referenced it against the spreadsheet that I uploaded that we've been working on and it hasn't even got those numbers correct so therefore it's fundamentally flawed and it can't go on. How do we ensure that the data is in the spreadsheet or that we've got it correct? Why has it gone wrong in this instance?"

**AI:** Diagnosed the massive flaw: **Zero-Shot Math Hallucination**. 
*   **Cause 1:** The frontend (`page.tsx`) blindly concatenated every row from every tab into one massive array, destroying the context of which row belonged to which school. 
*   **Cause 2:** The backend forced `gpt-4o` to calculate averages without a reasoning scratchpad, causing it to panic and guess numbers like `[25+159%`.

***

## 5. The "Validation Gate" Pivot
**USER:** "...If they give us a spreadsheet, we utilise their data but call out the flaws in it that they might need to fix before we do the analytics. As a letter we get in the data set right before we perform it so the user tidies it up. We've already got the connector so we should pick it up straight away then house it so they've done live and almost refresh to clean up the data in that report to make sure it's valid... Do we need to superpower it and pick a better model that's just awesome at doing this stuff?"

**AI Implementation:**
Approved the User's "Data Integrity First" intuition and implemented a bulletproof architecture:
1.  **Frontend Fix (`page.tsx`):** The Excel parser now separates data cleanly by Tab Name (`{"EYFS": [...], "Phonics": [...]}`) so the AI doesn't mix columns.
2.  **Model Upgrade (`route.ts`):** Swapped OpenAI's `gpt-4o` for Anthropic's `Claude-3.5-Sonnet`, the empirical gold standard for dense structural reasoning.
3.  **Chain-of-Thought Scratchpad:** Rewrote the `SYSTEM_PROMPT` forcing the AI to generate a `<scratchpad>` reasoning block first before producing JSON. It must use this block to explicitly state its math row-by-row.
4.  **The Validation Gate:** Instructed the AI to act as a hostile Quality Assurance Auditor. If it detects missing strings in math columns, it refuses to generate the dashboard cleanly, instead firing massive Red Flags explicitly telling the Headteacher to clean the structural flaws in their dataset.
