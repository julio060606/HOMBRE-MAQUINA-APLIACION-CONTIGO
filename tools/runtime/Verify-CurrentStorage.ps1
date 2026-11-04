param([string]$EvidencePath = 'output/apf3/evidence/current-2026-11-03/storage.json')
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$config = Get-Content -LiteralPath (Join-Path $projectRoot '.runtime/local-config.json') -Raw | ConvertFrom-Json
$psql = Join-Path $config.postgresBin 'psql.exe'
$previousPg = @{}
foreach ($key in @('PGHOST','PGPORT','PGUSER','PGPASSWORD','PGCLIENTENCODING')) { $previousPg[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$checks = @()
try {
    $env:PGHOST = '127.0.0.1'; $env:PGPORT = [string]$config.postgresPort; $env:PGCLIENTENCODING = 'UTF8'
    foreach ($database in @('san_pablo_clinic','contigo_db')) {
        if ($database -eq 'san_pablo_clinic') { $env:PGUSER=$config.clinicUser; $env:PGPASSWORD=$config.clinicPassword }
        else { $env:PGUSER=$config.contigoUser; $env:PGPASSWORD=$config.contigoPassword }
        $filter = "table_schema NOT IN ('pg_catalog','information_schema') AND table_schema NOT LIKE 'pg_%'"
        $query = "SELECT json_build_object('database',current_database(),'scope','Esquemas no internos visibles para el usuario del proyecto','schemas',(SELECT json_agg(DISTINCT table_schema) FROM information_schema.tables WHERE $filter),'baseTables',(SELECT count(*) FROM information_schema.tables WHERE $filter AND table_type='BASE TABLE'),'views',(SELECT count(*) FROM information_schema.views WHERE $filter),'readOnly',current_setting('transaction_read_only')) FROM (SELECT 1) AS check_connection;"
        $result = & $psql -X -A -t -v ON_ERROR_STOP=1 -d $database -c "BEGIN READ ONLY; $query ROLLBACK;"
        if ($LASTEXITCODE -ne 0) { throw "Falló la lectura del almacenamiento $database." }
        $jsonLine = $result | Where-Object { $_.Trim().StartsWith('{') } | Select-Object -First 1
        if (-not $jsonLine) { throw "No se recibió la verificación JSON de $database." }
        $checks += ($jsonLine | ConvertFrom-Json)
    }
    $record = [ordered]@{ timestamp=(Get-Date).ToUniversalTime().ToString('o'); method='Conexiones PostgreSQL en transacciones READ ONLY, con ROLLBACK. Sin consulta de datos personales ni exportación de credenciales.'; complete=$true; databases=$checks }
    $target = [IO.Path]::GetFullPath((Join-Path $projectRoot $EvidencePath))
    if (-not $target.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'La evidencia debe quedar dentro del proyecto.' }
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    $record | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath $target
    $checks | Format-Table database,schemas,baseTables,views,readOnly
} finally {
    foreach ($key in $previousPg.Keys) { [Environment]::SetEnvironmentVariable($key,$previousPg[$key],'Process') }
}
