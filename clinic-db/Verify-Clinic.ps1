param(
    [string]$ConfigPath = (Join-Path (Split-Path $PSScriptRoot -Parent) '.runtime/local-config.json')
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ConfigPath)) { throw 'No se encontró la configuración local del lanzador.' }
$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$psqlPath = Join-Path $config.postgresBin 'psql.exe'
if (-not (Test-Path -LiteralPath $psqlPath)) { throw 'No se encontró el ejecutable PostgreSQL configurado.' }
$previousPassword = $env:PGPASSWORD
$previousEncoding = $env:PGCLIENTENCODING
$env:PGCLIENTENCODING = 'UTF8'
function Invoke-ClinicSql {
    param([string]$DatabaseUser, [string]$DatabasePassword, [string[]]$ExtraArguments)
    $env:PGPASSWORD = $DatabasePassword
    # Passwords are passed only through the process environment, never as arguments or output.
    $previousErrorAction = $ErrorActionPreference
    try {
        # Windows PowerShell 5 classifies psql NOTICE stderr as NativeCommandError.
        # Capture those messages and evaluate the real process exit code below.
        $ErrorActionPreference = 'Continue'
        $result = & $psqlPath -X -q -A -t -h 127.0.0.1 -p $config.postgresPort -U $DatabaseUser -d san_pablo_clinic -v ON_ERROR_STOP=1 @ExtraArguments 2>&1
        $returnCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousErrorAction }
    $content = ($result | ForEach-Object { $_.ToString() }) -join "`n"
    if ($returnCode -ne 0) { throw "Falló una verificación SQL (código $returnCode): $content" }
    return $content.Trim()
}
try {
    $tableText = Invoke-ClinicSql -DatabaseUser $config.clinicUser -DatabasePassword $config.clinicPassword -ExtraArguments @('-c', "SELECT tablename FROM pg_tables WHERE schemaname='clinic' ORDER BY tablename")
    $tableNames = @($tableText -split "\r?\n" | Where-Object { $_ -match '^[a-z_]+$' })
    if ($tableNames.Count -ne 32) { throw "Se esperaban 32 tablas; se encontraron $($tableNames.Count)." }
    $countsExpression = ($tableNames | ForEach-Object { "'$_', (SELECT count(*) FROM clinic.$_)" }) -join ','
    $countSql = "SELECT jsonb_build_object($countsExpression)"
    $before = Invoke-ClinicSql -DatabaseUser $config.clinicUser -DatabasePassword $config.clinicPassword -ExtraArguments @('-c', $countSql)

    $fixtureOutput = Invoke-ClinicSql -DatabaseUser $config.clinicUser -DatabasePassword $config.clinicPassword -ExtraArguments @('-f', (Join-Path $PSScriptRoot '004_verify.sql'))
    if ($fixtureOutput -notmatch 'PASS: fixture') { throw 'La validación del fixture no devolvió PASS.' }
    $constraintOutput = Invoke-ClinicSql -DatabaseUser $config.clinicUser -DatabasePassword $config.clinicPassword -ExtraArguments @('-f', (Join-Path $PSScriptRoot '005_constraint_tests.sql'))
    if ($constraintOutput -notmatch 'PASS: seven negative integrity checks') { throw 'La validación de restricciones no devolvió PASS.' }

    foreach ($fileName in @('001_schema.sql','002_seed.sql','003_integration_views.sql')) {
        $null = Invoke-ClinicSql -DatabaseUser $config.clinicUser -DatabasePassword $config.clinicPassword -ExtraArguments @('-f', (Join-Path $PSScriptRoot $fileName))
    }
    $after = Invoke-ClinicSql -DatabaseUser $config.clinicUser -DatabasePassword $config.clinicPassword -ExtraArguments @('-c', $countSql)
    if ($before -ne $after) { throw 'La reejecución alteró conteos de tablas o auditoría; revisar idempotencia.' }

    $readerSql = @'
SELECT jsonb_build_object(
  'prescriptionRows', (SELECT count(*) FROM clinic.contigo_prescriptions),
  'appointmentRows', (SELECT count(*) FROM clinic.contigo_appointments),
  'profileRows', (SELECT count(*) FROM clinic.contigo_profiles),
  'baseTablesWithPrivileges', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='clinic' AND c.relkind='r' AND (
      has_table_privilege(current_user,c.oid,'SELECT') OR has_table_privilege(current_user,c.oid,'INSERT')
      OR has_table_privilege(current_user,c.oid,'UPDATE') OR has_table_privilege(current_user,c.oid,'DELETE')
      OR has_table_privilege(current_user,c.oid,'TRUNCATE') OR has_table_privilege(current_user,c.oid,'REFERENCES')
      OR has_table_privilege(current_user,c.oid,'TRIGGER'))),
  'viewsWithWritePrivileges', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='clinic' AND c.relkind='v' AND (has_table_privilege(current_user,c.oid,'INSERT')
      OR has_table_privilege(current_user,c.oid,'UPDATE') OR has_table_privilege(current_user,c.oid,'DELETE'))),
  'financialViewReadable', has_table_privilege(current_user,'clinic.invoice_balances','SELECT'),
  'schemaCreateAllowed', has_schema_privilege(current_user,'clinic','CREATE')
)
'@
    $readerOutput = Invoke-ClinicSql -DatabaseUser $config.readerUser -DatabasePassword $config.readerPassword -ExtraArguments @('-c', $readerSql)
    $reader = $readerOutput | ConvertFrom-Json
    if ($reader.prescriptionRows -ne 3 -or $reader.appointmentRows -ne 3 -or $reader.profileRows -ne 2 -or
        $reader.baseTablesWithPrivileges -ne 0 -or $reader.viewsWithWritePrivileges -ne 0 -or
        $reader.financialViewReadable -or $reader.schemaCreateAllowed) { throw 'Los permisos o conteos del lector no corresponden al contrato.' }

    $version = Invoke-ClinicSql -DatabaseUser $config.clinicUser -DatabasePassword $config.clinicPassword -ExtraArguments @('-c', 'SHOW server_version')
    $hashes = [ordered]@{}
    foreach ($fileName in @('001_schema.sql','002_seed.sql','003_integration_views.sql','004_verify.sql','005_constraint_tests.sql','Verify-Clinic.ps1')) {
        $hashes[$fileName] = (Get-FileHash -LiteralPath (Join-Path $PSScriptRoot $fileName) -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $receipt = [ordered]@{
        verifiedAt = (Get-Date).ToUniversalTime().ToString('o')
        database = 'san_pablo_clinic'
        schema = 'clinic'
        postgresVersion = $version
        result = 'PASS'
        fixtureAssertions = 'PASS: exact view contracts, patient isolation, prescriptions, appointments, allergies, profile, financial aggregates and initial audit'
        negativeIntegrityTests = [ordered]@{ count = 7; result = 'PASS'; temporaryData = 'ROLLBACK' }
        idempotence = [ordered]@{ scripts = @('001_schema.sql','002_seed.sql','003_integration_views.sql'); all32TableCountsUnchanged = $true; auditCountUnchanged = $true }
        tableCounts = ($after | ConvertFrom-Json)
        reader = $reader
        limitations = @('Assertions target the initial synthetic fixture, not arbitrary later clinical edits.', 'Reader is a service account; application authorization and patient filtering remain required.', 'No real clinic integration or clinical efficacy was tested.')
        sha256 = $hashes
    }
    $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'verification.json') -Encoding UTF8
    Write-Output 'PASS: 32 tables; fixture; 7 rejected invalid operations; idempotent rerun; reader limited to three views. Receipt: clinic-db/verification.json'
}
finally {
    if ($null -eq $previousPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue } else { $env:PGPASSWORD = $previousPassword }
    if ($null -eq $previousEncoding) { Remove-Item Env:PGCLIENTENCODING -ErrorAction SilentlyContinue } else { $env:PGCLIENTENCODING = $previousEncoding }
}
