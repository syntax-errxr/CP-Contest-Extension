@echo off
echo ===================================================
echo [2/3] Starting CP Extension Backend Server...
echo ===================================================

cd /d "%~dp0\backend"
echo Starting local Express server...
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start the server. Make sure database is initialized.
    pause
    exit /b %errorlevel%
)
