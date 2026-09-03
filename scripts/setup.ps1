$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location "$Root\backend"
python -m venv .venv
& ".\.venv\Scripts\python.exe" -m pip install -e ".[dev]"
Set-Location "$Root\frontend"
npm install
Write-Host "Setup complete. Copy .env.example to .env, then run scripts\dev.ps1."

