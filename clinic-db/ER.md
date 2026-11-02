# Modelo entidad–relación

El modelo separa identidades, hechos clínicos, indicaciones prescritas y operaciones administrativas. Los identificadores internos enlazan entidades; los identificadores externos estables permiten sincronizar con CONTIGO. Una receta contiene varios ítems y cada ítem varias horas: no se almacena una lista CSV como fuente transaccional. El CSV se construye únicamente en la vista de integración.

## Personas y atención clínica

```mermaid
erDiagram
    organizations ||--o{ sites : tiene
    organizations ||--o{ doctors : registra
    organizations ||--o{ patients : registra
    sites ||--o{ doctors : sede_principal
    doctors ||--o{ doctor_specialties : ejerce
    specialties ||--o{ doctor_specialties : clasifica
    patients ||--o{ patient_contacts : tiene
    patients ||--o| patient_allergy_status : conocimiento
    patients ||--o{ patient_allergies : registra
    allergen_catalog ||--o{ patient_allergies : identifica
    doctors ||--o{ patient_allergies : registra
    doctors ||--o{ patient_allergy_status : revisa
    patients ||--o| medical_records : tiene
    medical_records ||--o{ encounters : contiene
    doctors ||--o{ encounters : atiende
    specialties ||--o{ encounters : contexto
    sites ||--o{ encounters : lugar
    encounters ||--o{ patient_diagnoses : documenta
    diagnosis_catalog ||--o{ patient_diagnoses : codifica
    doctors ||--o{ patient_diagnoses : asigna
    encounters ||--o{ prescriptions : origina
    doctors ||--o{ prescriptions : prescribe
    prescriptions ||--o{ prescription_items : contiene
    medication_catalog ||--o{ prescription_items : identifica
    patient_diagnoses ||--o{ prescription_items : vinculo_explicito
    prescription_items ||--o{ prescription_schedules : horas
    patients ||--o{ appointments : agenda
    doctors ||--o{ appointments : atiende
    specialties ||--o{ appointments : especialidad
    sites ||--o{ appointments : sede
    encounters o|--o{ appointments : relacion_opcional
    encounters ||--o{ observations : registra
    doctors ||--o{ observations : autor
```

Las relaciones marcadas `o|` son opcionales. La base permite crear una historia antes de su primera atención y una receta antes de cargar sus ítems; la validación del flujo completo debe comprobar que estén listos antes de publicarlos. La relación diagnóstico–ítem es una elección registrada por un profesional ficticio, no un motor de inferencia.

## Exámenes, seguro y facturación

```mermaid
erDiagram
    insurers ||--o{ insurance_plans : ofrece
    insurance_plans ||--o{ patient_insurance_policies : define
    patients ||--o{ patient_insurance_policies : contrata
    organizations ||--o{ service_catalog : ofrece
    service_catalog ||--o{ lab_test_catalog : servicio
    encounters ||--o{ lab_orders : solicita
    doctors ||--o{ lab_orders : ordena
    lab_orders ||--o{ lab_order_items : contiene
    lab_test_catalog ||--o{ lab_order_items : determina
    lab_order_items ||--o| lab_results : resultado
    doctors ||--o{ lab_results : valida
    patients ||--o{ invoices : recibe
    encounters o|--o{ invoices : atencion_opcional
    patient_insurance_policies o|--o{ invoices : cobertura_opcional
    invoices ||--o{ invoice_items : contiene
    service_catalog ||--o{ invoice_items : referencia
    invoices ||--o{ payments : recibe
    organizations o|--o{ audit_log : contexto
```

Los catálogos de especialidades, diagnósticos, medicamentos y alérgenos son compartidos. Sedes, profesionales, pacientes, servicios y documentos pertenecen a una organización. Las entidades dependientes usan claves compuestas para conservar ese contexto y, cuando corresponde, el mismo paciente. La auditoría incluye las modificaciones de los catálogos compartidos, que pueden carecer de organización.

## Claves e invariantes principales

| Grupo | Claves y reglas |
|---|---|
| Identidad | PK estable en cada entidad; `patients.external_patient_id` globalmente único; historia única por paciente; código de sede único por organización |
| Profesionales | Matrícula y externo únicos por organización; PK compuesta de médico–especialidad; cita y atención deben usar una especialidad registrada para el médico |
| Alergias | Una fila de conocimiento por paciente; alérgenos asignados separados de ese estado; `UNKNOWN` conserva falta de información |
| Clínica | Historia, atención, diagnóstico y paciente relacionados por FK; códigos diagnósticos en catálogo; diagnóstico de receta verificado contra paciente mediante trigger |
| Prescripción | Cabecera con vigencia y prescriptor; identidad externa de ítem única por organización; dosis positiva; versión positiva; hora diaria o día/hora semanal sin duplicados |
| Agenda | Final posterior al inicio; inicio programado único por médico y por paciente; zona conservada como instante `timestamptz` |
| Observaciones | Valor al menos en una magnitud; talla/peso positivos y acotados; presión como par sistólica/diastólica con sistólica mayor; nulos conservan datos desconocidos |
| Laboratorio | Orden y detalle separados; un resultado por detalle; exactamente un valor numérico o textual; rangos opcionales sin interpretación clínica automática |
| Administración | Póliza por paciente; porcentaje entre 0 y 100; líneas y pagos positivos; totales derivados, sin duplicar la relación de detalles |
| Auditoría | Secuencia identity; operación, actor, instante, transacción y JSONB; trigger de solo anexado para el uso normal |

## Proyecciones hacia CONTIGO

```mermaid
flowchart LR
    RX[Cabecera + ítems + horarios + medicamento + diagnóstico + prescriptor] --> V1[clinic.contigo_prescriptions]
    AP[Cita + paciente + sede + especialidad + médico] --> V2[clinic.contigo_appointments]
    PR[Paciente + última observación antropométrica + diagnósticos + alergias] --> V3[clinic.contigo_profiles]
    V1 --> R[Usuario lector de integración]
    V2 --> R
    V3 --> R
    R --> B[Backend CONTIGO: autorización y filtro por paciente]
```

La proyección financiera `invoice_balances` permanece fuera de los permisos del lector. Las tres vistas del contrato son de solo lectura y conservan los identificadores externos existentes para evitar duplicaciones al importar.
