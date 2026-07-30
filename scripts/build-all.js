const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('==> Building Frontend (Vite + React + TS)...')
const frontendDir = path.join(__dirname, '..', 'Backend', 'frontend')

// Run npm install and npm run build inside Backend/frontend
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' })
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' })

console.log('==> Copying build output to root dist/ directory...')
const srcDist = path.join(frontendDir, 'dist')
const targetDist = path.join(__dirname, '..', 'dist')

if (fs.existsSync(targetDist)) {
  fs.rmSync(targetDist, { recursive: true, force: true })
}

fs.cpSync(srcDist, targetDist, { recursive: true })

console.log('==> Build completed successfully! Production bundle ready in ./dist')
