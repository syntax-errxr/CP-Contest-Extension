@echo off
echo ===================================================
echo [1/1] Removing CP Extension Backend from Windows Startup...
echo ===================================================
echo.

set STARTUP_FOLDER="%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

if exist %STARTUP_FOLDER%\CP_Extension_Backend.lnk (
    del %STARTUP_FOLDER%\CP_Extension_Backend.lnk
    echo.
    echo SUCCESS: CP Extension Backend has been removed from Windows Startup.
    echo It will no longer start automatically when you boot Windows.
) else (
    echo.
    echo INFO: CP Extension Backend was not registered in Windows Startup.
    echo Nothing to remove.
)

echo.
pause
