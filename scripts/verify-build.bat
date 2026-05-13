@echo off
REM Build verification script for Windows CI/CD pipeline

echo ================================
echo Build Verification Script
echo ================================
echo.

REM Check Node version
echo Checking Node.js version...
node -v
if %errorlevel% neq 0 exit /b %errorlevel%
echo OK: Node.js is installed
echo.

REM Check npm version
echo Checking npm version...
npm -v
if %errorlevel% neq 0 exit /b %errorlevel%
echo OK: npm is installed
echo.

REM Set CI environment variables
set CI=true
set GENERATE_SOURCEMAP=false
set REACT_APP_API_URL=/api
set SKIP_PREFLIGHT_CHECK=true

echo Environment variables:
echo   CI: %CI%
echo   GENERATE_SOURCEMAP: %GENERATE_SOURCEMAP%
echo   REACT_APP_API_URL: %REACT_APP_API_URL%
echo.

REM Install dependencies
echo Installing dependencies...
call npm ci --prefer-offline --no-audit
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    exit /b %errorlevel%
)
echo OK: Dependencies installed
echo.

REM Run build
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b %errorlevel%
)
echo OK: Build completed successfully
echo.

REM Verify build output
echo Verifying build output...

if not exist "build\" (
    echo ERROR: Build directory not found
    exit /b 1
)

if not exist "build\index.html" (
    echo ERROR: index.html not found in build directory
    exit /b 1
)

if not exist "build\static\" (
    echo ERROR: Static directory not found in build
    exit /b 1
)

echo OK: All build artifacts verified
echo.

REM List build contents
echo Build directory structure:
dir build /s
echo.

echo ================================
echo Build verification completed!
echo ================================
