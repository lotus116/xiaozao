$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
try {
  $running = $false
  try { $null = Invoke-WebRequest 'http://127.0.0.1:8787/api/health' -UseBasicParsing -TimeoutSec 2; $running = $true } catch {}
  if ($running) { throw '服务仍在运行，请先关闭 Xiaozao Server 窗口后再备份。' }
  if (-not (Test-Path 'server-data')) { throw '尚无数据可备份。' }
  New-Item -ItemType Directory -Force 'backups' | Out-Null
  $destination = Join-Path 'backups' ('xiaozao-data-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
  $items = @('server-data', 'server-config.json') | Where-Object { Test-Path $_ }
  Compress-Archive -Path $items -DestinationPath $destination
  Write-Host "备份完成：$destination。包含私有配置与登录数据，请私下保管。"
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
