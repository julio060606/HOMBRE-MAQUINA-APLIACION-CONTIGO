param(
    [string]$PostgresBin = $env:CONTIGO_PG_BIN,
    [int]$Port = 55432
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runtimeDir = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$cacheDir = Join-Path $env:LOCALAPPDATA 'CONTIGO/runtime'
if (-not $PostgresBin) { $PostgresBin = Join-Path $cacheDir 'pgsql/bin' }
if (-not (Test-Path -LiteralPath (Join-Path $PostgresBin 'pg_ctl.exe')) -or -not (Test-Path -LiteralPath (Join-Path $PostgresBin '../share/postgres.bki'))) {
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    $archive = Join-Path $cacheDir 'postgresql-15-binaries.zip'
    if (-not (Test-Path -LiteralPath $archive)) {
        Write-Host 'Descargando PostgreSQL desde EDB (distribuidor enlazado por postgresql.org)...'
        & curl.exe --fail --location --silent --show-error 'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260630' --output $archive
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo descargar PostgreSQL.' }
    }
    # Extract the server and command-line tools; pgAdmin/StackBuilder are unnecessary here.
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($archive)
    try {
        foreach ($entry in $zip.Entries) {
            if ($entry.FullName -notmatch '^pgsql/(bin|lib|share)/') { continue }
            $target = [IO.Path]::GetFullPath((Join-Path $cacheDir $entry.FullName))
            if (-not $target.StartsWith(([IO.Path]::GetFullPath($cacheDir) + [IO.Path]::DirectorySeparatorChar), [StringComparison]::OrdinalIgnoreCase)) { throw 'Ruta de archivo ZIP invalida.' }
            if (-not $entry.Name) { New-Item -ItemType Directory -Path $target -Force | Out-Null; continue }
            New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($target)) -Force | Out-Null
            if (-not (Test-Path -LiteralPath $target) -or (Get-Item -LiteralPath $target).Length -ne $entry.Length) { [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true) }
        }
    } finally { $zip.Dispose() }
    if (-not (Test-Path -LiteralPath (Join-Path $PostgresBin 'pg_ctl.exe'))) { throw 'Indica la carpeta bin de PostgreSQL mediante -PostgresBin.' }
}
$configFile = Join-Path $runtimeDir 'local-config.json'
if (Test-Path -LiteralPath $configFile) {
    $config = Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json
    if ($config.postgresPort -ne $Port) { throw "Esta instalacion ya usa el puerto $($config.postgresPort). Ejecuta con ese puerto." }
} else {
    $config = [pscustomobject]@{
        postgresPort = $Port; apiPort = 8081; frontendPort = 3001; postgresBin = $PostgresBin
        adminUser = 'contigo_local_admin'; adminPassword = [guid]::NewGuid().ToString('N')
        contigoUser = 'contigo_admin'; contigoPassword = [guid]::NewGuid().ToString('N')
        clinicUser = 'clinic_owner'; clinicPassword = [guid]::NewGuid().ToString('N')
        readerUser = 'contigo_clinic_reader'; readerPassword = [guid]::NewGuid().ToString('N')
        jwtSecret = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'))))
    }
    $config | ConvertTo-Json | Set-Content -LiteralPath $configFile -Encoding UTF8
}
$dataDir = Join-Path $runtimeDir 'postgres-data'
$pgCtl = Join-Path $PostgresBin 'pg_ctl.exe'
$psql = Join-Path $PostgresBin 'psql.exe'
if (-not (Test-Path -LiteralPath (Join-Path $dataDir 'PG_VERSION'))) {
    $passwordFile = Join-Path $runtimeDir 'init-password.txt'
    [IO.File]::WriteAllText($passwordFile, $config.adminPassword, [Text.UTF8Encoding]::new($false))
    try {
        & (Join-Path $PostgresBin 'initdb.exe') -D $dataDir -U $config.adminUser --pwfile=$passwordFile --auth=scram-sha-256 --encoding=UTF8 --locale=C
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo inicializar el directorio PostgreSQL.' }
        Add-Content -LiteralPath (Join-Path $dataDir 'postgresql.conf') -Value "`ntimezone = 'America/Lima'" -Encoding ASCII
    } finally { Remove-Item -LiteralPath $passwordFile -Force -ErrorAction SilentlyContinue }
}
& $pgCtl status -D $dataDir *> $null
if ($LASTEXITCODE -ne 0) {
    if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) { throw "El puerto $Port esta ocupado por otro servidor. No se modifico." }
    & $pgCtl start -D $dataDir -l (Join-Path $runtimeDir 'postgres.log') -o "-p $Port -h 127.0.0.1" -w
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL no pudo arrancar. Revisa .runtime/postgres.log.' }
}
$previousPg = @{}
foreach ($key in @('PGHOST','PGPORT','PGUSER','PGPASSWORD','PGCLIENTENCODING','PGOPTIONS')) { $previousPg[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
try {
    $env:PGHOST = '127.0.0.1'; $env:PGPORT = [string]$Port; $env:PGUSER = $config.adminUser; $env:PGPASSWORD = $config.adminPassword; $env:PGCLIENTENCODING = 'UTF8'; $env:PGOPTIONS = '-c client_min_messages=warning'
    $bootstrap = @'
SELECT format('CREATE ROLE contigo_admin LOGIN PASSWORD %L', '__CONTIGO_PASSWORD__') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='contigo_admin') \gexec
SELECT format('CREATE ROLE clinic_owner LOGIN PASSWORD %L', '__CLINIC_PASSWORD__') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='clinic_owner') \gexec
SELECT format('CREATE ROLE contigo_clinic_reader LOGIN PASSWORD %L', '__READER_PASSWORD__') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='contigo_clinic_reader') \gexec
SELECT 'CREATE DATABASE contigo_db OWNER contigo_admin' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='contigo_db') \gexec
SELECT 'CREATE DATABASE san_pablo_clinic OWNER clinic_owner' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='san_pablo_clinic') \gexec
REVOKE CONNECT ON DATABASE san_pablo_clinic FROM PUBLIC;
GRANT CONNECT ON DATABASE san_pablo_clinic TO clinic_owner, contigo_clinic_reader;
REVOKE CONNECT ON DATABASE contigo_db FROM PUBLIC;
GRANT CONNECT ON DATABASE contigo_db TO contigo_admin;
'@
    $bootstrap = $bootstrap.Replace('__CONTIGO_PASSWORD__', $config.contigoPassword).Replace('__CLINIC_PASSWORD__', $config.clinicPassword).Replace('__READER_PASSWORD__', $config.readerPassword)
    $bootstrapFile = Join-Path $runtimeDir 'bootstrap-roles.sql'
    [IO.File]::WriteAllText($bootstrapFile, $bootstrap, [Text.UTF8Encoding]::new($false))
    try {
        & $psql -X -q -v ON_ERROR_STOP=1 -d postgres -f $bootstrapFile
        if ($LASTEXITCODE -ne 0) { throw 'No se pudieron crear los usuarios y bases del proyecto.' }
    } finally { Remove-Item -LiteralPath $bootstrapFile -Force -ErrorAction SilentlyContinue }
    $env:PGUSER = $config.clinicUser; $env:PGPASSWORD = $config.clinicPassword
    $sqlFiles = @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'clinic-db') -Filter '*.sql' | Where-Object Name -match '^00[1-3]_' | Sort-Object Name)
    if ($sqlFiles.Count -ne 3) { throw 'Faltan los tres scripts de estructura, datos e integracion en clinic-db.' }
    foreach ($file in $sqlFiles) {
        Write-Host "Aplicando $($file.Name)..."
        & $psql -X -q -v ON_ERROR_STOP=1 -d san_pablo_clinic -f $file.FullName
        if ($LASTEXITCODE -ne 0) { throw "Fallo el script $($file.Name)." }
    }
    $permissions = 'GRANT USAGE ON SCHEMA clinic TO contigo_clinic_reader; GRANT SELECT ON clinic.contigo_prescriptions, clinic.contigo_appointments, clinic.contigo_profiles TO contigo_clinic_reader;'
    & $psql -X -q -v ON_ERROR_STOP=1 -d san_pablo_clinic -c $permissions
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron conceder permisos de lectura al conector.' }
    Write-Host "PostgreSQL listo en 127.0.0.1:$Port. Bases: san_pablo_clinic y contigo_db."
    Write-Host 'Configuracion local guardada en .runtime/local-config.json (excluida de Git).'
} finally {
    foreach ($key in $previousPg.Keys) { [Environment]::SetEnvironmentVariable($key, $previousPg[$key], 'Process') }
}
