# Run only after coordinating desktop tests. Launches the real portable NVDA.
$ErrorActionPreference = 'Stop'
$taskDirectory = Join-Path $env:TEMP 'contigo-apf3-nvda'
$binary = Join-Path $taskDirectory 'portable\nvda.exe'
$profile = Join-Path $taskDirectory 'profile-apf3'
$log = Join-Path $taskDirectory 'logs\nvda-session.log'
$existing = @(Get-Process -Name 'nvda','nvda_noUIAccess','nvda_uiAccess' -ErrorAction SilentlyContinue)
if ($existing.Count -gt 0) { throw 'NVDA is already running. Do not replace another NVDA session.' }
if (!(Test-Path -LiteralPath (Join-Path $profile 'nvda.ini'))) { throw 'Run prepare.ps1 first.' }
$arguments = @('--no-sr-flag','--disable-addons','--log-level=12',('--config-path="{0}"' -f $profile),('--log-file="{0}"' -f $log))
$process = Start-Process -FilePath $binary -ArgumentList $arguments -WorkingDirectory (Split-Path $binary) -WindowStyle Hidden -PassThru
[ordered]@{status='NVDA LAUNCHED; inspect the real log before reporting a test';launchedAt=[DateTime]::UtcNow.ToString('o');pid=$process.Id;binary=$binary;arguments=$arguments;log=$log} | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskDirectory 'launch.json')
Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskDirectory 'launch.json')
