# 📋 How to Create the SIAMS Template Google Sheet

## Quick Instructions (5 Minutes)

### **Method 1: Manual Creation (Recommended for Understanding)**

1. **Create New Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Click "+ Blank" to create new spreadsheet
   - Name it: "SIAMS Dashboard Template"

2. **Create First School Tab**
   - Rename "Sheet1" to "School1"
   - In cell B1, type: `St. Mary's CE Primary School`
   - In row 2, add headers:
     - A2: `Category`
     - B2: `Activity`
     - C2: `Rating`

3. **Copy Data from CSV**
   - Open `TEMPLATE_SHEET_DATA.csv` in this project
   - Copy all rows for School1 (rows 3-37)
   - Paste into your Google Sheet starting at row 3

4. **Create Second School Tab**
   - Duplicate the School1 tab (right-click → Duplicate)
   - Rename to "School2"
   - In cell B1, change to: `Holy Trinity CE Academy`
   - Copy School2 data from CSV (rows 40-74)
   - Paste starting at row 3

5. **Add Instructions Tab**
   - Create new tab called "INSTRUCTIONS"
   - Add these instructions:
     ```
     HOW TO USE THIS TEMPLATE
     
     1. Make a copy of this sheet (File → Make a copy)
     2. Rename "School1" tab to your school name (optional)
     3. Change cell B1 to your actual school name
     4. Update the ratings in column C based on your school's progress
     5. You can add/remove activities as needed
     6. Keep the format: Category (Column A), Activity (Column B), Rating (Column C)
     
     RATINGS:
     - Advanced = 100%
     - Fully Effective = 75%
     - Transitioning = 50%
     - Baseline = 25%
     
     For support: support@schoolgle.com
     ```

6. **Share the Sheet**
   - Click "Share" button
   - Change to "Anyone with the link can view"
   - Copy the share link

7. **Get the Sheet ID**
   - From URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Copy the SHEET_ID part
   - This is what users will need

---

### **Method 2: Import from CSV (Faster)**

1. **Create New Google Sheet**
   - Go to Google Sheets
   - Click "+ Blank"

2. **Import Data**
   - File → Import
   - Upload → Choose `TEMPLATE_SHEET_DATA.csv`
   - Import location: "Replace current sheet"
   - Click "Import data"

3. **Split into Tabs**
   - The CSV shows where each sheet starts
   - Manually copy each school's data to separate tabs
   - Ensure B1 has school name in each tab

4. **Share and Get ID** (same as Method 1, step 6-7)

---

## 🎯 What the Final Sheet Should Look Like

### **Tab 1: School1**
```
     A                          B                                           C
1                          St. Mary's CE Primary School
2    Category                   Activity                                Rating
3    Vision & Leadership        Christian vision drives...              Advanced
4    Vision & Leadership        Vision understood...                    Fully Effective
5    Vision & Leadership        Leadership ensures vision...            Advanced
...
```

### **Tab 2: School2**
```
     A                          B                                           C
1                          Holy Trinity CE Academy
2    Category                   Activity                                Rating
3    Vision & Leadership        Christian vision drives...              Fully Effective
4    Vision & Leadership        Vision understood...                    Advanced
...
```

### **Tab 3: INSTRUCTIONS**
```
Instructions for using this template...
```

---

## 🔧 For Schoolgle Team - Creating Public Template

Once you've created the template:

1. **Make it a Template**
   - Share link should be: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/copy`
   - This automatically creates a copy for anyone who clicks

2. **Update Settings Modal**
   - Replace `TEMPLATE_ID` in SettingsModal.tsx line with actual Sheet ID
   - Update copy button to work

3. **Test the Flow**
   - Click the template link
   - Make a copy
   - Go to dashboard
   - Click Settings ⚙️
   - Paste your copied sheet URL
   - Paste your API key
   - Click "Save & Connect"
   - Verify dashboard loads

---

## 📊 Expected Results

When connected, the dashboard should show:
- **St. Mary's CE Primary**: Overall score ~72%
- **Holy Trinity CE Academy**: Overall score ~88%
- All 7 SIAMS strands with different colors
- Expandable categories showing all activities
- Working charts (bar + radar)

---

## 🚀 Going Live

Once template is created:
1. Update `SettingsModal.tsx` with real template URL
2. Test end-to-end
3. Deploy to production
4. Share template link in marketing materials

---

**Template should take ~5-10 minutes to create manually or ~2 minutes with CSV import!**
