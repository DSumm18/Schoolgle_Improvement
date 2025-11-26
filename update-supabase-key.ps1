# Update .env.local with Supabase Service Role Key
$envFile = "c:\Git\Schoolgle_Improvement\.env.local"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA"

# Read existing content
$content = Get-Content $envFile -Raw

# Check if SUPABASE_SERVICE_ROLE_KEY already exists
if ($content -match "SUPABASE_SERVICE_ROLE_KEY=") {
    # Replace existing key
    $content = $content -replace "SUPABASE_SERVICE_ROLE_KEY=.*", "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"
    Write-Host "Updated existing SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
}
else {
    # Add new key
    $content = $content.TrimEnd() + "`nSUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey`n"
    Write-Host "Added SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
}

# Write back to file
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "`nDone! Your .env.local has been updated." -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your dev server (Ctrl+C, then 'npm run dev')" -ForegroundColor White
Write-Host "2. Refresh your browser" -ForegroundColor White
Write-Host "3. Try scanning your folder again!" -ForegroundColor White
