# run-dev.ps1 - helper to install deps, start dev server, and open browser
# Usage: Right-click -> Run with PowerShell or from PowerShell: ./run-dev.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# Check for node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not in PATH. Install Node.js (https://nodejs.org/) and try again."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm is not available. Ensure Node.js/npm is installed."
  exit 1
}

Write-Host "Installing dependencies..."
npm install

# Start the dev server in a new window so this script can continue to open browser
$port = $env:PORT -or 5005
Write-Host "Starting dev server (npm run dev) in new window..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$scriptDir' ; npm run dev`""

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Open default browser to the backend root (uses start to open default browser)
$uri = "http://localhost:$port/"
Write-Host "Opening $uri in default browser..."
Start-Process $uri

Write-Host "Done. If the server window is not ready, wait a few seconds and refresh the browser."
