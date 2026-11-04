param(
    [string]$FrontendUrl = 'https://hombre-maquina-apliacion-contigo.vercel.app',
    [string]$ApiBaseUrl,
    [string]$EvidencePath = 'output/apf3/evidence/current-2026-11-03/public-deployment.json'
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$frontend = [Uri]$FrontendUrl
if ($frontend.Scheme -ne 'https') { throw 'El frontend público debe utilizar HTTPS.' }
$api = if ($ApiBaseUrl) { $ApiBaseUrl.TrimEnd('/') } else { $FrontendUrl.TrimEnd('/') + '/api/v1' }
if (([Uri]$api).Scheme -ne 'https') { throw 'La API pública debe utilizar HTTPS.' }
$report = [ordered]@{
    timestamp=(Get-Date).ToUniversalTime().ToString('o')
    frontendUrl=$FrontendUrl.TrimEnd('/')
    apiBaseUrl=$api
    method='Consulta HTTP del acceso y salud JSON de API. Sin credenciales ni inicio de sesión público.'
    complete=$false
}
try {
    $login = Invoke-WebRequest -Uri ($FrontendUrl.TrimEnd('/') + '/login') -UseBasicParsing -TimeoutSec 20
    $report.frontendHttpStatus = [int]$login.StatusCode
    $health = Invoke-WebRequest -Uri ($api + '/health') -UseBasicParsing -TimeoutSec 20
    $report.healthHttpStatus = [int]$health.StatusCode
    $report.healthContentType = [string]$health.Headers['Content-Type']
    try { $payload = $health.Content | ConvertFrom-Json } catch { $payload = $null }
    if (-not $payload -or $payload.status -ne 'UP' -or $payload.storage -ne 'postgresql') {
        $report.reason = 'La dirección de salud no devuelve la API CONTIGO disponible con PostgreSQL. Que el portal abra no acredita que el acceso funcione.'
    } else {
        $report.health = @{ status=$payload.status; storage=$payload.storage }
        $report.complete = $true
        $report.limitation = 'La salud disponible no sustituye comprobar autenticación, tareas y sincronización en la publicación.'
    }
} catch {
    $report.reason = 'No se pudo verificar el frontend y la API en las direcciones públicas indicadas.'
    if ($_.Exception.Response) { $report.failedHttpStatus = [int]$_.Exception.Response.StatusCode }
}
$target = [IO.Path]::GetFullPath((Join-Path $projectRoot $EvidencePath))
if (-not $target.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'La evidencia debe quedar dentro del proyecto.' }
New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
$report | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath $target
$report | ConvertTo-Json -Depth 6
if (-not $report.complete) { exit 2 }
