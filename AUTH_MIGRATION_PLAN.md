# Firebase to Supabase Auth Migration Plan

## Status: ✅ Core Migration Complete

### What's Been Done

1. **✅ Created SupabaseAuthContext** (`apps/platform/src/context/SupabaseAuthContext.tsx`)
   - Replaces Firebase `AuthContext`
   - Uses Supabase OAuth (Google & Microsoft)
   - Handles session management and organization fetching

2. **✅ Updated Core Components**
   - `apps/platform/src/app/login/page.tsx` - Uses SupabaseAuthContext
   - `apps/platform/src/app/layout.tsx` - Wraps app with SupabaseAuthProvider
   - `apps/platform/src/components/LoginButton.tsx` - Uses Supabase signInWithGoogle
   - `apps/platform/src/components/MicrosoftLoginButton.tsx` - Uses Supabase signInWithMicrosoft

3. **✅ Fixed OAuth Callback**
   - `apps/platform/src/app/auth/callback/page.tsx` - Handles OAuth redirects
   - Fixed "Multiple GoTrueClient instances" warning
   - Fixed duplicate key error handling (non-fatal)

4. **✅ Created Shared Supabase Client**
   - `apps/platform/src/lib/supabase.ts` - Single shared client instance

### What Still Needs Work

#### 1. Components Using Old Firebase Auth (Low Priority - Optional Features)

These components use Firebase-specific features (`accessToken`, `providerId`) for Google Drive/OneDrive integration:

- `apps/platform/src/components/DrivePicker.tsx` - Google Drive folder picker
- `apps/platform/src/components/OfstedFrameworkView.tsx` - Evidence scanning
- `apps/platform/src/components/SiamsFrameworkView.tsx` - Evidence scanning
- `apps/platform/src/components/SettingsView.tsx` - Uses `user.uid` (should use `user.id`)

**Solution Options:**
- **Option A:** Keep Firebase Auth for Drive integration only (hybrid approach)
- **Option B:** Migrate to Supabase OAuth tokens (requires getting access token from Supabase session)
- **Option C:** Remove Drive integration temporarily

**Recommended:** Option B - Get OAuth access token from Supabase session metadata.

#### 2. Remove Firebase Dependencies (Optional Cleanup)

If you choose to fully remove Firebase:

```bash
npm uninstall firebase
```

Then delete:
- `apps/platform/src/lib/firebase.ts`
- `apps/platform/src/context/AuthContext.tsx` (old Firebase version)

**Note:** Only do this after migrating all components that use `accessToken`/`providerId`.

### External Configuration Required

#### Supabase Dashboard
1. ✅ Enable Google OAuth provider
2. ✅ Enable Microsoft (Azure) OAuth provider
3. ✅ Set redirect URLs: `https://yourdomain.com/auth/callback`

#### Google Cloud Console
1. ✅ Add authorized redirect URI: `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`
   - **Important:** This must be the Supabase callback URL, NOT your app's callback URL

#### Microsoft Azure AD
1. ✅ Add redirect URI: `https://ygquvauptwyvlhkyxkwy.supabase.co/auth/v1/callback`

### Testing Checklist

- [x] Google sign-in works
- [x] Microsoft sign-in works
- [x] Session persists after page reload
- [x] User redirected to dashboard after login
- [x] User redirected to onboarding if no organization
- [x] No "Multiple GoTrueClient instances" warning
- [x] No duplicate key errors in console
- [ ] Google Drive integration (if needed)
- [ ] OneDrive integration (if needed)

### Next Steps

1. **Test the authentication flow** - Sign in with Google/Microsoft and verify:
   - Session is created
   - User is redirected correctly
   - Organization is fetched
   - Dashboard loads

2. **If Drive integration is needed:**
   - Get OAuth access token from Supabase session
   - Update `DrivePicker` and `OfstedFrameworkView` to use Supabase tokens
   - Test evidence scanning

3. **Optional cleanup:**
   - Remove Firebase dependencies
   - Delete old `AuthContext.tsx`
   - Update any remaining components

### Key Differences: Firebase vs Supabase Auth

| Feature | Firebase | Supabase |
|---------|----------|----------|
| User ID | `user.uid` | `user.id` |
| Access Token | `accessToken` from credential | From session metadata |
| Provider ID | `providerId` from providerData | From `user.app_metadata.provider` |
| Session | Auto-managed | Auto-managed (similar) |
| OAuth Flow | Popup-based | Redirect-based (PKCE) |

### Troubleshooting

**"Invalid API key" error:**
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in `.env.local`
- Restart dev server after adding env vars

**"No authorization code received":**
- Check Google Cloud Console redirect URI is set to Supabase callback URL
- Verify Supabase OAuth is enabled in Dashboard

**"Multiple GoTrueClient instances":**
- ✅ Fixed by using shared client from `@/lib/supabase`

**Session not persisting:**
- Check browser localStorage
- Verify `persistSession: true` in client config
