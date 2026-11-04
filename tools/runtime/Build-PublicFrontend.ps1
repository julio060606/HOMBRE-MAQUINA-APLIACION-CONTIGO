param([Parameter(Mandatory=$true)][string]$ApiBaseUrl)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$api = [Uri]$ApiBaseUrl
if ($api.Scheme -ne 'https' -or $api.Host -in @('localhost','127.0.0.1','0.0.0.0') -or $api.AbsolutePath.TrimEnd('/') -ne '/api/v1' -or $api.UserInfo -or $api.Query) {
    throw 'Indica la URL HTTPS pública de la API, terminada en /api/v1 y sin credenciales ni parámetros.'
}
$apiUrl = $ApiBaseUrl.TrimEnd('/')
$health = Invoke-RestMethod -Uri ($apiUrl + '/health') -TimeoutSec 15
if ($health.status -ne 'UP' -or $health.storage -ne 'postgresql') { throw 'La API indicada no está disponible con PostgreSQL; no se compiló una publicación incompleta.' }
$previousMocks = $env:VITE_USE_MOCKS
$previousApi = $env:VITE_API_BASE_URL
try {
    $env:VITE_USE_MOCKS = 'false'
    $env:VITE_API_BASE_URL = $apiUrl
    Push-Location (Join-Path $projectRoot 'frontend')
    try {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del frontend público.' }
    } finally { Pop-Location }
    Write-Host 'Compilación preparada en frontend/dist con API pública verificada. Este comando no publica ni modifica frontend/.env.'
} finally {
    [Environment]::SetEnvironmentVariable('VITE_USE_MOCKS',$previousMocks,'Process')
    [Environment]::SetEnvironmentVariable('VITE_API_BASE_URL',$previousApi,'Process')
}
