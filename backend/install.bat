@echo off
REM Installation script for CivixAI Backend (Windows)

echo.
echo CivixAI Backend Installation
echo ============================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo npm version:
npm --version

echo.
echo Installing dependencies...
cd backend
call npm install

if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully!
echo.
echo Next steps:
echo 1. Create a .env file in the backend folder
echo 2. Copy credentials from Firebase service account
echo 3. Run: npm start
echo.
echo See backend\SETUP_GUIDE.md for detailed instructions
echo.
pause
