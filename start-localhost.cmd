@echo off
setlocal
cd /d "%~dp0"

echo [INFO] Starting local static server from "%CD%"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not on PATH.
  echo [ERROR] Install Node.js LTS from https://nodejs.org/ then re-run this file.
  echo.
  pause
  exit /b 1
)

node "%~dp0server.js"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo [ERROR] server.js exited with code %EXIT_CODE%.
) else (
  echo [INFO] server.js exited cleanly.
)

echo.
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
