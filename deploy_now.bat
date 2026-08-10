@echo off
setlocal
cd /d "%~dp0"
title Deploy EduBridge to GitHub and Vercel

echo ======================================================================
echo   EDUBRIDGE - PUSH TO GITHUB ^& TRIGGER VERCEL PRODUCTION DEPLOYMENT
echo ======================================================================
echo.

:: Ensure git config is set
git config user.name "zeerocodez"
git config user.email "nuel@zeerocodes.com"
git config --global --add safe.directory "%~dp0."

echo [*] Staging all files...
git add .
git commit -m "fix: resolve teacher onboarding registration stall and optimize auth flow" 2>nul

echo.
echo [*] Pushing to https://github.com/zeerocodez/teacher.git (main)...
git remote set-url origin https://github.com/zeerocodez/teacher.git 2>nul
git branch -M main
git push -u origin main

echo.
echo ======================================================================
echo   DEPLOYMENT PUSH COMPLETED!
echo   Check your Vercel Dashboard - the live site build will start automatically.
echo ======================================================================
pause
