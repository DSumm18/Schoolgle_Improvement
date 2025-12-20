# Debugging Ed Extension - Real Widget Not Loading

## Quick Check

1. **Open browser console** (F12) on any page
2. **Look for these messages:**
   - `[Ed Content] Initializing on: ...`
   - `[Ed Real Widget] Starting initialization...`
   - `[Ed Real Widget] ✅ WebGL available` (or ❌ if not)
   - `[Ed Real Widget] ✅ Access granted` (or ❌ if not)
   - `[Ed Real Widget] Loading bundle from: chrome-extension://...`

## Common Issues

### 1. Widget Bundle Not Found

**Error:** `Failed to load Ed widget bundle from chrome-extension://...`

**Fix:**
1. Check if bundle exists: `packages/ed-extension/dist/ed-widget/ed-widget.iife.js`
2. Rebuild widget: `cd packages/ed-widget && npm run build`
3. Rebuild extension: `cd packages/ed-extension && npm run build`
4. Reload extension in Chrome

### 2. WebGL Not Available

**Error:** `❌ WebGL not available`

**Fix:**
- Check `chrome://gpu` - should show "WebGL: Hardware accelerated"
- If not, update graphics drivers
- Or test on a different browser/device

### 3. Access Denied

**Error:** `❌ No access: Not authenticated` or `No active subscription`

**Fix:**
1. Log in to Schoolgle website
2. Start a trial: `/dashboard/account/trial`
3. Extension should detect auth token automatically
4. If not, check extension storage: `chrome.storage.local.get('ed_auth_token')`

### 4. Widget Loads But Shows CSS Orb

**Check console for:**
- `[Ed Real Widget] ✅ Widget bundle loaded`
- `[Ed Real Widget] ✅ EdWidget found on window`
- `[Ed Real Widget] Initialized successfully`

If you see these but still get CSS orb, the widget might be initializing but not rendering. Check for errors after initialization.

## Manual Debug Steps

1. **Check extension files:**
   ```bash
   # Should exist:
   packages/ed-extension/dist/ed-widget/ed-widget.iife.js
   packages/ed-extension/dist/ed-widget/ed-widget.css
   ```

2. **Check manifest:**
   - Open `packages/ed-extension/dist/manifest.json`
   - Look for `web_accessible_resources` with `ed-widget/ed-widget.iife.js`

3. **Test bundle URL:**
   - In Chrome: `chrome-extension://YOUR_EXT_ID/ed-widget/ed-widget.iife.js`
   - Should load the JavaScript file (not 404)

4. **Check console errors:**
   - Look for red errors in console
   - Common: CORS, module not found, undefined variables

## What You Should See

**If working correctly:**
- Console: `[Ed Real Widget] Initialized successfully`
- Page: 3D green particle orb (not CSS orb)
- Orb morphs/shapes when tool detected
- Voice button works (if API keys set)

**If falling back:**
- Console: `[Ed Content] Falling back to CSS widget`
- Page: CSS orb (simpler, no 3D effect)
- Still functional but not the real widget


