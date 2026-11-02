# Base clínica ficticia de CONTIGO

Base PostgreSQL separada **`san_pablo_clinic`**, esquema **`clinic`**. Representa una clínica San Pablo inventada para el proyecto académico. No usa una conexión, API, identidad profesional, paciente ni documento de una clínica real. Las recetas se cargan expresamente como ejemplos sintéticos; el diagnóstico **no genera** medicamentos, dosis, horarios ni recomendaciones.

El modelo contiene 32 tablas y cuatro vistas. Las tres vistas `contigo_*` son el contrato de lectura del backend; `invoice_balances` es una consulta administrativa auxiliar. Véase el [modelo ER](ER.md).

## Instalación y ejecución

El lanzador del repositorio `tools/runtime/Start-Database.ps1` prepara esta base y la base independiente de CONTIGO. Configura un propietario clínico y un usuario lector distinto; las contraseñas locales permanecen en `.runtime/local-config.json`, fuera de estos scripts SQL.

Para una instalación propia, crear primero la base `san_pablo_clinic` con un propietario dedicado y ejecutar en este orden, con codificación UTF-8:

```powershell
psql -X -v ON_ERROR_STOP=1 -d san_pablo_clinic -f clinic-db/001_schema.sql
psql -X -v ON_ERROR_STOP=1 -d san_pablo_clinic -f clinic-db/002_seed.sql
psql -X -v ON_ERROR_STOP=1 -d san_pablo_clinic -f clinic-db/003_integration_views.sql
```

La autenticación, el host y el puerto se suministran mediante la configuración local de PostgreSQL. Cada archivo tiene su propia transacción `BEGIN`/`COMMIT`; ejecutar cada archivo por separado, sin añadir `--single-transaction`. Los scripts no crean otras bases ni roles y no contienen `DROP` ni `TRUNCATE`.

Los objetos se crean de forma idempotente; las vistas y funciones se actualizan con `CREATE OR REPLACE`. El seed utiliza claves estables y `ON CONFLICT DO NOTHING`: volver a ejecutarlo no duplica registros ni sobrescribe modificaciones posteriores. Esto también conserva la fecha original de carga: las recetas empiezan el `CURRENT_DATE` de la **primera** inserción y terminan 90 días después; las citas se fijan respecto de esa misma primera carga. Reejecutar el seed no prorroga vigencias ni rejuvenece pacientes. `IF NOT EXISTS` facilita reinstalar este modelo inicial; los cambios futuros de estructura deben tener migraciones incrementales explícitas.

## Casos sintéticos

| Registro | Dacio Ramos | Rosa Martínez |
|---|---|---|
| Identificador externo | `demo-pat_001` | `demo-pat_002` |
| Organización | `clinic_demo` | `clinic_demo` |
| Edad al insertar el seed | 78 años | 72 años |
| Historia | `FICT-HC-0001` | `FICT-HC-0002` |
| Diagnósticos asignados al caso | I10; E55.9 | E11.9 |
| Recetas | `rx-med_001`: Losartán, 50 mg, 08:00 y 20:00; `rx-med_002`: Vitamina D3, 2000 UI, 14:00 | `rx-med_003`: Metformina, 850 mg, 09:00 |
| Profesional ficticio | Lucía Valdés | Camila Torres |
| Primera cita | `external-pat_001`, Geriatría, día +7 a las 10:30 | `external-pat_002`, Medicina general, día +9 a las 11:00 |
| Segunda cita | `clinic-appt-dacio-cardio-02`, Cardiología, día +30 a las 09:00, Mateo Salazar | Sin segunda cita de ejemplo |
| Alergias | `UNKNOWN`, información desconocida | `UNKNOWN`, información desconocida |
| Antropometría del caso | 168 cm, 72 kg | 159 cm, 61 kg |

Los horarios corresponden a `America/Lima`. Los nombres, matrículas `FICT-CMP-*`, contactos `example.invalid`, sedes, coberturas, exámenes, importes y resultados son inventados. El catálogo de alérgenos no asigna una alergia a un paciente. Una lista de alergias vacía no significa “ninguna”: ambos casos mantienen su estado de conocimiento `UNKNOWN` y una nota explícita.

Dacio tiene una atención histórica, dos diagnósticos seleccionados por el profesional ficticio, una receta con dos ítems y tres horas de administración, dos citas, observaciones, exámenes y una factura de demostración de PEN 250 cubierta por dos pagos de PEN 100 y 150. Rosa tiene su propia atención, receta, cita y una orden de examen sin resultado. No se fabrica un resultado para esa orden pendiente.

## Contrato de integración de solo lectura

El backend consulta cada vista con un parámetro enlazado, por ejemplo:

```sql
SELECT * FROM clinic.contigo_prescriptions WHERE external_patient_id = ?;
```

### `clinic.contigo_prescriptions`

| Columna | Tipo PostgreSQL / significado |
|---|---|
| `external_patient_id` | `varchar(96)`, identidad externa globalmente única del paciente |
| `external_prescription_id` | `varchar(96)`, identidad estable del ítem, no de toda la receta |
| `version` | `integer` positivo, revisión explícita del ítem |
| `name`, `dosage`, `form_factor` | Nombre del catálogo, dosis textual prescrita y presentación |
| `times` | `text`, horas CSV ordenadas `HH24:MI`, por ejemplo `08:00,20:00`; `NULL` si no existen horarios |
| `frequency_type` | `DAILY` en esta versión del adaptador |
| `start_date`, `end_date` | `date`, fechas de vigencia independientes del estado |
| `instructions` | `text`, indicación escrita en el caso sintético |
| `is_active` | `boolean`, ítem y medicamento activos y cabecera con estado `ACTIVE` |
| `units_per_dose` | `numeric(9,3)`, unidades positivas por toma |
| `stock_unit`, `image_url` | Unidad del catálogo y ruta de imagen, que puede ser nula |
| `diagnosis` | `text`, código y descripción del diagnóstico expresamente vinculado al ítem |
| `doctor` | `text`, nombre del prescriptor con el marcador “médico ficticio” |

Se conservan las recetas canceladas como `is_active = false`, para que una sincronización pueda desactivar registros ya importados. No se exportan borradores. La vista no filtra por la fecha actual: el consumidor evalúa las fechas de vigencia. El esquema admite `WEEKLY` y `AS_NEEDED`, pero la vista actual exporta **solo `DAILY`**: un CSV de horas no representa días de la semana ni condiciones de uso a demanda. El consumidor debe rechazar o señalar una receta diaria sin horarios; no debe inventarlos.

Una modificación clínica autorizada del ítem debe incrementar `version`. Si se cambian horarios, fechas de cabecera, diagnóstico o datos compartidos del medicamento que afectan a la proyección, deben incrementarse las versiones de todos los ítems afectados en la misma transacción. No hay incremento automático oculto en este modelo inicial ni una regla de prescripción por diagnóstico.

### `clinic.contigo_appointments`

Columnas, en orden: `external_patient_id`, `external_id`, `starts_at`, `specialty`, `doctor`, `location`, `status`, `instructions`. `starts_at` es `timestamp with time zone`. Las demás columnas son identificadores o texto; `status` conserva `SCHEDULED`, `COMPLETED`, `CANCELLED` o `NO_SHOW`. `location` combina sede y consultorio. Se conservan citas pasadas y canceladas para actualizar las ya importadas; la interfaz decide cuáles presentar.

### `clinic.contigo_profiles`

Columnas, en orden: `external_patient_id`, `height_cm`, `weight_kg`, `measured_at`, `notes`. Talla y peso son `numeric` anulables. La proyección selecciona la observación antropométrica más reciente del paciente por `measured_at` y, ante empate, por `id`; no combina mediciones de fechas distintas. `measured_at` es `timestamp with time zone` y puede ser nulo. Una medición desconocida queda nula, sin sustituirse por cero. Las notas identifican el carácter sintético, los diagnósticos confirmados del caso con su profesional y el estado de conocimiento de alergias.

## Integridad y acceso

Las claves foráneas compuestas verifican organización y paciente en sedes, historias, atenciones, diagnósticos, recetas, observaciones, órdenes, seguros y facturas. Un trigger comprueba además que el diagnóstico elegido para un ítem corresponde al paciente y organización de su receta. Hay restricciones para unidades positivas, vigencias, horas diarias repetidas, porcentajes, resultados numéricos o textuales exclusivos y duración positiva de citas. Los índices cubren las principales consultas por paciente, estado y fecha.

Las vistas con múltiples relaciones y agregaciones no son actualizables. El lanzador concede al rol de lectura `USAGE` del esquema y `SELECT` **únicamente** en las tres vistas del contrato, sin permisos de lectura o escritura sobre tablas clínicas ni sobre la vista financiera. El SQL revoca permisos públicos en las vistas; no crea credenciales.

```sql
GRANT USAGE ON SCHEMA clinic TO contigo_clinic_reader;
GRANT SELECT ON clinic.contigo_prescriptions,
                clinic.contigo_appointments,
                clinic.contigo_profiles TO contigo_clinic_reader;
```

El lector de integración es una cuenta de servicio y puede consultar los dos casos a través de las vistas. La autorización de cada usuario y el filtro por paciente pertenecen al backend de CONTIGO; estas vistas no implementan aislamiento por sesión de paciente ni RLS. Las claves compuestas impiden relaciones cruzadas incorrectas, pero no sustituyen esa autorización.

La auditoría registra inserciones, cambios y eliminaciones en las 31 tablas de datos, con valores anteriores/nuevos JSONB, instante, transacción, actor y motivo. El actor y el motivo pueden establecerse dentro de la transacción mediante `set_config('clinic.actor_id', ..., true)` y `set_config('clinic.change_reason', ..., true)`. Un trigger rechaza `UPDATE`/`DELETE` de la auditoría. Un administrador con permisos para cambiar la estructura sigue siendo privilegiado; no se presenta este registro como almacenamiento inmutable frente al propietario.

El modelo financiero conserva importes de cada línea como datos históricos y calcula el total de línea. `invoice_balances` suma líneas y pagos por separado, evitando multiplicar importes al unir dos relaciones de detalle. Informa pagos con moneda distinta en `mismatched_currency_count` y no los resta del saldo. No automatiza conciliación, impuestos, sobrepagos ni cambios de estado contable. Las citas impiden duplicar el mismo inicio para paciente o médico activo; no resuelven todos los solapamientos de intervalos.

## Verificación reproducible

Con el propietario clínico y la configuración del lanzador disponibles:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File clinic-db/Verify-Clinic.ps1
```

El verificador ejecuta:

1. `004_verify.sql`: contrato exacto de columnas, 32 tablas, tres vistas no actualizables, recetas, pertenencia a paciente, citas, alergias desconocidas, perfil, factura y auditoría de la carga.
2. `005_constraint_tests.sql`: siete operaciones deliberadamente inválidas; deben rechazarse. Toda inserción temporal se revierte con `ROLLBACK`.
3. Reejecución de los tres scripts iniciales y comparación de conteos de las 32 tablas, incluida auditoría, para comprobar idempotencia sobre el fixture.
4. Lectura de las tres vistas con el usuario lector y comprobación de que no posee permisos sobre las tablas de base.

El recibo sin contraseñas se guarda en `verification.json`. Las aserciones del fixture se ejecutan sobre los ejemplos iniciales: si posteriormente se cambian datos clínicos, los valores esperados deben revisarse de forma explícita. El verificador no reinicia ni borra información.
