# run-setup.ps1 - Full setup: install deps, seed DB (if MONGO_URI set), start server in new window, and open browser
# Usage: Right-click -> Run with PowerShell or from PowerShell: ./run-setup.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# Ensure Node is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not in PATH. Install Node.js (https://nodejs.org/) and try again."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm is not available. Ensure Node.js/npm is installed."
  exit 1
}

# Allow script execution if needed
try {
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
} catch {
  # ignore
}

Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm install failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

# Seed database if MONGO_URI present
if ($env:MONGO_URI -or (Test-Path -Path "$scriptDir\.env" -PathType Leaf)) {
  # load .env if exists
  if (Test-Path -Path "$scriptDir\.env") {
    Write-Host "Loading .env"
    Get-Content "$scriptDir\.env" | ForEach-Object {
      if ($_ -match "^\s*([^#=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        # set environment variable for this process
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
      }
    }
  }

  if ($env:MONGO_URI) {
    Write-Host "Seeding database (this will clear existing seeds)..."
    npm run seed
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Seed script failed with exit code $LASTEXITCODE. You can run 'npm run seed' manually after fixing issues."
    }
  } else {
    Write-Host "MONGO_URI not set; skipping seed. Set MONGO_URI in .env to enable seeding."
  }
} else {
  Write-Host "No .env found and MONGO_URI not set; skipping seed."
}

# Start the dev server in a new window
Write-Host "Starting dev server in new window..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$scriptDir' ; npm run dev`""

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Open default browser to the backend root
$port = $env:PORT -or 5000
$uri = "http://localhost:$port/"
Write-Host "Opening $uri in default browser..."
Start-Process $uri

Write-Host "Setup complete. If the server window is not ready, wait a few seconds and refresh the browser."
