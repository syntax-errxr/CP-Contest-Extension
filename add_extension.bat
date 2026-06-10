@echo off
echo ===================================================
echo [3/3] Adding CP Extension to Google Chrome...
echo ===================================================

set EXTENSION_PATH="%~dp0frontend\dist"

:: Find Google Chrome path in standard directories
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LocalAppData%\Google\Chrome\Application\chrome.exe"
) else (
    echo.
    echo ERROR: Google Chrome was not found in standard directories.
    echo Please open Google Chrome manually and load the unpacked extension from:
    echo %EXTENSION_PATH%
    echo.
    pause
    exit /b 1
)

echo Launching Google Chrome with CP Extension preloaded...
start "" %CHROME_PATH% --load-extension=%EXTENSION_PATH%
echo Extension added successfully!
echo You can pin it from the extensions menu in Chrome toolbar.
timeout /t 5
