# AI Evidence Assessment - Implementation Plan

## Overview
Automate SIAMS evidence analysis by having AI review Google Drive folders and generate assessments based on SIAMS framework requirements.

## Architecture

### Phase 1: Button & UI (Week 1)
- [x] Display evidence text (Column D)
- [x] Display evidence folder links (Column E)
- [ ] Add "🤖 Run AI Assessment" button per activity
- [ ] Add loading states during analysis
- [ ] Display AI results in purple box (Column F)

### Phase 2: Google Drive Integration (Week 1-2)
1. **Enable Google Drive API** in Cloud Console
2. **List files in folder**: GET https://www.googleapis.com/drive/v3/files?q='FOLDER_ID'+in+parents
3. **Download file contents**:
   - PDFs: Extract text via pdf-parse or Google Drive export
   - Docs: Export as plain text
   - Images: OCR via Google Vision API (optional)
   - Limit: First 10 files or 50MB total

### Phase 3: OpenAI Integration (Week 2)
1. **API Key Setup**: Store OpenAI key securely (env variable)
2. **Prompt Engineering**:
   ```
   You are a SIAMS inspector assistant. Analyze evidence for:
   
   Category: {category}
   Activity: {activity}
   
   Framework Requirements:
   - {specific SIAMS criteria for this strand}
   - {best practice examples}
   - {common evidence types}
   
   Files provided: {list of file names and content excerpts}
   
   Provide:
   1. Evidence Quality Score (1-5)
   2. Summary of what evidence shows
   3. Gaps identified
   4. Specific actions to strengthen evidence
   5. Inspector-ready language for SEF
   ```

3. **Cost Management**:
   - Use GPT-4o-mini for cost efficiency (~$0.15 per 1M input tokens)
   - Max 4000 tokens per request
   - Estimate: £0.50-£2 per full school assessment

### Phase 4: Write Back to Sheet (Week 2-3)
1. **Update Google Sheet** Column F with AI assessment
2. **API endpoint**: POST https://sheets.googleapis.com/v4/spreadsheets/{sheetId}/values:batchUpdate
3. **Auto-refresh** dashboard after write

### Phase 5: Bulk Operations (Week 3)
- [ ] "Run AI Assessment for All" button
- [ ] Progress indicator (X of Y activities analyzed)
- [ ] Queue system to avoid rate limits
- [ ] Retry failed analyses

## SIAMS-Specific Prompts by Strand

### 1. Vision & Leadership
**Key Evidence Types:**
- Vision statement documents
- Governing body meeting minutes
- Strategic development plans
- Staff induction materials
- Parent/stakeholder surveys

**AI Prompt Focus:**
- Is the Christian vision explicit and articulated?
- Evidence of vision driving decision-making?
- Stakeholder understanding of vision?

### 2. Wisdom, Knowledge & Skills
**Key Evidence Types:**
- Curriculum plans
- RE schemes of work
- Assembly plans
- SMSC development records

**AI Prompt Focus:**
- Biblical literacy evidence
- Character development initiatives
- Curriculum breadth and depth

### 3. Character Development
**Key Evidence Types:**
- Behaviour policies
- PSHE curriculum
- Pupil voice records
- Awards/recognition systems

**AI Prompt Focus:**
- Hope and aspiration fostered?
- Resilience and growth mindset evidence?
- Courageous advocacy examples?

### 4. Community & Living Together
**Key Evidence Types:**
- Community partnership records
- Church links documentation
- Global citizenship projects
- Parental engagement evidence

**AI Prompt Focus:**
- Diverse community understanding?
- Church partnership depth?
- Global perspective?

### 5. Dignity & Respect
**Key Evidence Types:**
- Inclusion policies
- Equality impact assessments
- Safeguarding records
- Anti-bullying evidence

**AI Prompt Focus:**
- All treated with dignity?
- Diversity celebrated?
- Vulnerable supported?

### 6. Collective Worship
**Key Evidence Types:**
- Worship policy
- Assembly plans/records
- Prayer spaces
- Pupil evaluation

**AI Prompt Focus:**
- Invitational and inclusive?
- Biblical teaching evident?
- Spiritual development opportunities?

### 7. Religious Education
**Key Evidence Types:**
- RE curriculum
- Assessment records
- Lesson observations
- Pupil work samples

**AI Prompt Focus:**
- Curriculum entitlement met?
- Theological literacy?
- Critical thinking developed?

## Technical Implementation

### Required Environment Variables
```env
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
GOOGLE_DRIVE_API_KEY=AIza... (or same as above if Drive API enabled)
```

### API Endpoints to Create
1. `POST /api/analyze-evidence` - Single activity analysis
2. `POST /api/analyze-category` - Full category analysis
3. `POST /api/analyze-all` - All activities analysis
4. `GET /api/analysis-status/:jobId` - Check bulk job status

### Libraries Needed
```bash
npm install openai
npm install pdf-parse
npm install mammoth  # For .docx files
```

### Cost Estimates
- **Per Activity**: ~500-1000 tokens = £0.01-0.02
- **Per School** (35 activities): ~£0.35-0.70
- **100 Schools/year**: ~£35-70

## Security Considerations
1. **API Keys**: Store in environment variables only
2. **Rate Limiting**: Max 10 requests/minute per user
3. **File Size Limits**: Max 10MB per file, 50MB total per folder
4. **Sheet Permissions**: Verify write access before updating
5. **Data Privacy**: Don't store file contents long-term

## Next Steps
1. ✅ Create API endpoint structure
2. Add "Run AI Assessment" button to UI
3. Implement Google Drive file listing
4. Build OpenAI analysis function
5. Test with real school data
6. Deploy and monitor costs
