param(
    [switch]$Rebuild,
    [string]$JavaHomePath,
    [string]$MavenCommand
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runtimeDir = Join-Path $projectRoot '.runtime'
& (Join-Path $PSScriptRoot 'Start-Database.ps1')
$config = Get-Content -LiteralPath (Join-Path $runtimeDir 'local-config.json') -Raw | ConvertFrom-Json
if (-not $JavaHomePath) {
    $candidate = Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'Java') -Directory -ErrorAction SilentlyContinue | Where-Object Name -like 'jdk-21*' | Sort-Object Name -Descending | Select-Object -First 1
    if ($candidate) { $JavaHomePath = $candidate.FullName } elseif ($env:JAVA_HOME) { $JavaHomePath = $env:JAVA_HOME }
}
if (-not $JavaHomePath -or -not (Test-Path -LiteralPath (Join-Path $JavaHomePath 'bin/java.exe'))) { throw 'Instala Java 21 o indica -JavaHomePath.' }
if (-not $MavenCommand) {
    $command = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($command) { $MavenCommand = $command.Source } else {
        $cached = Get-ChildItem -LiteralPath (Join-Path $env:USERPROFILE '.m2/wrapper/dists') -Filter mvn.cmd -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($cached) { $MavenCommand = $cached.FullName }
    }
}
function Get-ProjectListener([int]$Port) {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) { return $null }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    if (-not $process.CommandLine -or $process.CommandLine.Replace('/', '\').IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -lt 0) { throw "El puerto $Port pertenece a otro proyecto. No se detuvo ese proceso." }
    return $listener.OwningProcess
}
$backendProcess = Get-ProjectListener $config.apiPort
$jar = Join-Path $projectRoot 'backend/target/contigo-backend-1.0.0.jar'
if ($Rebuild -or -not (Test-Path -LiteralPath $jar)) {
    if (-not $MavenCommand) { throw 'Instala Maven o indica -MavenCommand (ruta a mvn.cmd).' }
    # Windows keeps the running JAR open. Stop our own server before replacing it.
    if ($backendProcess) { Stop-Process -Id $backendProcess; $backendProcess = $null; Start-Sleep -Milliseconds 500 }
    $previousJavaHome = $env:JAVA_HOME
    try {
        $env:JAVA_HOME = $JavaHomePath
        Push-Location (Join-Path $projectRoot 'backend')
        try { & $MavenCommand -q -DskipTests package; if ($LASTEXITCODE -ne 0) { throw 'Fallo la compilacion del backend.' } } finally { Pop-Location }
    } finally { $env:JAVA_HOME = $previousJavaHome }
}
if (-not $backendProcess) {
    $environment = @{
        PORT = [string]$config.apiPort; SERVER_ADDRESS = '127.0.0.1'
        SPRING_DATASOURCE_URL = "jdbc:postgresql://127.0.0.1:$($config.postgresPort)/contigo_db"
        SPRING_DATASOURCE_USERNAME = $config.contigoUser; SPRING_DATASOURCE_PASSWORD = $config.contigoPassword
        SPRING_DATASOURCE_DRIVER = 'org.postgresql.Driver'; JWT_SECRET = $config.jwtSecret
        CLINICAL_PROVIDER_MODE = 'database'; CLINIC_SYNC_ENABLED = 'true'; CLINIC_SYNC_ON_STARTUP = 'true'
        CLINIC_SYNC_INTERVAL_MS = '15000'; CLINIC_SYNC_INITIAL_DELAY_MS = '15000'
        CLINIC_DB_URL = "jdbc:postgresql://127.0.0.1:$($config.postgresPort)/san_pablo_clinic"
        CLINIC_DB_USERNAME = $config.readerUser; CLINIC_DB_PASSWORD = $config.readerPassword
        CLINIC_ORGANIZATION_ID = 'clinic_demo'
    }
    $previous = @{}
    try {
        foreach ($key in $environment.Keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process'); [Environment]::SetEnvironmentVariable($key, $environment[$key], 'Process') }
        $backend = Start-Process -FilePath (Join-Path $JavaHomePath 'bin/java.exe') -ArgumentList @('-jar', ('"' + $jar + '"')) -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'backend.log') -RedirectStandardError (Join-Path $runtimeDir 'backend-error.log')
        $backendProcess = $backend.Id
        Set-Content -LiteralPath (Join-Path $runtimeDir 'backend.pid') -Value $backendProcess
    } finally { foreach ($key in $previous.Keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') } }
}
$ready = $false
for ($attempt = 0; $attempt -lt 90; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$($config.apiPort)/api/v1/health" -TimeoutSec 2
        if ($health.status -eq 'UP') { $ready = $true; break }
    } catch { }
    if (-not (Get-Process -Id $backendProcess -ErrorAction SilentlyContinue)) { throw 'El backend se detuvo. Revisa .runtime/backend.log y backend-error.log.' }
    Start-Sleep -Milliseconds 500
}
if (-not $ready) { throw 'El backend no respondio a tiempo. Revisa .runtime/backend.log.' }
# Restart only the Vite process belonging to this workspace, so API mode and LAN binding take effect.
$frontendProcess = Get-ProjectListener $config.frontendPort
if ($frontendProcess) { Stop-Process -Id $frontendProcess; Start-Sleep -Milliseconds 500 }
$node = (Get-Command node.exe -ErrorAction Stop).Source
$vite = Join-Path $projectRoot 'frontend/node_modules/vite/bin/vite.js'
if (-not (Test-Path -LiteralPath $vite)) { throw 'Ejecuta npm ci dentro de frontend antes de arrancar.' }
$frontend = Start-Process -FilePath $node -ArgumentList @(('"' + $vite + '"'), '--host', '0.0.0.0', '--port', [string]$config.frontendPort, '--strictPort') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.log') -RedirectStandardError (Join-Path $runtimeDir 'frontend-error.log')
Set-Content -LiteralPath (Join-Path $runtimeDir 'frontend.pid') -Value $frontend.Id
$frontendReady = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try { $null = Invoke-WebRequest -Uri "http://127.0.0.1:$($config.frontendPort)/login" -Method Head -UseBasicParsing -TimeoutSec 2; $frontendReady = $true; break } catch { }
    if ($frontend.HasExited) { throw 'El frontend se detuvo. Revisa .runtime/frontend-error.log.' }
    Start-Sleep -Milliseconds 250
}
if (-not $frontendReady) { throw 'El frontend no respondio a tiempo. Revisa .runtime/frontend.log.' }
Write-Host "CONTIGO: http://127.0.0.1:$($config.frontendPort)/login"
Write-Host "API: http://127.0.0.1:$($config.apiPort)/api/v1/health"
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.AddressState -eq 'Preferred' -and $_.IPAddress -notmatch '^(127\.|169\.254\.)' } | ForEach-Object { Write-Host "En la misma red: http://$($_.IPAddress):$($config.frontendPort)/login" }
Write-Host 'Usuario cuidador: cuidador@contigo.example; paciente: dacio@contigo.example. Clave de prueba: Contigo2026!'
