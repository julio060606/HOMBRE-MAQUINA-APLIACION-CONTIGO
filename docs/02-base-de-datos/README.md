# Arquitectura de Base de Datos - Ecosistema CONTIGO

## 1. Motor y Estrategia de Schemas

La base de datos relacional utiliza **PostgreSQL 15+** organizada mediante **schemas por dominio funcional**. Esto garantiza alta cohesión, modularidad y preparación para escalabilidad horizontal o separación en microservicios futuros.

```
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE: contigo_db          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  SCHEMA: auth   │ SCHEMA: clinical│   SCHEMA: telemetry     │
│  - users        │ - organizations │   - pill_intakes        │
│  - roles        │ - patients      │   - blood_pressure_logs │
│  - permissions  │ - caregivers    │   - emergency_events    │
│  - user_roles   │ - patient_links │                         │
│  - refresh_tok. │ - prescriptions │                         │
│                 │ - medications   │                         │
├─────────────────┴─────────────────┴─────────────────────────┤
│  SCHEMA: reports & audit                                    │
│  - clinical_reports                                         │
│  - audit_logs                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Modelo Relacional Entidad / Relación

### Schema `auth`
- **`auth.users`**: `id (UUID PK)`, `email (VARCHAR UNIQUE)`, `password_hash (VARCHAR)`, `phone (VARCHAR)`, `is_active (BOOLEAN)`, `created_at (TIMESTAMP)`, `updated_at (TIMESTAMP)`.
- **`auth.roles`**: `id (VARCHAR PK)`, `name (VARCHAR)`, `description (TEXT)`. (Valores: `ROLE_SUPER_ADMIN`, `ROLE_CLINIC_ADMIN`, `ROLE_CAREGIVER`, `ROLE_PATIENT`).
- **`auth.user_roles`**: `user_id (UUID FK)`, `role_id (VARCHAR FK)`.

### Schema `clinical`
- **`clinical.organizations`**: `id (UUID PK)`, `name (VARCHAR)`, `ruc_or_tax_id (VARCHAR)`, `subscription_plan (VARCHAR)`, `is_active (BOOLEAN)`.
- **`clinical.caregivers`**: `id (UUID PK)`, `user_id (UUID FK)`, `organization_id (UUID FK NULLABLE)`, `full_name (VARCHAR)`, `relationship_default (VARCHAR)`.
- **`clinical.patients`**: `id (UUID PK)`, `user_id (UUID FK NULLABLE)`, `organization_id (UUID FK NULLABLE)`, `full_name (VARCHAR)`, `age (INT)`, `medical_notes (TEXT)`, `emergency_phone (VARCHAR)`.
- **`clinical.patient_caregiver_links`**: `id (UUID PK)`, `patient_id (UUID FK)`, `caregiver_id (UUID FK)`, `pairing_pin (VARCHAR(6))`, `pin_expires_at (TIMESTAMP)`, `is_active (BOOLEAN)`, `linked_at (TIMESTAMP)`.
- **`clinical.medications`**: `id (UUID PK)`, `patient_id (UUID FK)`, `name (VARCHAR)`, `dosage (VARCHAR)`, `form_factor (VARCHAR)`, `image_url (VARCHAR)`, `instructions (TEXT)`, `is_active (BOOLEAN)`.
- **`clinical.prescriptions`**: `id (UUID PK)`, `medication_id (UUID FK)`, `frequency_type (VARCHAR)`, `scheduled_times (TEXT[])`, `start_date (DATE)`, `end_date (DATE NULLABLE)`, `is_active (BOOLEAN)`.

### Schema `telemetry`
- **`telemetry.pill_intakes`**: `id (UUID PK)`, `prescription_id (UUID FK)`, `patient_id (UUID FK)`, `scheduled_at (TIMESTAMP)`, `taken_at (TIMESTAMP NULLABLE)`, `status (VARCHAR)` (`TAKEN`, `MISSED`, `POSTPONED`, `PENDING`), `notes (TEXT)`.
- **`telemetry.blood_pressure_logs`**: `id (UUID PK)`, `patient_id (UUID FK)`, `systolic (INT)`, `diastolic (INT)`, `pulse (INT NULLABLE)`, `recorded_at (TIMESTAMP)`, `recorded_via (VARCHAR)` (`MANUAL_PATIENT`, `VOICE_PATIENT`, `CAREGIVER_WEB`), `status (VARCHAR)` (`NORMAL`, `HIGH`, `CRITICAL`).
- **`telemetry.emergency_events`**: `id (UUID PK)`, `patient_id (UUID FK)`, `triggered_at (TIMESTAMP)`, `event_type (VARCHAR)` (`PANIC_BUTTON`, `CRITICAL_VITALS`, `MISSED_MEDICATION`), `resolved_at (TIMESTAMP NULLABLE)`.

---

## 3. Filosofía Multi-Tenant (Preparación SaaS)

- Todas las tablas del schema `clinical` y `telemetry` incluyen la columna `organization_id (UUID NULLABLE)`.
- Para un usuario individual (B2C), `organization_id` es `NULL` y el aislamiento se realiza por `patient_id` / `caregiver_id`.
- Para una clínica o residencia (B2B), `organization_id` es obligatorio y las consultas JPA aplican automáticamente un filtro `@TenantFilter` en tiempo de ejecución.

---

## 4. Estrategia de Migraciones con Flyway

Las migraciones se almacenan en `backend/src/main/resources/db/migration/`:

```text
db/migration/
├── V1__create_schemas.sql
├── V2__create_auth_tables.sql
├── V3__create_clinical_tables.sql
├── V4__create_telemetry_tables.sql
├── V5__create_reports_and_audit_tables.sql
└── V6__create_indexes_and_constraints.sql
```

### Índices de Rendimiento Críticos:
```sql
-- Consultas rápidas de tomas diarias de un paciente
CREATE INDEX idx_pill_intakes_patient_date 
ON telemetry.pill_intakes (patient_id, scheduled_at DESC);

-- Búsqueda de historial de presión por rango temporal
CREATE INDEX idx_bp_logs_patient_date 
ON telemetry.blood_pressure_logs (patient_id, recorded_at DESC);

-- Filtrado rápido de medicamentos activos
CREATE INDEX idx_medications_patient_active 
ON clinical.medications (patient_id) WHERE is_active = TRUE;
```
