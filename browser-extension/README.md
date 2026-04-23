# Ed Browser Automation Extension

Chrome extension for Ed's browser automation capability.

## Installation (Development)

1. **Install dependencies:**
   ```bash
   cd browser-extension
   npm install
   ```

2. **Generate icons:**
   The extension needs PNG icons at 16x16, 48x48, and 128x128.

   Option A - Use an online tool:
   - Open [icons.svg](icons.svg) in a browser
   - Save as PNG at each size
   - Name them icon16.png, icon48.png, icon128.png

   Option B - Use ImageMagick:
   ```bash
   magick -background none icons.svg -resize 16x16 icon16.png
   magick -background none icons.svg -resize 48x48 icon48.png
   magick -background none icons.svg -resize 128x128 icon128.png
   ```

   Option C - Use the placeholder script:
   ```bash
   node generate-icons.js
   ```

3. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this directory

## Usage

1. **Start the WebSocket server:**
   ```bash
   npm run server
   ```

2. **Click the extension icon** in Chrome toolbar

3. **Click "Connect"** (default: ws://localhost:8080)

4. **Test commands:**
   - Click "Read Page" to inspect current tab's DOM
   - Click "Screenshot" to capture the page
   - Use the Test section to click/type elements

## WebSocket Protocol

### From Server → Extension:

```json
{
  "id": 123,
  "command": "click",
  "params": {
    "selector": "#submit-button",
    "wait": true
  }
}
```

### Commands:

| Command | Params | Description |
|---------|--------|-------------|
| `ping` | - | Heartbeat check |
| `navigate` | `{url}` | Navigate to URL |
| `read_page` | - | Read DOM structure |
| `click` | `{selector, wait?}` | Click element |
| `type` | `{selector, value, wait?}` | Type into field |
| `select` | `{selector, value, wait?}` | Select dropdown |
| `check` | `{selector, wait?}` | Check checkbox |
| `uncheck` | `{selector, wait?}` | Uncheck checkbox |
| `screenshot` | - | Take screenshot |
| `get_url` | - | Get current URL |

### From Extension → Server:

```json
{
  "type": "response",
  "id": 123,
  "command": "click",
  "result": {
    "success": true,
    "data": {...}
  }
}
```

## File Structure

```
browser-extension/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker (WebSocket client)
├── content.js          # Content script (DOM manipulation)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── server.js           # Test WebSocket server
├── icons.svg           # Icon source
└── README.md           # This file
```

## Next Steps

- [ ] Integrate with Ed's backend (replace standalone server)
- [ ] Add skill file parser
- [ ] Implement RIDDOR skill as reference
- [ ] Add audit logging
- [ ] Add confirmation UI for sensitive actions
