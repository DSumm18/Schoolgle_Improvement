# Update .env.local with Supabase Service Role Key
$envFile = ".env.local"
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $serviceRoleKey) {
    throw "Set SUPABASE_SERVICE_ROLE_KEY in your shell before running this local helper."
}

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
