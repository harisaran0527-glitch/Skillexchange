@echo off
setlocal

REM Ensure Node.js is available in PATH if installed in common locations
if not defined PATH (
  set "PATH=%PATH%"
)
if not exist "%ProgramFiles%\nodejs\node.exe" if not exist "%ProgramFiles(x86)%\nodejs\node.exe" (
  echo Node.js was not found in the default installation paths.
  echo Please install Node.js LTS from https://nodejs.org/ and then run this script again.
  pause
  exit /b 1
)

if exist "%ProgramFiles%\nodejs\node.exe" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
  set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
)

cd /d "%~dp0"
echo Installing frontend dependencies...
call npm installnif errorlevel 1 (
  echo.
  echo npm install failed. Please check the output for errors.
  pause
  exit /b 1
)
echo.
echo Starting SkillSwap frontend in development mode...
call npm run dev
exit /b 0
