# Schoolgle - Improvement

> AI-Powered Ofsted & SIAMS Framework Evidence Management System

## Overview

Schoolgle helps schools prepare for Ofsted and SIAMS inspections by automatically scanning their Google Drive folders, extracting evidence from documents, and mapping them to specific framework requirements using AI.

**Key Features:**
- 🔍 **AI-Powered Document Analysis**: Automatically identifies which Ofsted/SIAMS evidence requirements your documents satisfy
- 📊 **Dual Rating System**: Compare school self-assessments with AI-based evidence analysis
- 📁 **Recursive Folder Scanning**: Scans entire folder structures in Google Drive/OneDrive
- 📝 **Multi-Format Support**: DOCX, PDF, XLSX, images, Google Docs, Google Sheets
- 🔗 **Evidence Linking**: Direct links to documents in their original cloud locations
- ✅ **Action Management**: Track improvement actions with Gantt charts and timelines
- 🎯 **Readiness Scoring**: Real-time assessment of inspection readiness

---

## AI Models & Configuration

### Current AI Model Stack (as of 2025-01-26)

We use a **multi-model approach** via [OpenRouter](https://openrouter.ai) to optimize for both quality and cost:

#### 1. **Primary Model: DeepSeek V3** 🏆
- **Model ID**: `deepseek/deepseek-chat`
- **Cost**: $0.24/M input, $0.84/M output tokens
- **Use Case**: 95% of documents (general text analysis, DOCX, Google Docs, text-based PDFs)
- **Why**: Best value for money - 10-20x cheaper than GPT-4o-mini with comparable quality
- **Strengths**: Excellent instruction following, structured JSON output, strong reasoning

#### 2. **OCR Model: Mistral OCR**
- **Engine**: `mistral-ocr` (via OpenRouter PDF processing)
- **Cost**: ~$0.20-0.40 per 100 documents
- **Use Case**: Scanned PDFs, images, photo-copied documents
- **Why**: Purpose-built for OCR, processes 2000 pages/min, excellent table extraction
- **Strengths**: Handles complex layouts, equations, poor-quality scans

#### 3. **Fallback Model: Gemini 2.0 Flash Lite**
- **Model ID**: `google/gemini-2.0-flash-lite-001`
- **Cost**: $0.075/M input, $0.30/M output tokens
- **Use Case**: Retry logic, JSON parsing failures, very fast processing needs
- **Why**: Highly reliable, superior JSON output, fast inference
- **Strengths**: 1.05M token context window, excellent instruction following

#### 4. **Vision Model: Qwen 2.5 VL 72B** (Optional)
- **Model ID**: `qwen/qwen-2.5-vl-72b-instruct`
- **Cost**: $0.40/M input, $0.80/M output tokens
- **Use Case**: Documents with charts, diagrams, infographics
- **Why**: Best open-source vision-language model, competitive with GPT-4o
- **Strengths**: Complex visual understanding, 75% accuracy on JSON extraction benchmarks

### Cost Estimates

**Scanning 100 Documents (avg 5KB each):**
- DeepSeek V3: ~$0.08-0.15
- GPT-4o-mini (comparison): ~$0.40-0.80
- **Savings: 5-10x cheaper!**

**Monthly Costs (typical school):**
- Small (100 docs/month): ~$0.50-1.00
- Medium (500 docs/month): ~$1.00-2.00
- Large (2000 docs/month): ~$4.00-8.00

### Why OpenRouter?

1. **Multi-Model Access**: One API for 200+ models
2. **Cost Optimization**: Automatic routing to cheapest provider
3. **Fallback Support**: If one model fails, automatically retry with another
4. **Transparent Pricing**: Clear per-token costs
5. **No Vendor Lock-in**: Easy to switch models

### Changing Models

Models are configured in `/src/lib/ai-evidence-matcher.ts`:

```typescript
const MODEL_CONFIG = {
  primary: 'deepseek/deepseek-chat',      // Main analysis
  ocr: 'mistral-ocr',                      // Scanned documents
  vision: 'qwen/qwen-2.5-vl-72b-instruct', // Visual content
  fallback: 'google/gemini-2.0-flash-lite-001' // Retry logic
};
```

**To switch models:**
1. Check available models: https://openrouter.ai/models
2. Update `MODEL_CONFIG` in `ai-evidence-matcher.ts`
3. Update this README with rationale for change
4. Test with sample documents before deploying

**Alternative Models to Consider:**

| Model | Cost | When to Use |
|-------|------|-------------|
| `google/gemini-2.5-flash` | $0.003/$0.25 | If available - insanely cheap! |
| `anthropic/claude-3.5-sonnet` | $3/$15 | When absolute accuracy is critical |
| `openai/gpt-4o` | $2.50/$10 | Premium quality (expensive) |
| `meta-llama/llama-3.3-70b-instruct` | Free tier | Development/testing |

### Model Selection Logic

```
Document → Check File Type →
  ├─ Scanned PDF/Image → Mistral OCR (extract text) → DeepSeek (analyze)
  ├─ Visual Content (charts/diagrams) → Qwen 2.5 VL
  ├─ Text Document → DeepSeek V3
  └─ Failure/Retry → Gemini 2.0 Flash Lite
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **State Management**: React Context API

### Backend
- **API Routes**: Next.js API Routes (serverless)
- **Authentication**: Firebase Auth (Google, Microsoft)
- **Database**: Supabase (PostgreSQL)
- **Vector Search**: pgvector extension

### AI & Document Processing
- **LLM Provider**: OpenRouter (multi-model)
- **Primary Model**: DeepSeek V3
- **OCR**: Mistral OCR
- **Embeddings**: OpenAI text-embedding-3-small
- **Document Parsers**: 
  - DOCX: mammoth
  - XLSX: xlsx
  - PDF: Google Drive export API
  - Images: Mistral OCR / GPT-4o

### Cloud Storage
- Google Drive API (OAuth 2.0)
- Microsoft OneDrive API (OAuth 2.0)

---

## Environment Variables

Create a `.env.local` file:

```bash
# Firebase (Authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter (AI Models)
OPENROUTER_API_KEY=your_openrouter_key
# Alternative: OPENAI_API_KEY if using OpenAI directly

# Google OAuth (Drive Access)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Microsoft OAuth (OneDrive Access)  
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_microsoft_client_id
```

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Supabase project
- OpenRouter account

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/schoolgle-improvement.git
cd schoolgle-improvement

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Setup

```bash
# Run Supabase migrations
# (assumes Supabase CLI installed)
supabase db push

# Or manually execute supabase_schema.sql in Supabase dashboard
```

---

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── scan/         # Document scanning endpoint
│   │   └── search/       # Semantic search endpoint
│   ├── dashboard/        # Main dashboard page
│   └── login/           # Authentication page
│
├── components/           # React components
│   ├── OfstedFrameworkView.tsx    # Main Ofsted UI
│   ├── ActionsDashboard.tsx        # Action management
│   ├── ActionsGanttChart.tsx       # Timeline view
│   └── ...
│
├── lib/                  # Utility libraries
│   ├── ofsted-framework.ts        # Framework data & logic
│   ├── ai-evidence-matcher.ts     # AI matching engine (NEW)
│   ├── cloud-service.ts           # Google Drive/OneDrive API
│   ├── extractors.ts             # Document text extraction
│   ├── embeddings.ts             # Vector embeddings
│   └── assessment-updater.ts      # Auto-update assessments (NEW)
│
└── context/             # React contexts
    ├── AuthContext.tsx  # Firebase authentication
    └── ThemeContext.tsx # Dark mode (coming soon)
```

---

## Features

### 1. Ofsted Framework View
- 5 main categories (Quality of Education, Behaviour & Attitudes, etc.)
- Expandable subcategories with evidence requirements
- Dual rating system (School vs AI)
- Color-coded readiness indicators
- Contextual guidance with official documentation links

### 2. AI Evidence Scanning
- Recursive folder scanning (all subfolders)
- Multi-format document extraction
- Intelligent evidence matching using AI
- Confidence scores for each match
- Link preservation to original documents

### 3. Action Management
- Create actions linked to evidence gaps
- Priority levels (High/Medium/Low)
- Assignees and due dates
- Status tracking (Open/In Progress/Completed)
- Notes and audit trail
- Gantt chart timeline view

### 4. Search
- Semantic search across all documents
- Powered by vector embeddings
- Find evidence by natural language query

---

## AI Evidence Matching

### How It Works

1. **Document Extraction**: Extract text from DOCX, PDF, XLSX, images
2. **AI Analysis**: Send to DeepSeek V3 with Ofsted framework context
3. **Evidence Mapping**: AI identifies which requirements the document satisfies
4. **Confidence Scoring**: Each match gets a 0-1 confidence score
5. **Quote Extraction**: Key relevant sections are extracted
6. **Database Storage**: Matches stored with links to original documents
7. **Assessment Update**: AI ratings auto-update based on evidence found

### Example AI Prompt

```
System: You are an expert Ofsted inspector analyzing school documents.

User: Analyze this document and identify which Ofsted evidence requirements it satisfies.

Document Title: Curriculum Intent Policy 2024-25.docx
Content: [truncated document text]

Framework Evidence Requirements:
- Quality of Education > Curriculum Intent
  ├─ Curriculum policy documents
  ├─ Subject progression maps
  ├─ SEND provision maps
  └─ Curriculum rationale

Return JSON with matches, confidence scores, and relevant quotes.
```

### Response Format

```json
{
  "matches": [
    {
      "category_id": "quality_of_education",
      "subcategory_id": "curriculum_intent",
      "evidence_item": "Curriculum policy documents",
      "confidence": 0.95,
      "explanation": "Document is a comprehensive curriculum intent policy...",
      "key_quotes": [
        "Our curriculum is designed to...",
        "Subject progression ensures..."
      ]
    }
  ]
}
```

---

## Roadmap

### Completed ✅
- [x] Firebase authentication (Google, Microsoft)
- [x] Ofsted Framework UI with all categories
- [x] Dual rating system
- [x] Action management with modals
- [x] Gantt chart timeline
- [x] SIAMS framework placeholder
- [x] Basic document scanning
- [x] Multi-format text extraction

### In Progress 🚧
- [ ] AI evidence matching (implementing now)
- [ ] Recursive folder scanning
- [ ] Assessment auto-updates
- [ ] Evidence linking

### Planned 📋
- [ ] Dark mode
- [ ] PDF extraction improvements
- [ ] SEF (Self Evaluation Form) auto-generation
- [ ] Email reports and notifications
- [ ] Multi-school support for MATs
- [ ] Export to Word/PDF
- [ ] Evidence audit trail

---

## Model Change History

### 2025-01-26: Initial Multi-Model Setup
**Decision**: Use DeepSeek V3 as primary model  
**Rationale**:
- 10-20x cheaper than GPT-4o-mini ($0.24/M vs $2.50/M input)
- Excellent instruction following and JSON output
- Good enough quality for evidence matching
- Cost savings allow scanning at scale

**Fallback**: Gemini 2.0 Flash Lite for reliability  
**OCR**: Mistral OCR for scanned documents

**Cost Impact**: Reduced from est. $20/month to $1-2/month for typical school

### Future Considerations
- If Gemini 2.5 Flash becomes available ($0.003/M input), consider switching primary
- Monitor DeepSeek V3 accuracy - may need occasional GPT-4o verification
- Watch for new models on OpenRouter (updated monthly)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Proprietary - All rights reserved

---

## Support

For questions or issues:
- Email: support@schoolgle.co.uk
- GitHub Issues: [Create an issue](https://github.com/your-org/schoolgle-improvement/issues)

---

## Acknowledgments

- Ofsted Education Inspection Framework
- SIAMS Framework (Church of England)
- OpenRouter for multi-model AI access
- Supabase for backend infrastructure
- Next.js team for the amazing framework
