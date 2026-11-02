# Integración con la clínica ficticia

La aplicación mantiene su base PostgreSQL `contigo_db`. El modo `database` lee
las tres vistas del esquema `clinic` en **otra** base: `san_pablo_clinic`.
Los datos de ambas bases son ficticios para el proyecto académico.

## Configuración

Las variables `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` y
`SPRING_DATASOURCE_PASSWORD` siguen configurando la
conexión principal JPA/Flyway. La conexión clínica es independiente:

| Variable | Uso / valor predeterminado |
| --- | --- |
| `CLINICAL_PROVIDER_MODE` | `database` activa JDBC; también existen `simulated` y `external` |
| `CLINIC_DB_URL` | URL JDBC de `san_pablo_clinic` |
| `CLINIC_DB_USERNAME` | Usuario lector con SELECT solamente en las tres vistas |
| `CLINIC_DB_PASSWORD` | Contraseña del lector, fuera del repositorio |
| `CLINIC_DB_DRIVER` | `org.postgresql.Driver` |
| `CLINIC_DB_CONNECTION_TIMEOUT_MS` | `5000` |
| `CLINIC_ORGANIZATION_ID` | `clinic_demo` |
| `CLINIC_SYNC_ENABLED` | `true`; habilita sincronización automática solo en modo `database` |
| `CLINIC_SYNC_ON_STARTUP` | `true` |
| `CLINIC_SYNC_INTERVAL_MS` | `60000`, demora después de completar el ciclo anterior |
| `CLINIC_SYNC_INITIAL_DELAY_MS` | `15000` |

El lector no se registra como bean `DataSource`, de modo que la autoconfiguración
de la conexión principal, sus migraciones y sus transacciones no cambian.
La configuración local y el arranque reproducible se encuentran en
`tools/runtime/Start-Project.ps1`; las credenciales generadas están en `.runtime/`
y no deben incorporarse al control de versiones.

## Contrato y sincronización

Los scripts `clinic-db/001_schema.sql`, `002_seed.sql` y
`003_integration_views.sql` crean el contrato. Se consultan exclusivamente
`clinic.contigo_prescriptions`, `clinic.contigo_appointments` y
`clinic.contigo_profiles` mediante parámetros `external_patient_id`.
`demo-pat_001` corresponde a `pat_001`, y `demo-pat_002` a `pat_002`.
Las pautas exportadas actualmente son diarias (`DAILY`). El diagnóstico es
informativo: **no se calculan medicamentos ni dosis a partir del diagnóstico**.

Cada lectura clínica usa una transacción de solo lectura con aislamiento
REPEATABLE_READ. Después se valida y aplica la instantánea en una transacción
independiente de CONTIGO, bajo bloqueo del paciente. No existe una transacción
distribuida entre ambas bases: la aplicación guarda la instantánea leída.

Las recetas se identifican por paciente e ID externo. La repetición no duplica
dosis ni citas, y las versiones anteriores no reemplazan recetas más nuevas.
Un cambio de pauta cancela dosis futuras pendientes y crea la nueva pauta;
las respuestas históricas permanecen intactas. Las filas ausentes no se borran:
la fuente debe indicar suspensión o cancelación explícita.

La fecha de éxito y los datos importados se confirman juntos. Los fallos de
lectura, validación o confirmación dejan estado `FAILED`, conservan el último
éxito y permiten reintento. El planificador continúa con los demás pacientes y
reintenta en su siguiente ciclo. Las dosis del día también se preparan desde
las recetas locales al consultar `/api/v1/patients/{id}/doses`; no requieren una conexión clínica
disponible. El evento SSE se publica después de confirmar la transacción.
Una conexión SSE cerrada se descarta sin convertir una operación ya confirmada
en un fallo de sincronización ni impedir la entrega a los demás clientes.

## API y comprobaciones

- `GET /api/v1/health`: público, comprueba la conexión principal; no expone credenciales.
- `GET /api/v1/patients/{id}/clinical-sync`: estado, sujeto a acceso al paciente.
- `POST /api/v1/clinical-sync/{id}`: requiere administrador clínico o superadministrador
  y acceso al paciente. El modo JDBC está limitado a la organización configurada.
- La ausencia o invalidez de JWT devuelve `401`; los permisos insuficientes, `403`.

`DatabaseClinicalIntegrationTest` usa dos bases H2 independientes y un lector de
vistas sin permiso de escritura. Comprueba idempotencia, aislamiento por paciente,
actualización e historial, rollback ante fallo al confirmar, continuidad con la
fuente no disponible y permisos de la API. La verificación PostgreSQL real se
ejecuta aparte mediante el arranque local y las pruebas integradas del proyecto.
`EventDeliveryAfterCommitTest` verifica la entrega diferida y el aislamiento de
fallos de clientes SSE desconectados. La autenticación usa JWT y las cuentas de
la aplicación; se excluye la cuenta temporal que Spring Security genera por
defecto para `UserDetailsService`.

```powershell
# Desde backend, con Java 21 y Maven disponibles:
mvn test
mvn -DskipTests package
```

La migración V9 añade diagnóstico y médico sin modificar V1–V8 ya aplicadas.
`diagnosis`, `doctor` e `imageUrl` se entregan en las recetas y en las nuevas
instantáneas de dosis; una respuesta histórica conserva su información original.
