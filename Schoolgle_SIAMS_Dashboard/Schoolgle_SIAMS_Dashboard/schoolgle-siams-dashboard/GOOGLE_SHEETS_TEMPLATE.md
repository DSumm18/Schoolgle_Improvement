# Google Sheets Template for SIAMS Dashboard

## 📋 Sheet Structure

Each school tab should follow this **exact structure**:

### **Row 1: School Name**
| A | B | C |
|---|---|---|
| *(empty)* | **St. Mary's CE Primary School** | *(empty)* |

**Cell B1** = School name (will be displayed in dashboard)

### **Row 2: Headers**
| A | B | C |
|---|---|---|
| **Category** | **Activity** | **Rating** |

### **Row 3+: Data**
| A | B | C |
|---|---|---|
| Vision & Leadership | Christian vision drives decision-making | Advanced |
| Vision & Leadership | Vision understood by all stakeholders | Fully Effective |
| Vision & Leadership | Leadership ensures vision impacts whole school | Advanced |
| Wisdom, Knowledge & Skills | Curriculum embodies Christian vision | Fully Effective |
| ... | ... | ... |

---

## 🎯 Complete Template Example

### **Sheet Tab Name**: `School1` (or any name - doesn't matter)

```
Row 1:  [empty]              St. Mary's CE Primary School      [empty]
Row 2:  Category             Activity                          Rating
Row 3:  Vision & Leadership  Christian vision drives...        Advanced
Row 4:  Vision & Leadership  Vision understood by all...       Fully Effective
Row 5:  Vision & Leadership  Leadership ensures vision...      Advanced
Row 6:  Vision & Leadership  Vision reviewed regularly         Transitioning
Row 7:  Vision & Leadership  Governors promote vision          Fully Effective
Row 8:  Wisdom, Knowledge... Curriculum embodies vision        Fully Effective
Row 9:  Wisdom, Knowledge... Pupils develop as wise...         Transitioning
...
```

---

## 📝 Full Sample Data

### **Tab 1: School1** 
Cell B1: `St. Mary's CE Primary School`

| Category | Activity | Rating |
|----------|----------|--------|
| Vision & Leadership | Christian vision drives decision-making at all levels | Advanced |
| Vision & Leadership | Vision understood and articulated by all stakeholders | Fully Effective |
| Vision & Leadership | Leadership ensures vision impacts whole school experience | Advanced |
| Vision & Leadership | Vision reviewed and refined regularly | Transitioning |
| Vision & Leadership | Governors actively promote and champion the vision | Fully Effective |
| Wisdom, Knowledge & Skills | Curriculum embodies and reflects Christian vision | Fully Effective |
| Wisdom, Knowledge & Skills | Pupils develop as wise, knowledgeable learners | Transitioning |
| Wisdom, Knowledge & Skills | Teaching promotes deep thinking about big ideas | Advanced |
| Wisdom, Knowledge & Skills | Assessment supports pupils to flourish | Fully Effective |
| Wisdom, Knowledge & Skills | Subject leadership is strong | Transitioning |
| Character Development | School nurtures hope and aspiration in all pupils | Transitioning |
| Character Development | Develops courageous advocacy and responsibility | Baseline |
| Character Development | Supports moral and spiritual character development | Fully Effective |
| Character Development | Pupils demonstrate resilience and growth mindset | Advanced |
| Character Development | Character education is explicit and intentional | Transitioning |
| Community & Living Together | Creates and sustains strong sense of community | Advanced |
| Community & Living Together | Understanding of living well in diverse communities | Fully Effective |
| Community & Living Together | Partnership with local church and Christian community | Advanced |
| Community & Living Together | Parental engagement is strong | Fully Effective |
| Community & Living Together | Links with global Christian community | Transitioning |
| Dignity & Respect | All members treated with dignity and respect | Fully Effective |
| Dignity & Respect | Celebrates and values diversity within community | Transitioning |
| Dignity & Respect | Vulnerable pupils enabled to flourish | Fully Effective |
| Dignity & Respect | Inclusive practices embedded throughout | Baseline |
| Dignity & Respect | Anti-bullying work is effective | Fully Effective |
| Collective Worship | Worship reflects and promotes Christian vision | Advanced |
| Collective Worship | Enables pupils and adults to engage spiritually | Fully Effective |
| Collective Worship | Inclusive, invitational and inspiring | Fully Effective |
| Collective Worship | Pupil leadership in worship is evident | Transitioning |
| Collective Worship | Anglican tradition is understood and celebrated | Fully Effective |
| Religious Education | Curriculum enables pupils to develop religious literacy | Transitioning |
| Religious Education | Critical engagement with religious and philosophical ideas | Baseline |
| Religious Education | Supports spiritual, moral and cultural development | Advanced |
| Religious Education | Assessment of RE is robust | Transitioning |
| Religious Education | RE is well-resourced and valued | Fully Effective |

### **Tab 2: School2**
Cell B1: `Holy Trinity CE Academy`

*(Same structure, different ratings)*

---

## ✅ Rating Values (Case-Insensitive)

The dashboard recognizes these ratings:

- **Advanced** → 100%
- **Fully Effective** → 75%
- **Transitioning** → 50%
- **Baseline** → 25%
- *(Blank or any other text)* → 0%

---

## 🎨 Visual Layout in Google Sheets

```
     A                            B                                      C
1                            St. Mary's CE Primary School
2    Category                     Activity                             Rating
3    Vision & Leadership          Christian vision drives...           Advanced
4    Vision & Leadership          Vision understood by all...          Fully Effective
5    Vision & Leadership          Leadership ensures vision...         Advanced
6    Wisdom, Knowledge & Skills   Curriculum embodies vision          Fully Effective
7    Wisdom, Knowledge & Skills   Pupils develop as wise...            Transitioning
...
```

---

## 📊 Benefits of This Structure

1. **Flexible Tab Names**: Tab can be named anything (School1, Tab1, etc.)
2. **Display Name in B1**: The actual school name shows in the dashboard
3. **Easy to Copy**: Duplicate a tab and just change B1
4. **Clear Layout**: School name prominent at top
5. **Simple Updates**: Change school name in one cell

---

## 🔄 How to Use

### **Creating a New School**:
1. Duplicate an existing school tab
2. Rename tab (optional - can be "School3", "NewSchool", etc.)
3. **Change cell B1** to the new school name
4. Update the ratings in column C as needed
5. Keep columns A & B (categories and activities) the same

### **Updating a School**:
1. Change ratings in column C
2. Add/remove activity rows as needed
3. Dashboard updates automatically on refresh

---

## 📥 Template Spreadsheet

**I'll create a ready-to-use template with:**
- 2 sample schools pre-filled
- All 7 SIAMS categories
- Sample activities for each category
- Instructions tab
- Ratings reference tab

**Copy this template to your Google Drive and customize!**

---

## 🚨 Important Notes

1. **Row 1, Column B (B1)** MUST contain the school name
2. **Row 2** MUST be the headers (Category, Activity, Rating)
3. **Data starts at Row 3**
4. Keep columns in order: A = Category, B = Activity, C = Rating
5. Tab names can be anything (they're ignored - B1 is used instead)

---

**This structure matches your Estates dashboard pattern while adding the flexibility of custom school names!** 🎯
