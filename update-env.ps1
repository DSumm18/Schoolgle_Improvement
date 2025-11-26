# Update .env.local with Firebase credentials
$envContent = @"
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCJZSO6Y0ooD7SXPG3XytWE6kEWNKia2eY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=schoolgle.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=schoolgle
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=schoolgle.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=357064477035
NEXT_PUBLIC_FIREBASE_APP_ID=1:357064477035:web:3e13e1bd3e8307b6
OPENAI_API_KEY=your_openai_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key_here
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -Force
Write-Host "✅ .env.local updated successfully!"
Write-Host "Please restart the dev server (Ctrl+C then npm run dev)"
