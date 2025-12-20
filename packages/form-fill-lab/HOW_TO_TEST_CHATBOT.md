# How to Test the Ed Chatbot & Form Fill

## The Issue

The Ed chatbot/widget is **part of the Chrome extension**, not the test pages. The test pages are just forms - they don't include the chatbot. You need to:

1. **Build the extension**
2. **Load it in Chrome**
3. **The chatbot will appear automatically** on any page (including your test pages)

---

## Step-by-Step: Get the Chatbot Visible

### Step 1: Build the Extension

```bash
# From project root
cd packages/ed-extension
npm install
npm run build
```

This creates the extension files in the `dist` folder (or wherever your build outputs).

### Step 2: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top right)
4. Click **"Load unpacked"**
5. Navigate to `packages/ed-extension` folder
6. Select it and click "Select Folder"

**You should see the Ed extension appear in your extensions list!**

### Step 3: Verify Extension is Active

- The extension should show as "Enabled"
- Check for any errors (red text)
- The extension ID will be shown (you'll need this if there are issues)

### Step 4: See the Chatbot

1. **Go to any webpage** (including your test pages)
2. **Look in the bottom-right corner** - you should see the Ed widget/chatbot
3. It should appear as a floating button or widget

**If you don't see it:**
- Check browser console (F12) for errors
- Look for `[Ed Content]` messages in console
- Verify extension is enabled

---

## Testing Form Fill Feature

Once the chatbot is visible:

### Option A: Through the Chatbot UI

1. Click on the Ed widget (bottom-right)
2. Look for a "Form Fill" option or button
3. Or ask Ed: "Help me fill this form"

### Option B: Direct Trigger (If Implemented)

The form fill might be triggered automatically when a form is detected, or you can trigger it manually:

1. Open browser console (F12)
2. Type:
   ```javascript
   window.dispatchEvent(new CustomEvent('ed:form-fill:open'));
   ```

### Option C: Check Extension Popup

1. Click the extension icon in Chrome toolbar
2. Look for form fill options in the popup

---

## Troubleshooting

### "Extension not loading"
- Check `packages/ed-extension/manifest.json` exists
- Verify build completed successfully
- Check for TypeScript/build errors

### "Chatbot not appearing"
- Check browser console for `[Ed Content]` messages
- Look for errors about `chrome.storage` or API keys
- Verify extension is enabled in `chrome://extensions/`

### "chrome.storage.local is undefined"
- This means extension isn't loaded properly
- Rebuild and reload the extension
- Check manifest.json permissions include "storage"

### "No API keys configured"
- The extension needs API keys to work
- Check extension popup for settings
- Or set in `chrome.storage.local` via console:
  ```javascript
  chrome.storage.local.set({
    ed_config: {
      openRouterApiKey: 'your-key',
      enableAI: true
    }
  });
  ```

---

## Quick Test Checklist

- [ ] Extension built successfully (`npm run build`)
- [ ] Extension loaded in Chrome (`chrome://extensions/`)
- [ ] Extension shows as "Enabled" (no errors)
- [ ] Visit a test page (http://localhost:8080/basic-form.html)
- [ ] Ed widget appears (bottom-right corner)
- [ ] Can click on widget to open chatbot
- [ ] Form fill feature accessible

---

## Alternative: Test Form Fill Directly

If you just want to test the **form fill feature** without the full chatbot:

1. Make sure extension is loaded
2. Go to http://localhost:8080/basic-form.html
3. Open browser console (F12)
4. The form fill dialog should be accessible via the extension's content script

**The form fill is part of the Ed extension, so the extension MUST be loaded for it to work.**

