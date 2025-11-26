# 🎯 Template Setup Instructions - For Schoolgle Team

## 📋 **Step 1: Import Template to Google Sheets** (2 minutes)

### **Using the CSV File:**

1. **Go to Google Sheets**
   - Visit https://sheets.google.com
   - Sign in with your Schoolgle Google account

2. **Create New Sheet**
   - Click "+ Blank" spreadsheet
   - Name it: **"Schoolgle SIAMS Dashboard - Template"**

3. **Import Data**
   - File → Import
   - Upload tab
   - Select `TEMPLATE_SHEET_DATA.csv` from this project
   - Import location: "Replace current sheet"
   - Separator: Detect automatically
   - Click "Import data"

4. **Create School1 Tab**
   - You'll see all the data imported
   - The CSV shows "Sheet: School1" and "Sheet: School2" markers
   - Manually create tabs and copy data:
   
   **For School1:**
   - Rename current sheet to "School1"
   - Keep rows 1-37 (up to "Sheet: School2" marker)
   - Delete everything after row 37

5. **Create School2 Tab**
   - Create new tab (+ button at bottom)
   - Name it "School2"
   - Go back to imported data
   - Copy rows after "Sheet: School2" marker
   - Paste into School2 tab

6. **Verify Structure**
   - Each tab should have:
     - Row 1: Empty | School Name | Empty
     - Row 2: Category | Activity | Rating
     - Row 3+: Data rows

---

## 🔒 **Step 2: Set Up Sharing & Security** (1 minute)

### **Make Template Public (View-Only):**

1. **Click Share** (top right)
2. **Change access:**
   - Click "Restricted" → "Anyone with the link"
   - Set permission to **"Viewer"** (not Editor!)
   - Click "Done"

3. **Get the Share Link:**
   - Click "Copy link"
   - You'll get something like:
     ```
     https://docs.google.com/spreadsheets/d/1abc123XYZ.../edit?usp=sharing
     ```

4. **Create Copy Link:**
   - Change the end from `/edit?usp=sharing` to `/copy`
   - Final template link:
     ```
     https://docs.google.com/spreadsheets/d/1abc123XYZ.../copy
     ```
   - **This makes users automatically create their own copy!**

---

## 🔗 **Step 3: Update Dashboard with Template Link** (1 minute)

Update the SettingsModal component:

```typescript
// File: src/components/SettingsModal.tsx
// Line ~72

const copyTemplateUrl = () => {
  const templateUrl = `https://docs.google.com/spreadsheets/d/YOUR_ACTUAL_SHEET_ID/copy`;
  navigator.clipboard.writeText(templateUrl);
  // Optionally also open it
  window.open(templateUrl, '_blank');
};
```

Replace `YOUR_ACTUAL_SHEET_ID` with the actual ID from step 2.

---

## 🎨 **Step 4: Add Instructions Tab** (2 minutes)

1. **Create Instructions Tab:**
   - In your template sheet
   - Click + to add new tab
   - Name it "INSTRUCTIONS"

2. **Add This Content:**

```
SCHOOLGLE SIAMS DASHBOARD - TEMPLATE
=====================================

HOW TO USE THIS TEMPLATE:

STEP 1: MAKE YOUR COPY
- You're viewing the template
- Go to File → Make a copy
- Save to your Google Drive
- You now have your own editable version

STEP 2: CUSTOMIZE FOR YOUR SCHOOL
- Rename "School1" tab to your school name (or keep it)
- Change cell B1 to your actual school name
- Update the ratings in column C based on your school's current progress
- You can add/remove activities as needed
- Keep the structure: Column A = Category, Column B = Activity, Column C = Rating

STEP 3: SHARE YOUR SHEET
- Click Share (top right)
- Change to "Anyone with the link can VIEW"
- This allows the dashboard to read your data
- Copy the share link

STEP 4: CONNECT TO DASHBOARD
- Go to the Schoolgle SIAMS Dashboard
- Click the Settings ⚙️ icon
- Paste your Google Sheet URL
- Paste your Google API Key (see instructions below)
- Click "Save & Connect"
- Your dashboard will load instantly!

=====================================

RATINGS EXPLAINED:

Use these exact terms in Column C (case doesn't matter):

• Advanced = 100 points
  Your school exceeds expectations in this area

• Fully Effective = 75 points  
  Your school meets expectations well

• Transitioning = 50 points
  Your school is developing in this area

• Baseline = 25 points
  Your school is at the beginning stage

• Leave blank = 0 points
  Not yet started or not applicable

=====================================

THE 7 SIAMS STRANDS:

1. Vision & Leadership
   How your Christian vision drives everything

2. Wisdom, Knowledge & Skills
   How your curriculum reflects Christian values

3. Character Development
   Hope, aspiration, and courageous advocacy

4. Community & Living Together
   Relationships and living well together

5. Dignity & Respect
   Ensuring all flourish

6. Collective Worship
   Impact of worship on spiritual development

7. Religious Education
   Quality and impact of RE teaching

=====================================

GETTING YOUR GOOGLE API KEY:

1. Go to console.cloud.google.com
2. Create a new project: "SIAMS Dashboard"
3. Enable "Google Sheets API"
4. Go to Credentials → Create → API Key
5. Copy your API key (starts with AIzaSy...)
6. Paste it in the dashboard Settings

Full guide: [link to detailed instructions]

=====================================

NEED HELP?

Email: [email protected]
Website: www.schoolgle.com

PRIVACY: Your data stays in YOUR Google Drive.
We never see or store your school's data.

=====================================
```

---

## 🧪 **Step 5: Test the Complete Flow** (3 minutes)

1. **Click Your Template /copy Link**
   - Should automatically create a copy
   - Opens in your Google Drive

2. **Make a Test Edit**
   - Change a rating
   - Add your name to B1
   - Verify you can edit

3. **Share Your Copy**
   - Share → Anyone with link can VIEW
   - Copy the link

4. **Connect to Dashboard**
   - Go to http://localhost:3000/dashboard
   - Click Settings ⚙️
   - Paste your test sheet URL
   - Paste API key
   - Click Save & Connect

5. **Verify Dashboard**
   - Should load your school name
   - Show all scores
   - Charts render
   - Can expand categories

6. **Test Live Edits**
   - Go back to your sheet
   - Change a rating
   - Refresh dashboard (Ctrl+R)
   - Should show updated score

---

## 🔐 **Security Best Practices**

### **Your Template:**
✅ **Viewer access only** - Users can't mess up template  
✅ **Public link** - Easy to share  
✅ **Version control** - Keep a backup copy  

### **User's Sheets:**
✅ **They own it** - In their Google Drive  
✅ **They control access** - Can restrict as needed  
✅ **GDPR compliant** - They control their data  
✅ **No central database** - Data never leaves Google  

### **API Key Security:**
⚠️ **User's responsibility** - Each school gets their own key  
⚠️ **Stored locally** - In browser localStorage only  
⚠️ **Not transmitted to your servers** - Direct to Google API  

### **Future Enhancement (Optional):**
- Service Account integration for enterprise clients
- OAuth flow for tighter security
- Can add these later as premium features

---

## 📤 **Step 6: Deploy & Share**

### **Update Settings Modal:**
```typescript
// src/components/SettingsModal.tsx
// Update line ~72 with your actual template URL

const TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/copy';
```

### **Marketing Materials:**
- Add template link to landing page
- Include in welcome emails
- Social media posts
- Documentation
- Demo videos

### **User Onboarding:**
1. Click template link
2. Get API key (5 min guide)
3. Connect (30 seconds)
4. Done!

---

## ✅ **Checklist**

Before going live:
- [ ] Template sheet created in Google
- [ ] Both School1 and School2 tabs populated
- [ ] INSTRUCTIONS tab added
- [ ] Share set to "Anyone with link can VIEW"
- [ ] /copy link tested and works
- [ ] Settings modal updated with real template link
- [ ] End-to-end test completed
- [ ] Template link added to marketing materials
- [ ] Backup copy of template saved

---

## 🎯 **The Result**

Users will:
1. Click your template link → Instant copy in their Drive
2. See pre-filled sample data → Understand structure
3. Customize for their school → 5-10 minutes
4. Connect to dashboard → 30 seconds
5. See beautiful dashboard → Instant value! 🎉

---

**Template setup time: ~10 minutes**  
**User setup time: ~5 minutes**  
**Time to value: INSTANT** ⚡
