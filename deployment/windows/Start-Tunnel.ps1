$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
try {
  $ready = $false
  for ($i = 0; $i -lt 20; $i++) {
    try { $health = Invoke-RestMethod 'http://127.0.0.1:8787/api/health' -TimeoutSec 2; if ($health.ok) { $ready = $true; break } } catch {}
    Start-Sleep -Milliseconds 500
  }
  if (-not $ready) { throw '本机服务没有启动，请查看 Xiaozao Server 窗口。' }
  Write-Host '正在创建 HTTPS 展示地址。下方出现 https://……trycloudflare.com 后，将完整地址填入 App 的饭友圈 → 账号 → 服务地址。'
  Write-Host '本机也可先打开 http://127.0.0.1:8787；关闭本窗口会停止外网连接，数据不会删除。'
  # HTTP/2 is more likely to work on classroom networks that block outbound UDP.
  & "$PSScriptRoot\runtime\cloudflared.exe" tunnel --protocol http2 --url http://127.0.0.1:8787
  if ($LASTEXITCODE -ne 0) { throw '网络连接未建立，可换手机热点后重试。' }
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
