param([string]$TaskDirectory = (Join-Path $env:TEMP 'contigo-apf3-nvda'))
$ErrorActionPreference = 'Stop'
$taskAbsolute = [IO.Path]::GetFullPath($TaskDirectory)
$expectedDirectory = [IO.Path]::GetFullPath((Join-Path $env:TEMP 'contigo-apf3-nvda'))
if ($taskAbsolute -ne $expectedDirectory) { throw 'Use the dedicated CONTIGO APF3 temporary directory.' }
$launcher = Join-Path $taskAbsolute 'nvda_2026.3.exe'
$binary = Join-Path $taskAbsolute 'portable\nvda.exe'
if (!(Test-Path -LiteralPath $binary)) { throw 'Portable nvda.exe has not been created.' }
if ((Get-FileHash -LiteralPath $launcher -Algorithm SHA256).Hash -ne 'A8A87CB823DA0C62CFBAE4A444AE5AE238D54DC82AD6D46D3FDB3FEF082799B2') { throw 'Launcher hash differs from the downloaded official package.' }
$signature = Get-AuthenticodeSignature -LiteralPath $launcher
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'NV Access Limited') { throw 'Official launcher signature could not be verified.' }
$profile = Join-Path $taskAbsolute 'profile-apf3'
$logs = Join-Path $taskAbsolute 'logs'
New-Item -ItemType Directory -Force -Path $profile,$logs | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'nvda.ini') -Destination (Join-Path $profile 'nvda.ini')
$record = [ordered]@{ status='PREPARED ONLY; NVDA NOT STARTED BY THIS SCRIPT'; preparedAt=[DateTime]::UtcNow.ToString('o'); binary=$binary; version=(Get-Item -LiteralPath $binary).VersionInfo.ProductVersion; launcherSha256=(Get-FileHash -LiteralPath $launcher -Algorithm SHA256).Hash; signer=$signature.SignerCertificate.Subject; profile=$profile; log=(Join-Path $logs 'nvda-session.log'); systemProfileModified=$false; installed=$false }
$record | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskAbsolute 'preparation.json')
$record | ConvertTo-Json
