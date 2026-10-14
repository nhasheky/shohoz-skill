param(
  [switch]$SkipBuild,
  [switch]$SchemaOnly,
  [switch]$Install
)

$ErrorActionPreference = 'Stop'

$root  = Split-Path -Parent $PSScriptRoot
$local = Join-Path $root 'AGENTS.local.md'

if (-not (Test-Path $local)) { throw "AGENTS.local.md not found at $local" }

$cfg = @{}
foreach ($line in Get-Content $local) {
  if ($line -match '^\s*([A-Z_]+)=(.*)$') { $cfg[$Matches[1]] = $Matches[2].Trim() }
}

foreach ($key in 'RUNNER_URL', 'RUNNER_KEY', 'RUNNER_HEADER', 'UPLOAD_URL', 'API_DIR', 'API_HEALTH') {
  if (-not $cfg[$key]) { throw "AGENTS.local.md is missing $key" }
}

$apiDir    = Join-Path $root 'apps\api'
$distDir   = Join-Path $apiDir 'dist'
$schema    = Join-Path $apiDir 'prisma\schema.prisma'
$apiRemote = $cfg.API_DIR -replace '^/home/shohozsk1/', ''
$stamp     = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Run-Remote([string]$Cmd) {
  $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Cmd))
  curl.exe -sk -H "X-Runner-Key: $($cfg.RUNNER_KEY)" -H "Host: $($cfg.RUNNER_HEADER)" --data-urlencode "b64=$b64" $cfg.RUNNER_URL
  if ($LASTEXITCODE -ne 0) { throw "runner call failed ($LASTEXITCODE)" }
}

function Send-File([string]$LocalPath, [string]$RemoteRel) {
  $out = curl.exe -sk -H "X-Runner-Key: $($cfg.RUNNER_KEY)" -H "Host: $($cfg.RUNNER_HEADER)" -F "dest=$RemoteRel" -F "file=@$LocalPath" $cfg.UPLOAD_URL
  $out | Write-Host
  if ($out -notmatch '^OK ') { throw "upload failed for $RemoteRel" }
  $out
}

if (-not $SkipBuild) {
  Write-Host '== build:api ==' -ForegroundColor Cyan
  Push-Location $root
  try {
    npm run build:api
    if ($LASTEXITCODE -ne 0) { throw 'build:api failed' }
  } finally { Pop-Location }
}

if (-not $SchemaOnly) {
  $tar = Join-Path $env:TEMP "opencode\shz-dist-$stamp.tar.gz"
  Write-Host "== packaging dist -> $tar ==" -ForegroundColor Cyan
  tar -czf $tar -C $distDir .
  if ($LASTEXITCODE -ne 0) { throw 'tar failed' }
  Write-Host "== uploading dist ($([math]::Round((Get-Item $tar).Length / 1MB, 2)) MB) ==" -ForegroundColor Cyan
  Send-File $tar "$apiRemote/shz-dist.tar.gz" | Out-Null
}

Write-Host '== uploading prisma/schema.prisma ==' -ForegroundColor Cyan
Send-File $schema "$apiRemote/prisma/schema.prisma" | Out-Null

$remote = @"
set -e
cd $($cfg.API_DIR)
if [ -f shz-dist.tar.gz ]; then
  rm -rf dist.bak.$stamp
  mv dist dist.bak.$stamp
  mkdir dist
  tar xzf shz-dist.tar.gz -C dist
  rm -f shz-dist.tar.gz
  echo "dist swapped (backup dist.bak.$stamp)"
fi
./node_modules/.bin/prisma generate --schema prisma/schema.prisma
mkdir -p tmp
touch tmp/restart.txt
echo "passenger restart touched"
sleep 3
curl -s -o /dev/null -m 30 -w "health=%{http_code}\n" -H "Host: api.shohozskill.com.bd" http://127.0.0.1/api/health
"@

if ($Install) { $remote = "./node_modules/.bin/../.bin/npm install --omit=dev`n" + $remote }

Write-Host '== server steps (swap dist, prisma generate, restart) ==' -ForegroundColor Cyan
Run-Remote $remote | Write-Host

Write-Host '== public health check ==' -ForegroundColor Cyan
curl.exe -s -m 30 -o NUL -w "$($cfg.API_HEALTH) -> %{http_code}`n" $cfg.API_HEALTH
