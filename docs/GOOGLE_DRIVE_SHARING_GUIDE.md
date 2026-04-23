# How to Connect Google Drive to Schoolgle

## Quick Setup Guide

### Step 1: Create Your Folder (if not exists)
1. Go to [drive.google.com](https://drive.google.com)
2. Create a new folder (e.g., "Schoolgle Data" or your school name)

### Step 2: Share the Folder ⭐ CRITICAL STEP
1. **Right-click** the folder → "**Share...**"
2. Under "General access", click the dropdown that says "Restricted"
3. Select "**Anyone with the link**"
4. Set role to "**Viewer**" (Schoolgle only needs to read, not edit)
5. Click "**Send**" or "**Share**"

**⚠️ IMPORTANT**: The folder MUST be shared as "Anyone with the link" → Viewer, or Schoolgle cannot access it!

### Step 3: Get the Folder Link
1. **Right-click** the folder → "**Get link**"
2. Copy the folder link
   - Format: `https://drive.google.com/drive/folders/XXXXX`
   - OR: `https://drive.google.com/open?id=XXXXX`

### Step 4: Connect in Schoolgle
1. Go to **Settings** → **Data Connections**
2. Paste the folder link
3. Click **Connect**
4. Schoolgle will scan your folder and detect data categories

## Recommended Folder Structure

```
📁 School Data (root folder - share this one)
├─ 📁 Census_Reports          → DfE census returns
├─ 📁 Pupil_Data
│   ├─ 📁 Admissions
│   ├─ 📁 Attendance
│   ├─ 📁 Assessments
│   └─ 📁 SEN_Register
├─ 📁 Staff_Records
├─ 📁 Finance
├─ 📁 Governance
├─ 📁 Safeguarding
└─ 📁 Estates
```

## Troubleshooting

### Error: "Cannot access this folder" (403)
**Cause**: Folder isn't shared as "Anyone with the link"

**Fix**:
1. Right-click folder in Google Drive
2. Click "Share..."
3. Change "Restricted" to "Anyone with the link"
4. Set to "Viewer"
5. Save and try again

### Error: "This link points to a file, not a folder"
**Cause**: You copied a file link, not a folder link

**Fix**:
1. Go back to Google Drive
2. Make sure you're right-clicking the **folder** (not a file inside it)
3. Copy the folder link
4. Try again

### Error: "Failed to validate folder access"
**Cause**: Folder ID is invalid or folder doesn't exist

**Fix**:
1. Check the folder link is complete
2. Make sure the folder exists in your Google Drive
3. Try copying the link again

## Privacy & Security

**What Schoolgle CAN do:**
- ✓ Read files in your shared folder
- ✓ Scan folder structure to detect data categories
- ✓ Download specific files when you request them

**What Schoolgle CANNOT do:**
- ✗ Modify or delete your files (Viewer access only)
- ✗ Access folders outside the shared folder
- ✗ Share your data with anyone else
- ✗ Access your Google Account or other files

## Security Best Practices

1. **Use Viewer access only**: Schoolgle doesn't need edit permissions
2. **Create a dedicated folder**: Keep personal files separate
3. **Review connected folders regularly**: Disconnect old folders
4. **Check folder contents**: Only upload what you're comfortable sharing

## Need Help?

If you're still having trouble:
1. Double-check the folder is shared as "Anyone with the link"
2. Make sure you copied the FOLDER link (not a file link)
3. Try opening the folder link in an incognito window to verify it works
4. Contact support at support@schoolgle.co.uk

---
**Last Updated**: 2026-03-26
**Version**: 1.0
