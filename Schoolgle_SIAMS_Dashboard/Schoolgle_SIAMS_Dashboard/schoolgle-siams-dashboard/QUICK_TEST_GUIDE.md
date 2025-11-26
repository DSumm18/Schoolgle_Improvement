# 🧪 Quick Test Guide - Create & Connect Template

## ⚡ **Fast Test (Using Your Estates Sheet Structure)**

Since you already have an API key from your Estates dashboard, we can use that same key for testing!

### **Option 1: Quick Test with Existing Setup**

If you still have your Estates Google Sheet and API key:

1. **Create a Test SIAMS Sheet** (2 minutes)
   - Open your existing estates Google Sheet
   - Duplicate it (File → Make a copy)
   - Rename to "SIAMS Test"
   - Delete old tabs
   - Create new tab called "TestSchool"
   - Add this in TestSchool tab:
     ```
     Row 1:  [empty]                    St. Mary's Test School         [empty]
     Row 2:  Category                   Activity                       Rating
     Row 3:  Vision & Leadership        Vision drives decisions        Advanced
     Row 4:  Vision & Leadership        All understand vision          Fully Effective
     Row 5:  Wisdom & Skills            Curriculum reflects vision     Fully Effective
     Row 6:  Character Development      Nurtures hope                  Transitioning
     Row 7:  Community                  Strong community               Advanced
     Row 8:  Dignity & Respect          All treated with respect       Fully Effective
     Row 9:  Collective Worship         Worship reflects vision        Advanced
     Row 10: Religious Education        RE enables literacy            Transitioning
     ```

2. **Get the Sheet ID**
   - From URL: `https://docs.google.com/spreadsheets/d/[THIS_PART_IS_THE_ID]/edit`
   - Copy just the ID part

3. **Connect in Dashboard**
   - Go to http://localhost:3000/dashboard
   - Click Settings ⚙️ icon (top right)
   - Paste the full Sheet URL or just the ID
   - Paste your existing API key (from Estates setup)
   - Click "Save & Connect"
   - **BOOM!** Dashboard should load

4. **Verify It Works**
   - Should see "St. Mary's Test School" in dropdown
   - Overall score should show
   - All 7 categories visible
   - Charts render
   - Can expand categories to see activities

---

## 📋 **Option 2: Full Template Creation (10 minutes)**

For the real production template with complete data:

### **Step 1: Create New Google Sheet**
1. Go to https://sheets.google.com
2. Click "+ Blank"
3. Name it: "Schoolgle SIAMS Template"

### **Step 2: Create First School Tab**
1. Rename "Sheet1" to "School1"
2. Copy this structure:

```
     A                          B                                           C
1                          St. Mary's CE Primary School
2    Category                   Activity                                Rating
3    Vision & Leadership        Christian vision drives...              Advanced
4    Vision & Leadership        Vision understood...                    Fully Effective
5    Vision & Leadership        Leadership ensures vision...            Advanced
6    Vision & Leadership        Vision reviewed regularly               Transitioning
7    Vision & Leadership        Governors promote vision                Fully Effective
8    Wisdom Knowledge & Skills  Curriculum embodies vision              Fully Effective
9    Wisdom Knowledge & Skills  Pupils develop as wise learners         Transitioning
10   Wisdom Knowledge & Skills  Teaching promotes deep thinking         Advanced
...
```

Or copy from the CSV file:
- Open `TEMPLATE_SHEET_DATA.csv` 
- Copy rows 3-37 (all School1 data)
- Paste into Google Sheet starting at row 1

### **Step 3: Create Second School Tab**
1. Duplicate School1 tab
2. Rename to "School2"
3. Change B1 to: "Holy Trinity CE Academy"
4. Copy School2 data from CSV (rows 40-74)

### **Step 4: Share It**
1. Click "Share" button (top right)
2. Change to "Anyone with the link can VIEW"
3. Copy the link
4. For template link, change `/edit` to `/copy` at the end

### **Step 5: Test Connection**
1. Copy your template (click the /copy link)
2. Get Sheet ID from your copy's URL
3. Go to dashboard → Settings ⚙️
4. Paste Sheet ID and API key
5. Connect!

---

## 🔑 **Getting Your API Key (If You Don't Have One)**

### **5-Minute Setup:**

1. **Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Sign in with your Google account

2. **Create Project**
   - Click "Select a project" → "New Project"
   - Name: "Schoolgle SIAMS"
   - Click "Create"

3. **Enable API**
   - Go to "APIs & Services" → "Library"
   - Search: "Google Sheets API"
   - Click it → Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your key (starts with AIzaSy...)
   - (Optional) Click "Restrict Key" → Select only "Google Sheets API"

5. **Save It**
   - Keep this key safe
   - You'll paste it in the dashboard Settings

---

## ✅ **Testing Checklist**

Test these features once connected:

- [ ] Dashboard loads without errors
- [ ] School name shows correctly (from B1)
- [ ] Overall score displays and animates
- [ ] All 7 categories visible
- [ ] Category cards are color-coded
- [ ] Bar chart renders correctly
- [ ] Click category to expand/collapse
- [ ] Activities show with correct ratings
- [ ] Rating badges are color-coded
- [ ] Radar chart at bottom works
- [ ] Dark/light mode toggle works
- [ ] School dropdown works (if multiple schools)
- [ ] "All Schools Overview" shows if multiple schools

---

## 🐛 **Troubleshooting**

### **"Failed to fetch spreadsheet metadata"**
❌ **Problem:** Can't read the sheet  
✅ **Fix:** 
- Make sure sheet is shared "Anyone with link can view"
- Check Sheet ID is correct
- Verify API key is valid

### **"No valid school sheets found"**
❌ **Problem:** No data tabs detected  
✅ **Fix:**
- Make sure tab isn't named INSTRUCTIONS, RATINGS, etc.
- Check B1 has the school name
- Verify row 2 has headers
- Ensure data starts at row 3

### **Scores show as 0%**
❌ **Problem:** Ratings not recognized  
✅ **Fix:**
- Check spelling: "Advanced", "Fully Effective", "Transitioning", "Baseline"
- Remove extra spaces
- Make sure rating is in Column C

### **Settings don't save**
❌ **Problem:** LocalStorage issues  
✅ **Fix:**
- Check browser doesn't block localStorage
- Try incognito/private window
- Clear browser cache

---

## 📊 **Expected Test Results**

With the sample data:
- **St. Mary's CE Primary**: ~72% overall score
- **Holy Trinity CE Academy**: ~88% overall score
- 7 categories with mixed ratings
- Some "Advanced", some "Transitioning"
- Charts show clear differences between categories

---

## 🎥 **Record Your Test**

Once it works:
1. Screen record the connection process
2. Show dashboard loading
3. Navigate through features
4. Perfect for demo video!

---

## 🚀 **Next After Testing**

Once test works:
- ✅ You've validated the full flow
- ✅ Users will have same experience
- ✅ Ready to deploy to production
- ✅ Create polished template with full data
- ✅ Launch to first users!

---

**The fastest path: Use your existing Estates API key with a quick test sheet (Option 1 above). Takes literally 2 minutes to verify everything works!**
