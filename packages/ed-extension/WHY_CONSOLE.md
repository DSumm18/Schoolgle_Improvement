# Why Do I Need to Use the Browser Console?

## The Problem Explained

### Why Browser TTS Works (No Setup Needed)
- **Browser TTS** (text-to-speech) is **built into your browser**
- It's free and doesn't need any API keys
- It works automatically - no configuration needed
- That's why it works right away!

### Why Fish Audio Needs Setup
- **Fish Audio** is a **third-party service** (like OpenAI or Google)
- It requires an **API key** to work (like a password)
- The API key is in your `.env.local` file
- But the extension **can't read `.env.local`** (different context)

## Why Can't the Extension Read .env.local?

Think of it like this:

```
┌─────────────────────────────────────┐
│  Next.js App (localhost:3000)      │
│  ✅ Can read .env.local             │
│  ✅ Has access to file system       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Chrome Extension (browser)         │
│  ❌ Cannot read .env.local          │
│  ❌ No file system access           │
│  ✅ Can use chrome.storage.local    │
└─────────────────────────────────────┘
```

They're **completely separate** - like two different apps!

## Why Use Browser Console?

The browser console is the **easiest way** to set `chrome.storage.local` because:
- It's built into Chrome
- You can run JavaScript directly
- No need to build a UI (yet)

## Better Solution: Extension Popup UI

I can create a simple UI in the extension popup where you can:
1. Click the extension icon
2. See a form to paste your API keys
3. Click "Save" - done!

Would you like me to build that? It would be much easier than using the console.

## For Now: Quick Console Method

The console method is just a **one-time setup**. Once you run it:
- Keys are saved in `chrome.storage.local`
- They persist across browser restarts
- You never need to do it again (unless you change keys)

It's like entering your WiFi password once - after that, it just works!

