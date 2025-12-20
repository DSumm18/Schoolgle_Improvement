# Fish Audio Integration Fix

## Issue Summary
The Ed chatbot was using Google Text-to-Speech (browser TTS) instead of Fish Audio, even though Fish Audio was intended to be the primary voice provider.

## Root Causes
1. **Missing API Key Configuration**: The `EdWidgetWrapper` component was not passing the Fish Audio API key to the Ed widget configuration, causing it to fall back to browser TTS.
2. **Proxy Authentication**: The Fish Audio client was sending an Authorization header even when using the proxy, which could cause conflicts (though the proxy ignores it).

## Fixes Applied

### 1. Updated `EdWidgetWrapper.tsx`
- Added `fishAudioApiKey` to the Ed widget configuration
- Uses `NEXT_PUBLIC_FISH_AUDIO_API_KEY` environment variable if available
- Falls back to `'proxy-enabled'` placeholder when using the proxy (which handles authentication server-side)
- Added logging to verify Fish Audio initialization

### 2. Updated Fish Audio API Route (`apps/platform/src/app/api/fish-audio/route.ts`)
- Changed from hardcoded API key to environment variable (`FISH_AUDIO_API_KEY`)
- Falls back to hardcoded key for development (should be moved to `.env.local` in production)
- Added better logging for debugging

### 3. Updated Fish Audio Client (`packages/ed-widget/src/voice/fish-audio.ts`)
- Modified to NOT send Authorization header when using proxy (`/api/fish-audio`)
- Only sends Authorization header for direct API calls (when `baseUrl` doesn't start with `/api/`)
- This prevents conflicts since the proxy handles authentication server-side

## Environment Variables Required

### For Development/Production
Add to `apps/platform/.env.local`:
```env
# Fish Audio API Key (get from https://fish.audio dashboard)
FISH_AUDIO_API_KEY=your_api_key_here

# Optional: If you want to pass the key to the client (not recommended for security)
# NEXT_PUBLIC_FISH_AUDIO_API_KEY=your_api_key_here
```

**Note**: The `FISH_AUDIO_API_KEY` is server-side only and should NOT be prefixed with `NEXT_PUBLIC_` for security. The proxy handles authentication.

## How It Works Now

1. **Ed Widget Initialization**:
   - `EdWidgetWrapper` passes `fishAudioApiKey: 'proxy-enabled'` (or from env var) to Ed widget
   - Ed widget initializes `FishAudioVoice` with this key
   - Fish Audio client is configured to use `/api/fish-audio` proxy

2. **Voice Requests**:
   - User interacts with Ed chatbot
   - Ed widget calls `fishVoice.speakAndPlay()`
   - Fish Audio client makes POST request to `/api/fish-audio` (no Authorization header)
   - Next.js API route receives request, adds server-side API key, forwards to `https://api.fish.audio/v1/tts`
   - Fish Audio API returns audio blob
   - Proxy returns blob to client
   - Ed widget plays audio

3. **Fallback Behavior**:
   - If Fish Audio API key is not configured, Ed widget falls back to browser TTS
   - Console warnings indicate when fallback is used

## Testing

1. **Verify Fish Audio is Initialized**:
   - Open browser console
   - Look for: `[Ed] ✅ Fish Audio voice initialized`
   - Should NOT see: `[Ed] ⚠️ Fish Audio API key not set. Using browser TTS fallback.`

2. **Test Voice Output**:
   - Open Ed chatbot
   - Ask a question or wait for greeting
   - Should hear Fish Audio voice (not browser TTS)
   - Check console for: `[Ed] Using Fish Audio for greeting` or `[Ed] Using Fish Audio for response`

3. **Check Proxy Logs**:
   - Server console should show: `[Fish Audio Proxy] Forwarding request to Fish Audio`
   - Should NOT see 401/402 errors (which indicate API key issues)

## Troubleshooting

### Issue: Still using browser TTS
- **Check**: Browser console for `[Ed] ⚠️ Fish Audio API key not set`
- **Fix**: Ensure `EdWidgetWrapper` is passing `fishAudioApiKey` in config
- **Verify**: `fishAudioApiKey` is not empty string

### Issue: 401/402 errors from Fish Audio API
- **Check**: Server console for `[Fish Audio Proxy] ❌ API Error: 401` or `402`
- **Fix**: Verify `FISH_AUDIO_API_KEY` is set in `.env.local` and restart server
- **Verify**: API key is valid and account has credits

### Issue: CORS errors
- **Check**: Browser console for CORS-related errors
- **Fix**: Ensure requests go through `/api/fish-audio` proxy (not direct to `api.fish.audio`)
- **Verify**: Fish Audio client `baseUrl` is `/api/fish-audio`

## Next Steps

1. **Move API Key to Environment Variable**:
   - Remove hardcoded API key from `apps/platform/src/app/api/fish-audio/route.ts`
   - Add `FISH_AUDIO_API_KEY` to `.env.local`
   - Restart development server

2. **Optional: Voice ID Configuration**:
   - If using cloned voices, configure voice IDs in `EdWidgetWrapper`:
   ```typescript
   fishAudioVoiceIds: {
     ed: 'voice-id-here',
     edwina: 'voice-id-here',
     // etc.
   }
   ```

3. **Production Deployment**:
   - Set `FISH_AUDIO_API_KEY` as environment variable in production
   - Do NOT commit API keys to version control
   - Use secure secret management (e.g., Vercel Environment Variables, AWS Secrets Manager)

## Files Modified

1. `apps/platform/src/components/EdWidgetWrapper.tsx` - Added Fish Audio API key configuration
2. `apps/platform/src/app/api/fish-audio/route.ts` - Updated to use environment variable
3. `packages/ed-widget/src/voice/fish-audio.ts` - Fixed proxy authentication handling

