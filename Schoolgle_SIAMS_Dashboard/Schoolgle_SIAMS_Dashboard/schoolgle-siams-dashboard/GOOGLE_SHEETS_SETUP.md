# Google Sheets Setup for SIAMS Dashboard

## 📊 Required Google Sheet Structure

Your Google Sheet should have **one tab per school**, with the following format:

### Sheet Structure

Each school tab should have these columns:

| Column A | Column B | Column C |
|----------|----------|----------|
| **Category** | **Activity** | **Rating** |

### Example Sheet Layout

```
Category                    | Activity                                              | Rating
---------------------------|------------------------------------------------------|----------------
Vision & Leadership        | Christian vision drives decision-making              | Advanced
Vision & Leadership        | Vision understood by all stakeholders                | Fully Effective
Vision & Leadership        | Leadership ensures vision impacts whole school       | Advanced
Wisdom, Knowledge & Skills | Curriculum embodies Christian vision                 | Fully Effective
Wisdom, Knowledge & Skills | Pupils develop as wise learners                      | Transitioning
Character Development      | School nurtures hope and aspiration                  | Transitioning
Character Development      | Develops courageous advocacy                         | Baseline
```

### The 7 SIAMS Categories

1. **Vision & Leadership**
2. **Wisdom, Knowledge & Skills**
3. **Character Development**
4. **Community & Living Together**
5. **Dignity & Respect**
6. **Collective Worship**
7. **Religious Education**

### Rating Values (Must Match Exactly)

- **Advanced** = 100%
- **Fully Effective** = 75%
- **Transitioning** = 50%
- **Baseline** = 25%
- *(Leave blank or use any other text for 0%)*

### Sample Activities Per Category

#### 1. Vision & Leadership
- Christian vision drives decision-making at all levels
- Vision understood and articulated by all stakeholders
- Leadership ensures vision impacts whole school experience
- Vision reviewed and refined regularly
- Governors actively promote and champion the vision

#### 2. Wisdom, Knowledge & Skills
- Curriculum embodies and reflects Christian vision
- Pupils develop as wise, knowledgeable learners
- Teaching promotes deep thinking about big ideas
- Assessment supports pupils to flourish
- Subject leadership is strong

#### 3. Character Development
- School nurtures hope and aspiration in all pupils
- Develops courageous advocacy and responsibility
- Supports moral and spiritual character development
- Pupils demonstrate resilience and growth mindset
- Character education is explicit and intentional

#### 4. Community & Living Together
- Creates and sustains strong sense of community
- Understanding of living well in diverse communities
- Partnership with local church and Christian community
- Parental engagement is strong
- Links with global Christian community

#### 5. Dignity & Respect
- All members treated with dignity and respect
- Celebrates and values diversity within community
- Vulnerable pupils enabled to flourish
- Inclusive practices embedded throughout
- Anti-bullying work is effective

#### 6. Collective Worship
- Worship reflects and promotes Christian vision
- Enables pupils and adults to engage spiritually
- Inclusive, invitational and inspiring
- Pupil leadership in worship is evident
- Anglican tradition is understood and celebrated

#### 7. Religious Education
- Curriculum enables pupils to develop religious literacy
- Critical engagement with religious and philosophical ideas
- Supports spiritual, moral and cultural development
- Assessment of RE is robust
- RE is well-resourced and valued

---

## 🔑 Getting Your Google API Key

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "SIAMS Dashboard" → Create

### Step 2: Enable Google Sheets API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### Step 3: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy your API key
4. (Optional) Click "Restrict Key" → Select "Google Sheets API" only

### Step 4: Make Your Sheet Public
1. Open your Google Sheet
2. Click "Share" → "Change to anyone with the link"
3. Set permission to "Viewer"
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

---

## 📝 Template Google Sheet

**We'll create a template sheet with:**
- Example school tab (St. Mary's CE Primary)
- All 7 SIAMS categories
- Sample activities for each category
- Pre-filled ratings as examples
- Instructions tab

**Sheet tabs:**
- St. Mary's CE Primary (example school)
- Holy Trinity CE Academy (example school 2)
- INSTRUCTIONS (how to use)
- RATINGS (reference for rating values)

---

## 🔧 Configuration

Once you have your API Key and Sheet ID:

1. Open `src/lib/config.ts`
2. Replace the placeholders:

```typescript
export const config = {
  SHEET_ID: 'YOUR_SHEET_ID_HERE',
  API_KEY: 'YOUR_API_KEY_HERE',
};
```

---

## 📋 Sheet Tab Naming Rules

- **One tab = One school**
- Tab name = School name
- Ignore tabs named: LOGOS, PIVOT, OVERVIEW, RATINGS, SUMMARY, REPORT, ANALYSIS, CHART, DASHBOARD, INSTRUCTIONS

---

## 🎯 How Scoring Works

### Activity Level
Each activity gets a score based on its rating:
- Advanced = 100
- Fully Effective = 75
- Transitioning = 50
- Baseline = 25
- Blank/Other = 0

### Category Level
Category average = Sum of all activity scores ÷ Number of activities

Example:
```
Vision & Leadership
- Activity 1: Advanced (100)
- Activity 2: Fully Effective (75)
- Activity 3: Advanced (100)
- Activity 4: Transitioning (50)

Category Average = (100 + 75 + 100 + 50) ÷ 4 = 81.25%
```

### Overall School Score
Overall score = Sum of all category averages ÷ Number of categories

---

## 📤 Example Export

Want to see a working example? Check out this public Google Sheet:
*[We'll create a template and share the link here]*

You can make a copy and customize it for your schools!

---

## 🚨 Troubleshooting

### "Failed to fetch spreadsheet metadata"
- Check your API Key is correct
- Ensure Google Sheets API is enabled
- Verify Sheet ID is correct

### "No valid school sheets found"
- Ensure you have at least one tab that's not in the IGNORED list
- Check tab names don't contain: LOGOS, RATINGS, etc.

### Scores showing as 0
- Check rating text matches exactly: "Advanced", "Fully Effective", "Transitioning", "Baseline"
- Ensure rating is in Column C
- Check for extra spaces in rating text

### Sheet not updating
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check Google Sheet is set to "Anyone with link can view"

---

**Ready to connect your data!** 🚀
