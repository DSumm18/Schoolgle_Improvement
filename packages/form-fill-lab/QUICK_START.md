# Quick Start - Testing Form Fill

## Simplest Test (No Extension Needed)

### Step 1: Install Dependencies

**Option A: From Root (Recommended)**
```bash
# From project root
npm install
```

**Option B: Direct Install**
```bash
cd packages/form-fill-lab
npm install http-server --save-dev
```

### Step 2: Start the Server

```bash
cd packages/form-fill-lab
npx http-server . -p 8080 -c-1
```

Or if you installed globally:
```bash
http-server . -p 8080 -c-1
```

### Step 3: Open in Browser

Open your browser and go to:
- **http://localhost:8080** - See all test pages
- **http://localhost:8080/basic-form.html** - Test basic form

### Step 4: Manual Test

1. Open http://localhost:8080/basic-form.html
2. Open browser console (F12)
3. Try filling the form manually to verify it works
4. Check console for any errors

---

## Test with Extension (If You Want Full Integration)

### Build Extension First

```bash
# From project root
cd packages/ed-extension
npm install
npm run build
```

### Load in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle top right)
4. Click "Load unpacked"
5. Navigate to `packages/ed-extension` folder
6. Select it

### Test on Local Page

1. Make sure server is running (Step 2 above)
2. Open http://localhost:8080/basic-form.html
3. Extension should auto-inject
4. Look for Ed widget or form fill trigger

**Note:** The extension needs API keys configured. You may need to:
- Open extension popup
- Configure API keys in settings
- Or set them in `chrome.storage.local` via console

---

## Suggested First Test

**Goal:** Verify test pages work

1. Start server: `npx http-server . -p 8080 -c-1` (in form-fill-lab folder)
2. Open http://localhost:8080/basic-form.html
3. Fill form manually:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "test@example.com"
   - Date: Pick any date
   - Country: Select one
4. Click Submit
5. Verify form works (shows "Form submitted" message)

**If this works, the test pages are ready!**

Next, you can:
- Test with extension (if built)
- Run Playwright tests (if you want automated testing)
- Try other test pages (typeahead, sensitive fields, etc.)

---

## Troubleshooting

**Port 8080 in use?**
```bash
# Use different port
npx http-server . -p 8081 -c-1
```

**npm install fails?**
```bash
# Try from root
cd C:\Git\Schoolgle_Improvement
npm install
```

**Extension not working?**
- Check `chrome://extensions/` - is extension enabled?
- Check browser console for errors
- Verify extension built successfully

