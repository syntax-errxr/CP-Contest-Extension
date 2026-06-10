@echo off
echo ===================================================
echo [1/1] Enrolling CP Extension Backend in Windows Startup...
echo ===================================================
echo.

set STARTUP_FOLDER="%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set SCRIPT_PATH="%~dp0run_invisible.vbs"

echo Registering CP Extension in startup folder...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTUP_FOLDER%\CP_Extension_Backend.lnk'); $Shortcut.TargetPath = '%SCRIPT_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to register startup shortcut.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo SUCCESS: CP Extension Backend will now automatically
echo start silently in the background when you boot Windows!
echo.
echo You can run it manually right now by launching:
echo run_invisible.vbs
echo ===================================================
pause
