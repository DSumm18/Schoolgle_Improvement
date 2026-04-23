@echo off
REM ============================================
REM Schoolgle Environment File Editor
REM ============================================
REM
REM This script opens .env.local for editing
REM Your keys are SAFE - this file is gitignored
REM ============================================

echo 🔒 Opening .env.local file for editing...
echo 📝 This file is PROTECTED by .gitignore
echo 🔑 Your API keys will NEVER be committed to GitHub
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ Error: .env.local file not found!
    echo    Please run this from the Schoolgle_Improvement directory
    pause
    exit /b 1
)

REM Open .env.local in default text editor
start "" ".env.local"

echo ✅ Opening .env.local in your default text editor...
echo.
echo 📋 INSTRUCTIONS:
echo    1. Replace the placeholder values with your actual API keys
echo    2. Save the file (Ctrl+S)
echo    3. Close the text editor
echo    4. Restart the dev server: npm run dev
echo.
echo 🔐 SECURITY REMINDER: Your keys are SAFE from git commits
echo.
pause
