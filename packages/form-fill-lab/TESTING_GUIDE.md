# Form Fill Testing Guide

## Quick Start - Manual Testing (No Extension Needed)

### Step 1: Start the Test Server

```bash
cd packages/form-fill-lab
npm install
npm run serve
```

This starts a local server at **http://localhost:8080**

### Step 2: Open Test Pages

Open your browser and go to:
- **http://localhost:8080** - Test page index
- **http://localhost:8080/basic-form.html** - Basic form test

### Step 3: Manual Test (Without Extension)

For now, you can manually test the form pages to see they work. The extension integration will come next.

**Suggested First Test:**
1. Open http://localhost:8080/basic-form.html
2. Manually fill the form to verify it works
3. Check browser console for any errors

---

## Full Testing with Extension

### Option A: Quick Test (Mock Extension)

The Playwright tests use a mock extension. Run:

```bash
cd packages/form-fill-lab
npm install
npx playwright install chromium
npm run test:headed
```

This will:
- Start the server automatically
- Open a browser window
- Run automated tests
- Show you what's happening

### Option B: Real Extension Testing

To test with the actual Chrome extension:

#### 1. Build the Extension

```bash
# From project root
cd packages/ed-extension
npm install
npm run build
```

#### 2. Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `packages/ed-extension` directory (or `dist` folder if build outputs there)

#### 3. Test on Local Pages

1. Make sure test server is running: `cd packages/form-fill-lab && npm run serve`
2. Open http://localhost:8080/basic-form.html
3. The extension should inject automatically
4. Look for Ed widget or form fill trigger

**Note:** The extension needs to be configured with API keys. Check `chrome.storage.local` for `ed_config`.

---

## Recommended First Test

### Test 1: Basic Form Fill Flow

**Goal:** Verify the form fill dialog appears and works

**Steps:**
1. Start server: `cd packages/form-fill-lab && npm run serve`
2. Open http://localhost:8080/basic-form.html
3. Open browser console (F12)
4. Manually trigger form fill (if extension is loaded):
   ```javascript
   // In browser console
   window.dispatchEvent(new CustomEvent('ed:form-fill:open'));
   ```
5. Or use the extension UI if available

**Expected:**
- Form fill dialog appears
- Shows "Intent: Review Fill Plan" stage
- Form scanning completes
- Shows input step

**If it doesn't work:**
- Check console for errors
- Verify extension is loaded
- Check that API keys are configured

---

## Troubleshooting

### Server won't start
```bash
# Check if port 8080 is in use
# Or change port in package.json: "serve": "http-server . -p 8081 -c-1"
```

### Extension not loading
- Check `chrome://extensions/` - is it enabled?
- Check console for errors
- Verify manifest.json is valid

### Form fill dialog not appearing
- Check browser console for errors
- Verify extension content script is injected
- Check that form-fill-ui.tsx is bundled in extension

---

## Next Steps

Once basic testing works:
1. Test pause/resume functionality
2. Test step mode
3. Test sensitive fields (sensitive-form.html)
4. Test typeahead (typeahead-form.html)
5. Test re-render detection (spa-form.html)

