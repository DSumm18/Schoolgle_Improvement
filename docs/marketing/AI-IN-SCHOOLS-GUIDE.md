# AI in Schools — A Plain English Guide

## What This Document Is For

This is a simple, honest guide for school leaders about AI. No jargon, no hype — just what you need to know about the tools your staff are probably already using, the risks you might not have thought about, and how Ed does things differently.

---

## What Is AI? (The 60-Second Version)

AI — artificial intelligence — is software that can understand questions, read documents, generate text, and make suggestions. You've probably heard of ChatGPT, Google Gemini, or Microsoft Copilot. They're "chatbots" — you type a question, they give you an answer.

Think of AI like a very well-read colleague. It's read millions of documents — policies, laws, research papers, textbooks — and can draw on all of that to answer questions. It doesn't "think" like a human, but it can find patterns, summarise information, and draft responses faster than any person.

**What AI is good at:**
- Answering questions about policies, procedures, and regulations
- Summarising long documents
- Drafting letters, reports, and communications
- Analysing data and spotting patterns
- Translating between languages
- Helping you use software you're not familiar with

**What AI is NOT:**
- It's not sentient or conscious — it doesn't "understand" in the human sense
- It can sometimes get things wrong (called "hallucinations") — always check important facts
- It's not a replacement for professional judgement — it's a tool to support decision-making
- It can't replace the human relationships that make schools work

---

## The Question You Need to Ask Your Staff

> **"How many of you use ChatGPT, Google Gemini, or any other AI tool to help you do your job?"**

Go on. Ask them. You might be surprised.

A 2025 survey by the Education Endowment Foundation found that **over 40% of teachers** now use AI tools regularly for planning, admin, and communication. Many more use them occasionally.

Now ask yourself: **do you know what information they're putting into those tools?**

---

## The GDPR Problem Nobody Talks About

Here's the scenario that should keep data protection officers awake at night:

### Scenario 1: The Innocent Teacher

Miss Jones is writing a report about a pupil's progress. She opens ChatGPT and types:

> "Can you help me write a concern about Jayden Smith in Year 4? He's been displaying aggressive behaviour since his parents separated in January. He's on the SEND register for SEMH needs and has a social worker involved."

She gets a nicely written paragraph back. Job done. But what just happened?

- Jayden's **full name** was sent to OpenAI's servers in the United States
- His **SEN status**, **family circumstances**, and **social worker involvement** — all special category data under GDPR — just left the school's control
- That data is now stored on OpenAI's servers. Their privacy policy says they may use it to train future models
- **This is a data breach.** Not a hypothetical one. A real one.

Miss Jones didn't mean any harm. She was trying to save time. But she's just shared a child's most sensitive personal data with a US tech company, with no data processing agreement, no DPIA, and no lawful basis.

### Scenario 2: The Office Manager

Mr Patel needs to write a letter to parents about an upcoming trip. He pastes in the class list — 30 names, some with dietary requirements, medical needs, and emergency contact details — and asks ChatGPT to format it into a letter.

Same problem. Thirty children's personal data, sent to the US, stored on someone else's servers, with no governance.

### Scenario 3: The SBM Running Census

The school business manager is struggling with the school census. She copies attendance data from SIMS into ChatGPT and asks it to help her understand the absence codes. The export includes pupil names, dates of birth, UPNs, and absence reasons (including illness codes).

**This isn't theoretical. It's happening in schools right now.**

---

## The Chinese AI Problem

It gets worse. ChatGPT isn't the only game in town. Cheaper alternatives are growing fast:

### DeepSeek (China)
- **DeepSeek** is a Chinese AI model that's become popular because it's very capable and often free
- It's built by a Chinese company. Its servers are in China. Chinese data privacy law requires companies to make data available to the Chinese government on request
- **If a staff member uses DeepSeek to help write a safeguarding concern, that child's data could end up on Chinese government servers**
- This isn't scaremongering. This is what their terms of service say

### Other Chinese/Unregulated Models
- **Qwen** (Alibaba), **Yi** (01.AI), **GLM** (Zhipu) — all Chinese-developed
- Dozens of free chatbot apps on the App Store and Google Play use these models under the hood
- That free "AI Assistant" app your TA downloaded? Check where the data goes
- Many free AI tools monetise by using your data for training — including any personal data you input

### The Free AI Trap

> **If the product is free, you are the product.**

Free AI chatbots make money somehow. Usually by:
1. **Training on your data** — everything you type becomes training data for future models
2. **Selling insights** — aggregated data about what people ask about
3. **Advertising** — targeted based on what you've discussed
4. Or, in some cases, **state data collection** requirements (China, Russia)

**Would you let a stranger read your safeguarding files? Because that's essentially what happens when staff use free AI tools with pupil data.**

---

## What Schools Should Be Doing

### Minimum Requirements (Right Now)

1. **Have an AI Acceptable Use Policy** — if you don't have one, you have a gap
2. **Train staff** — most don't realise the data implications
3. **Audit usage** — find out what tools staff are using and what data they're sharing
4. **Block at the firewall** — consider blocking unapproved AI tools on school networks
5. **Add AI to your DPIA register** — any AI tool processing personal data needs one

### The ICO Position

The Information Commissioner's Office (ICO) is clear:

- AI tools that process personal data need a **lawful basis** under UK GDPR
- Schools are **data controllers** — you're responsible even if a staff member uses an unapproved tool
- A staff member sharing pupil data with ChatGPT without authorisation could constitute a **personal data breach** reportable to the ICO within 72 hours
- Fines for GDPR breaches can be up to **£17.5 million** or 4% of annual turnover

---

## How Ed Does Things Differently

Ed is built specifically for schools, with privacy as a core design principle — not an afterthought.

### Your Data Stays Where It Is

Ed connects to your **Google Drive** or **OneDrive** — the systems you already use and control. The documents stay on your drive. Ed reads them to understand what evidence you have, but the files never leave your cloud storage.

**You control access. You control sharing. You control deletion.** Nothing changes about your existing data governance.

### The Pseudonymisation Architecture (In Plain English)

This is where Schoolgle is fundamentally different from ChatGPT and every other AI tool.

When Ed analyses pupil assessment data, here's what happens:

1. **Your computer** (not our server) takes each pupil's name and converts it into a random-looking code using encryption (HMAC-SHA256 with a key that only exists on your computer)
2. The **encrypted codes** and the **assessment data** (scores, grades, etc.) are sent to Ed
3. Ed analyses the patterns — which groups are underperforming, where the gaps are, what interventions EEF research suggests
4. Ed **never sees a pupil's name**. Ever. Not during processing, not in storage, not in the analysis
5. Your browser can show you the real names (because it has the key), but the server cannot

**In simple terms:** Imagine putting each child's work in a numbered envelope before handing it to an analyst. The analyst can tell you "Envelope 47 is below expected standard" and your browser translates that back to a name. The analyst never knew whose work they were looking at.

```
YOUR COMPUTER                          OUR SERVER
┌──────────────────┐                   ┌──────────────────┐
│                  │                   │                  │
│  "Jayden Smith"  │                   │  "a7f2c9e1..."   │
│   ──── Key ──── ─┼──► encrypted ───► │                  │
│                  │     code only      │  Analyses data   │
│  Sees real names │                   │  Never sees names │
│                  │                   │                  │
└──────────────────┘                   └──────────────────┘
```

This is called **client-side pseudonymisation**. It's the gold standard for data protection.

### What Ed Does and Doesn't See

| Data Type | Does Ed See It? | Where Is It? |
|-----------|----------------|--------------|
| Pupil names | **No** — encrypted on your computer | Your browser only |
| Assessment scores | Yes — for analysis | Encrypted in our database |
| School documents | Read-only access via your cloud | Your Google Drive / OneDrive |
| Staff names | Only if you add them to HR module | Encrypted in our database |
| Safeguarding records | **No** — Ed has no access | Your CPOMS / MyConcern |
| Financial data | **No** — Ed has no access | Your finance system |
| Chat conversations | Temporary — not stored long-term | Deleted after session |

### Belt and Braces

Even though our system is fully GDPR compliant — encrypted databases, UK data processing, legitimate interest and consent bases, DPIAs completed — we've gone further:

- **We don't need pupil names**, so we don't take them
- **We don't store chat histories** beyond the active session
- **We don't use your data to train AI models** — your data is yours
- **We don't sell or share your data** with any third party
- **We can't access your Google Drive** — you grant read-only permission and can revoke it any time

This isn't just compliant. It's **belt and braces**. Even in the astronomically unlikely event of a data breach on our side, there are no pupil names to expose. The encrypted codes are meaningless without the key that only exists on your school's computers.

### How This Compares

| | ChatGPT | DeepSeek | Google Gemini | Ed |
|---|---|---|---|---|
| Data sent to | US servers (OpenAI) | Chinese servers | US servers (Google) | UK-hosted, encrypted |
| Who can see pupil names? | OpenAI + potentially US govt | Chinese company + potentially Chinese govt | Google | **Nobody** — not even us |
| Used for AI training? | Yes (unless enterprise) | Yes | Yes (unless Workspace) | **Never** |
| Data Processing Agreement? | Not with free tier | No | Possibly (Workspace) | **Yes — included** |
| Designed for UK schools? | No | No | No | **Yes — purpose-built** |
| DPIA available? | You'd need to do your own | You'd need to do your own | You'd need to do your own | **We provide one** |
| Cost for all staff | £240/yr per person | Free (but at what cost?) | £240/yr per person | **£500/yr total** |

---

## The Conversation to Have With Your Governors

### The Board Paper Summary

> "AI tools are now being used by staff in schools across the country. Many are using free tools like ChatGPT and Google Gemini — and some are using Chinese AI models like DeepSeek — to help with planning, reporting, and admin tasks. In many cases, pupil personal data (including special category data) is being shared with these tools without authorisation, governance, or data processing agreements. This represents a significant and largely unrecognised GDPR risk.
>
> We are recommending the adoption of Ed AI by Schoolgle — a UK-built, education-specific AI assistant that uses client-side pseudonymisation to ensure pupil names never leave school computers. This provides staff with the AI assistance they clearly want, while eliminating the data protection risks of uncontrolled use of consumer AI tools."

### The Three Questions Governors Will Ask

**1. "Is it safe?"**
Yes. Pupil names are encrypted on the school's own computers before any data reaches Ed. Our servers never see identifiable pupil data. Even if breached, there would be no pupil names to expose.

**2. "Is it compliant?"**
Yes. We provide a DPIA, a data processing agreement, and documentation of lawful basis. The ICO's guidance on AI and personal data has been followed throughout the design.

**3. "Why not just use ChatGPT?"**
Because ChatGPT sends data to US servers, uses it for training, has no school context, and costs £240/year per person. Ed costs £500/year for unlimited staff, never sees pupil names, and is purpose-built for education.

---

## How Ed Fits Into What You Already Know

If you're used to looking at a spreadsheet — attendance data, assessment scores, pupil groups — then Ed takes that same information and helps you understand it faster.

Think of it like this:
- **Your MIS (SIMS/Arbor)** holds the raw data
- **Your spreadsheets** let you sort and filter it
- **Ed** reads the patterns, compares them to national data and research, and tells you what it means

The difference is that Ed does in 30 seconds what used to take your data lead half a day. And it does it without ever knowing which child is which.

### What Staff See vs What Ed Sees

When a teacher uploads assessment data:

**What the teacher sees on screen:**
| Pupil | Reading | Writing | Maths |
|-------|---------|---------|-------|
| Jayden Smith | WTS | EXS | WTS |
| Amira Khan | GDS | EXS | EXS |
| Tommy Lee | WTS | WTS | WTS |

**What Ed receives on the server:**
| Pupil Code | Reading | Writing | Maths |
|------------|---------|---------|-------|
| a7f2c9e1... | WTS | EXS | WTS |
| 3b8d4f2a... | GDS | EXS | EXS |
| 9c1e7a5d... | WTS | WTS | WTS |

**What Ed tells the teacher:**
> "3 pupils assessed. 2 pupils (67%) are below expected standard in reading. 1 pupil is below expected in all three areas — consider whether a graduated approach referral is appropriate. EEF research suggests metacognition strategies (+7 months) as a high-impact, low-cost intervention for reading."

The teacher sees the real names on their screen. Ed gave the analysis. Nobody in between ever saw who those children are.

---

## Summary: Why Ed, Not ChatGPT

| | The Problem | Ed's Solution |
|---|---|---|
| **Staff using AI** | You can't stop it — they want the productivity gains | Give them a safe, school-specific alternative |
| **Pupil data exposure** | Names, SEN status, family details sent to US/Chinese servers | Client-side pseudonymisation — names never leave the school |
| **No governance** | No DPAs, DPIAs, or lawful basis for consumer AI use | Full compliance documentation provided |
| **Generic answers** | ChatGPT doesn't know your school, your policies, or your data | Ed is connected to your school's actual systems and context |
| **Cost per head** | ChatGPT: £240/yr × staff. DeepSeek: free but sends data to China | Ed: £500/yr for unlimited staff |
| **The 20% problem** | Staff only use a fraction of existing software | Ed is an expert on SIMS, Arbor, Google, Microsoft — helps staff get full value |

**The bottom line:** Your staff are already using AI. The question isn't whether to adopt it — it's whether to adopt it safely, or pretend it isn't happening and hope the ICO doesn't come knocking.

Ed gives you AI that's built for schools, safe by design, and costs less than a cup of tea per hour.
