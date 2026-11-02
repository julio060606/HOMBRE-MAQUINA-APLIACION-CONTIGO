$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runtimeDir = Join-Path $projectRoot '.runtime'
foreach ($name in @('frontend','backend')) {
    $pidFile = Join-Path $runtimeDir "$name.pid"
    if (Test-Path -LiteralPath $pidFile) {
        $processId = [int](Get-Content -LiteralPath $pidFile)
        $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
        if ($process -and $process.CommandLine -and $process.CommandLine.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0) { Stop-Process -Id $processId; Write-Host "$name detenido." }
    }
}
$configFile = Join-Path $runtimeDir 'local-config.json'
if (Test-Path -LiteralPath $configFile) {
    $config = Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json
    & (Join-Path $config.postgresBin 'pg_ctl.exe') stop -D (Join-Path $runtimeDir 'postgres-data') -m fast -w
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL no se detuvo; comprueba si ya estaba detenido.' }
}
