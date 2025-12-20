# Simple Test Instructions

## ✅ Server Should Now Be Running

I've started the server in the background. Try refreshing your browser at:
**http://localhost:8080**

## 🧪 Simple Test (No Extension Needed)

### Step 1: Test the Standalone Page

1. Go to: **http://localhost:8080/standalone-test.html**
2. Fill out the form:
   - First Name: "John"
   - Last Name: "Doe"  
   - Email: "test@example.com"
   - Date: Pick any date
   - Country: Select one
3. Click "Submit Form"
4. You should see a green success message

**If this works, your test pages are ready! ✅**

### Step 2: Test Basic Form

1. Go to: **http://localhost:8080/basic-form.html**
2. Fill it out manually
3. Submit to verify it works

---

## 🔌 Testing WITH Extension (Optional)

The `chrome.storage.local` error you saw means the extension isn't loaded. To test with the extension:

### Option A: Build and Load Extension

1. **Build the extension:**
   ```bash
   cd packages/ed-extension
   npm install
   npm run build
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `packages/ed-extension` folder

3. **Test:**
   - Go to http://localhost:8080/basic-form.html
   - Extension should auto-inject
   - Look for Ed widget or form fill trigger

### Option B: Test Without Extension (Recommended for Now)

Just use the standalone test page above - it doesn't need the extension and will verify your test pages work correctly.

---

## 🐛 If Server Still Not Running

If you still see "ERR_CONNECTION_REFUSED":

1. **Check if server is running:**
   ```bash
   # In a new terminal
   cd packages/form-fill-lab
   npx http-server . -p 8080 -c-1
   ```

2. **Or use a different port:**
   ```bash
   npx http-server . -p 8081 -c-1
   ```
   Then go to http://localhost:8081

---

## 📝 Next Steps

Once the standalone test works:
1. ✅ Test pages are ready
2. ✅ You can test forms manually
3. ✅ You can build/load extension for full testing
4. ✅ You can run Playwright automated tests

**Start with the standalone test - it's the simplest!**

