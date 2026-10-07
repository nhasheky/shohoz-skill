#requires -Version 5.1
<#
  Shohoz Skill — API deploy to Hostneko (FTP upload + remote runner + PM2 restart).

  Reads machine config from AGENTS.local.md (KEY=VALUE lines). See AGENTS.md §7.

  Usage (from repo root):
    powershell -ExecutionPolicy Bypass -File scripts/deploy-api.ps1
    powershell -ExecutionPolicy Bypass -File scripts/deploy-api.ps1 -SkipBuild
    powershell -ExecutionPolicy Bypass -File scripts/deploy-api.ps1 -NoRestart
    powershell -ExecutionPolicy Bypass -File scripts/deploy-api.ps1 -TestOnly   # upload+extract to scratch, no restart
#>
param(
  [switch]$SkipBuild,
  [switch]$NoRestart,
  [switch]$TestOnly
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $repo 'apps\api'
$distDir = Join-Path $apiDir 'dist'
$agentsLocal = Join-Path $repo 'AGENTS.local.md'

if (-not (Test-Path -LiteralPath $agentsLocal)) {
  throw "AGENTS.local.md not found at $agentsLocal (holds FTP + runner credentials)."
}

$cfg = @{}
foreach ($line in Get-Content -LiteralPath $agentsLocal) {
  if ($line -match '^\s*([A-Z_]+)=(.+?)\s*$') { $cfg[$matches[1]] = $matches[2].Trim() }
}
$required = 'FTP_HOST', 'FTP_USER', 'FTP_PASS', 'FTP_BASE', 'RUNNER_URL', 'RUNNER_HEADER', 'RUNNER_KEY', 'API_DIR', 'API_HEALTH'
foreach ($k in $required) {
  if (-not $cfg.ContainsKey($k)) { throw "Missing config key '$k' in AGENTS.local.md" }
}

function Invoke-Runner([string]$Command) {
  $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Command))
  $cargs = @(
    '-s', '--max-time', '180',
    '-H', "X-Runner-Key: $($cfg['RUNNER_KEY'])",
    '-H', "Host: $($cfg['RUNNER_HEADER'])",
    '--data-urlencode', "b64=$b64",
    $cfg['RUNNER_URL']
  )
  return (& curl.exe @cargs)
}

function Send-FtpFile([string]$LocalPath, [string]$RemotePath) {
  $cred = New-Object System.Net.NetworkCredential($cfg['FTP_USER'], $cfg['FTP_PASS'])
  $uri = "ftp://$($cfg['FTP_HOST'])$RemotePath"
  $req = [System.Net.FtpWebRequest]::Create($uri)
  $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
  $req.Credentials = $cred
  $req.UsePassive = $true
  $req.UseBinary = $true
  $req.KeepAlive = $false
  $bytes = [IO.File]::ReadAllBytes($LocalPath)
  $req.ContentLength = $bytes.Length
  $stream = $req.GetRequestStream()
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Close()
  $resp = $req.GetResponse()
  $resp.Close()
}

# 1. Build
if (-not $SkipBuild) {
  Write-Host '[1/6] npm run build:api ...' -ForegroundColor Cyan
  Push-Location $repo
  npm run build:api
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) { throw "build:api failed (exit $code)" }
}
if (-not (Test-Path -LiteralPath $distDir)) { throw "dist not found: $distDir" }

# 2. Package dist as tar.gz (forward-slash paths; PowerShell's zip writes
#    backslashes on 5.1, which the server-side unzip rejects)
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$zipName = "_deploy.$stamp.tar.gz"
$zipPath = Join-Path $env:TEMP $zipName
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Write-Host '[2/6] Packaging dist ...' -ForegroundColor Cyan
& tar.exe -czf $zipPath -C $distDir .
if ($LASTEXITCODE -ne 0) { throw "tar packaging failed (exit $LASTEXITCODE)" }

# 3. Upload zip (FTP root is the user home, so FTP_BASE is home-relative)
$remoteZip = "$($cfg['FTP_BASE'])/$zipName"
Write-Host "[3/6] Uploading $zipName ($([math]::Round((Get-Item $zipPath).Length/1MB,2)) MB) ..." -ForegroundColor Cyan
Send-FtpFile $zipPath $remoteZip

# 4. Extract on server (backup current dist)
$dir = $cfg['API_DIR']
if ($TestOnly) {
  $prep = "cd '$dir' && rm -rf _deploytest && mkdir -p _deploytest && tar -xzf '$zipName' -C _deploytest && rm -f '$zipName' && echo EXTRACT_OK && ls _deploytest | head"
} else {
  $prep = "cd '$dir' && if [ -d dist ]; then mv dist dist.bak.$stamp; fi && mkdir -p dist && tar -xzf '$zipName' -C dist && rm -f '$zipName' && echo EXTRACT_OK && ls dist | head"
}
Write-Host '[4/6] Extracting on server ...' -ForegroundColor Cyan
$extractOut = (Invoke-Runner $prep | Out-String)
Write-Host $extractOut
if ($extractOut -notmatch 'EXTRACT_OK') { throw "Remote extract failed" }

if ($TestOnly) {
  Write-Host "Test complete. Cleaning scratch dir ..." -ForegroundColor Yellow
  Invoke-Runner "cd '$dir' && rm -rf _deploytest && echo CLEANED" | Write-Host
  Remove-Item -LiteralPath $zipPath -Force
  Write-Host 'TestOnly deploy OK (live dist untouched).' -ForegroundColor Green
  return
}

# 5. Sync Prisma schema + regenerate the client on the server. Schema changes
#    are applied by AUTO_MIGRATIONS at boot, but the generated client must be
#    refreshed or new models are undefined at runtime.
Write-Host '[5/6] Syncing Prisma schema + generating client ...' -ForegroundColor Cyan
$schemaLocal = Join-Path $apiDir 'prisma\schema.prisma'
if (Test-Path -LiteralPath $schemaLocal) {
  Send-FtpFile $schemaLocal "$($cfg['FTP_BASE'])/prisma/schema.prisma"
  $genOut = (Invoke-Runner "cd '$dir' && ./node_modules/.bin/prisma generate" | Out-String)
  Write-Host $genOut
  if ($genOut -notmatch 'Generated Prisma Client') { throw 'Remote prisma generate failed' }
} else {
  Write-Warning "schema.prisma not found at $schemaLocal - skipping client regeneration"
}

# 6. Restart + health
if (-not $NoRestart) {
  Write-Host '[6/6] Restarting PM2 shohoz-api ...' -ForegroundColor Cyan
  Invoke-Runner "cd '$dir' && ./node_modules/.bin/pm2 restart shohoz-api" | Write-Host
}

Start-Sleep -Seconds 3
Write-Host "Health check $($cfg['API_HEALTH']) ..." -ForegroundColor Cyan
$health = (& curl.exe -s --max-time 30 $cfg['API_HEALTH'] | Out-String)
Write-Host $health
if ($health -notmatch '"status":"ok"') {
  Write-Warning "Health check did not return ok. Roll back with:"
  Write-Warning "  runner: cd '$dir' && rm -rf dist && mv dist.bak.$stamp dist && ./node_modules/.bin/pm2 restart shohoz-api"
  throw 'API health check failed after deploy.'
}

Remove-Item -LiteralPath $zipPath -Force
Write-Host "API deploy OK (dist.bak.$stamp kept on server)." -ForegroundColor Green
