# Marketing Automation Hub

## How This System Works

### 1. Auto-Capture from Chat

Claude automatically captures marketing-relevant ideas from normal conversation. You don't need to file anything manually — just talk, and ideas get picked up.

**What gets captured:**
- Product positioning ideas
- Campaign concepts
- Competitor observations
- Messaging/copy ideas
- Visual/design concepts
- Sales conversation starters
- Content ideas (LinkedIn, email, presentations)

**Where it goes:**
- New idea file created in `docs/marketing/ideas/NNN-idea-name.md`
- Ideas INDEX.md updated with the new entry
- If relevant to competitors: `docs/marketing/competitor-intel/` updated

### 2. Competitor Intelligence (Automated Scraping)

Run competitor scrapes to get fresh screenshots, feature lists, and marketing copy:

```bash
# Scrape all competitors (uses Playwright/Chrome DevTools)
# Ask Claude: "Scrape the competitor sites and update the intel"
```

**Competitors tracked:**
| Competitor | URL | Category |
|-----------|-----|----------|
| Arbor Education | arbor-education.com | MIS |
| Bromcom | bromcom.com | MIS |
| SIMS (ESS) | ess-sims.co.uk | MIS |
| ScholarPack | scholarpack.com | MIS |
| The Key | thekeysupport.com | Knowledge base |
| BlueSky Education | blueskyeducation.co.uk | School improvement |
| Juniper Education | junipereducation.org | School improvement |
| Every (IRIS) | every.education | HR/Finance |

**What gets captured per competitor:**
- Homepage screenshot (dated)
- Feature list extraction
- Pricing (if visible)
- Marketing claims and social proof
- Navigation structure (reveals product scope)
- Testimonials and case studies

**Output:** `docs/marketing/competitor-intel/breakdowns/COMPETITOR-NAME.md`

### 3. NotebookLM Integration

All marketing materials are compiled into a single clean source file that can be uploaded to Google NotebookLM for AI-powered Q&A, audio summaries, and idea generation.

**To update the NotebookLM source:**
```bash
# Ask Claude: "Compile the NotebookLM source pack"
```

This generates: `docs/marketing/automation/notebooklm-source.md` — a single file containing:
- All module value sheets
- Competitive analysis (with latest scrape data)
- Pricing and positioning
- Sales scripts and conversation starters
- Campaign ideas and calendar
- Latest captured ideas

**Upload this single file to NotebookLM** whenever it's regenerated.

### 4. Content Generation Pipeline

From the captured intel and ideas, Claude can generate:

| Output | Command | Format |
|--------|---------|--------|
| LinkedIn post | "Write a LinkedIn post about [topic]" | Ready to paste |
| Comparison graphic data | "Create a comparison table for [competitor]" | Markdown table for design |
| Email campaign | "Draft an email campaign for [audience] about [topic]" | Subject + body |
| Pitch slide content | "Write a pitch slide about [module]" | Headline + bullets |
| Social proof content | "Turn [testimonial/stat] into social content" | Multiple formats |

---

## File Structure

```
docs/marketing/
├── automation/
│   ├── MARKETING-AUTOMATION.md    ← This file
│   └── notebooklm-source.md      ← Compiled source for NotebookLM
├── competitor-intel/
│   ├── screenshots/               ← Dated competitor screenshots
│   ├── assets/                    ← Grabbed competitor images/assets
│   └── breakdowns/                ← Per-competitor analysis
│       ├── arbor.md
│       ├── bromcom.md
│       ├── sims.md
│       └── scholarpack.md
├── ideas/                         ← Auto-captured ideas from chat
│   ├── INDEX.md                   ← Master pipeline
│   └── NNN-idea-name.md           ← Individual ideas
├── modules/                       ← Module value sheets
├── demo-scripts/                  ← Presentation scripts
└── pitch-deck/                    ← HTML pitch deck
```

## Quick Commands

| What you want | What to say |
|--------------|-------------|
| Capture an idea | Just mention it — it'll be captured automatically |
| Scrape competitors | "Update the competitor intel" |
| Refresh NotebookLM source | "Compile the NotebookLM pack" |
| Generate content from an idea | "Turn idea #NNN into a LinkedIn post" |
| Compare us to a competitor | "Show me how we compare to [name] right now" |
| Get fresh screenshots | "Screenshot [competitor] homepage" |
