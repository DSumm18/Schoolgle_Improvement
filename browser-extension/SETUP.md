# Ed Browser Extension - Setup Guide

**Follow these steps to get Ed's browser automation running.**

---

## STEP 1: Run the Setup File

1. Open the `browser-extension` folder
2. Double-click **`setup.bat`**
3. A black command window will open

You'll see text scrolling by. Wait until you see:

```
============================================
  Server is running! Leave this window open.
============================================
```

**IMPORTANT:** Leave this black window OPEN. The server only runs while this window is open.

---

## STEP 2: Open Chrome Extensions Page

1. Open Google Chrome
2. Click the address bar at the top (where you type websites)
3. Type: `chrome://extensions`
4. Press Enter

**What you should see:** A page with all your Chrome extensions listed (or empty if you have none)

---

## STEP 3: Turn On Developer Mode

Look at the **top-right corner** of the extensions page.

**Before:** You'll see a toggle switch that says "Developer mode" and it's OFF (gray)

**Action:** Click the toggle to turn it **ON** (blue)

**What changes:** A new row of buttons appears at the top-left: "Load unpacked", "Pack extension", "Update"

---

## STEP 4: Load the Extension

1. Click the **"Load unpacked"** button (top-left, first button)
2. A folder selection window will pop up
3. Navigate to and select the **`browser-extension` folder** (the same folder with setup.bat)
4. Click "Select Folder"

**What happens:** The extension appears in your extensions list with the name "Ed Browser Automation"

---

## STEP 5: Pin the Extension

1. Look at Chrome's toolbar (top-right, next to your profile picture)
2. Click the **puzzle piece icon** (Extensions)
3. Find "Ed Browser Automation" in the list
4. Click the **pin icon** next to it

**What happens:** The purple "E" icon now appears in your toolbar permanently

---

## STEP 6: Connect Ed

1. Click the **purple "E" icon** in your toolbar
2. A small popup window opens
3. You should see:
   - Status: "Disconnected" (red dot)
   - A box saying "ws://localhost:8080"
   - A "Connect" button
4. Click **"Connect"**

**What you should see:**
- The dot turns **green** and starts pulsing
- Status says: "Connected to ws://localhost:8080"

---

## STEP 7: Test It Works

1. Open any website (for example, google.com)
2. Click the purple "E" icon
3. Click **"Read Page"**

**What should happen:** The extension successfully reads the page. (In the full version, you'd see the page data back in the Schoolgle dashboard.)

---

## Troubleshooting

### "npm: command not found"
**Problem:** Node.js isn't installed on your computer.

**Fix:**
1. Go to https://nodejs.org/
2. Click the green "Download" button
3. Run the installer (use all default settings)
4. Restart your computer
5. Try setup.bat again

### "Load unpacked button is missing"
**Problem:** Developer mode isn't turned on.

**Fix:** Look at the top-right of the chrome://extensions page. Find the "Developer mode" toggle and click it to ON (blue).

### Extension shows "Errors"
**Problem:** Missing icon files.

**Fix:** Make sure you ran setup.bat completely and saw the "Server is running" message.

### Can't click buttons on certain sites
**Problem:** Some websites (like Chrome settings, banking sites) block extensions.

**Fix:** This is normal. Test on a regular website like google.com or wikipedia.org.

### "Disconnected" won't go away
**Problem:** The server window (black window from setup.bat) got closed.

**Fix:**
1. Double-click setup.bat again
2. Wait for "Server is running"
3. Click Connect in the extension popup

---

## Quick Reference Card

| What | Where |
|------|-------|
| **Start the server** | Double-click `setup.bat` and leave it open |
| **Open extensions** | Type `chrome://extensions` in Chrome |
| **Turn on dev mode** | Toggle at top-right of extensions page |
| **Load extension** | Click "Load unpacked" → select browser-extension folder |
| **Connect Ed** | Click purple "E" → click "Connect" |

---

## Stopping the Server

When you're done:

1. Go to the black command window (setup.bat)
2. Press `Ctrl + C` on your keyboard
3. The window will ask "Terminate batch job? Press Y"
4. Press `Y`

Or just close the black window — that works too.

---

## Need Help?

If something isn't working and this guide didn't cover it:

1. Take a screenshot of what you see
2. Note which step you're on (Step 1, 2, 3, etc.)
3. Share the screenshot and describe what's wrong
