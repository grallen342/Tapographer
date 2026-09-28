@echo off
REM Double-click to deploy Tapographer (Windows).
cd /d "%~dp0.."
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org, then run this again. & pause & exit /b 1)
node deploy\deploy.mjs %*
pause
