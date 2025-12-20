# Installing the Ed Extension

## Step 1: Build the Extension

```bash
# From the repo root
cd packages/ed-widget
npm run build

cd ../ed-extension
npm run build
```

## Step 2: Remove Old Extension (if installed)

1. Open Chrome: `chrome://extensions`
2. Find "Ed - School Tools Assistant"
3. Click **Remove** (trash icon)
4. Confirm removal

## Step 3: Load New Extension

1. In `chrome://extensions`, enable **Developer mode** (toggle top-right)
2. Click **Load unpacked**
3. Navigate to and select:
   ```
   C:\Git\Schoolgle_Improvement\packages\ed-extension\dist
   ```
4. Extension should appear in your list

## Step 4: Verify Installation

1. Navigate to any website (e.g., `https://www.canva.com`)
2. You should see:
   - **If logged in + subscribed**: Real Ed orb (3D particle sphere) in bottom-right
   - **If not logged in**: Access prompt asking you to log in
   - **If no subscription**: Upgrade prompt

## Troubleshooting

### Extension doesn't load
- Check `dist` folder exists and has files
- Check browser console for errors: `chrome://extensions` → Click "Errors" link

### Widget doesn't appear
- Open browser console (F12) on any page
- Look for `[Ed Content]` or `[Ed Real Widget]` messages
- Check if auth token exists: Extension popup → Check storage

### Build fails
- Make sure you're in the right directory
- Run `npm install` in both `packages/ed-widget` and `packages/ed-extension`
- Check Node.js version (should be 18+)


