@echo off
echo ===================================================
echo [1/3] Installing CP Extension Dependencies...
echo ===================================================

echo.
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install backend dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo Initializing backend database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to initialize backend database.
    pause
    exit /b %errorlevel%
)

echo.
echo Installing frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install frontend dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo Compiling Chrome Extension files...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to compile frontend code.
    pause
    exit /b %errorlevel%
)

cd ..
echo.
echo ===================================================
echo SUCCESS: Installation completed successfully!
echo You can now close this window and run: run_project.bat
echo ===================================================
pause
