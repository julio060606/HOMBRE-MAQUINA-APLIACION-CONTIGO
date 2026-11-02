param([string]$LogPath = (Join-Path $env:TEMP 'contigo-apf3-nvda\logs\nvda-session.log'),[Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
if (!(Test-Path -LiteralPath $LogPath)) { throw 'No real NVDA log exists.' }
$lines = [IO.File]::ReadAllLines($LogPath)
$actual = [Collections.Generic.List[string]]::new()
for ($i=0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^Speaking\s') {
        if ($i -gt 0 -and $lines[$i-1] -match '^(IO|DEBUG|INFO)\s') { $actual.Add($lines[$i-1]) }
        $actual.Add($lines[$i])
    }
}
if ($actual.Count -eq 0) { throw 'No real Speaking records found. Do not claim a screen-reader traversal.' }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
# Keep the full original in the isolated temporary folder; export only reviewed speech records.
[IO.File]::WriteAllLines((Join-Path $OutputDirectory 'nvda-speaking-verbatim.log'),$actual,[Text.UTF8Encoding]::new($false))
[ordered]@{extractedAt=[DateTime]::UtcNow.ToString('o');source='%TEMP%/contigo-apf3-nvda/logs/nvda-session.log';sourceSha256=(Get-FileHash -LiteralPath $LogPath -Algorithm SHA256).Hash;speakingRecords=@($lines | Where-Object {$_ -match '^Speaking\s'}).Count;method='Exact original Speaking lines and preceding timestamps; no DOM or invented speech text';privacy='Full log stays in isolated TEMP; export reviewed to contain only local demo and NVDA startup speech';limitation='Technical traversal by agent, not a participant session, not proof of acoustic usability or complete AA compliance'} | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $OutputDirectory 'extraction.json')
Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $OutputDirectory 'extraction.json')
