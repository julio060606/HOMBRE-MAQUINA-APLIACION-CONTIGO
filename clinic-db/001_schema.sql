-- Ejecutar dentro de la base san_pablo_clinic. Proyecto académico ficticio.
-- Este archivo crea objetos sin eliminar ni vaciar datos existentes.
BEGIN;
CREATE SCHEMA IF NOT EXISTS clinic;

CREATE TABLE IF NOT EXISTS clinic.organizations (
  id varchar(64) PRIMARY KEY,
  code varchar(40) NOT NULL UNIQUE,
  name varchar(180) NOT NULL CHECK (btrim(name) <> ''),
  is_synthetic boolean NOT NULL DEFAULT true CHECK (is_synthetic),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinic.sites (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL REFERENCES clinic.organizations(id),
  code varchar(40) NOT NULL,
  name varchar(160) NOT NULL CHECK (btrim(name) <> ''),
  address text NOT NULL,
  city varchar(100) NOT NULL,
  time_zone varchar(60) NOT NULL DEFAULT 'America/Lima',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, code),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.specialties (
  id varchar(64) PRIMARY KEY,
  code varchar(40) NOT NULL UNIQUE,
  name varchar(120) NOT NULL CHECK (btrim(name) <> '')
);

CREATE TABLE IF NOT EXISTS clinic.doctors (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL REFERENCES clinic.organizations(id),
  primary_site_id varchar(64) NOT NULL,
  external_doctor_id varchar(96) NOT NULL,
  given_names varchar(100) NOT NULL,
  family_names varchar(140) NOT NULL,
  registration_code varchar(60) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_site_id, organization_id) REFERENCES clinic.sites(id, organization_id),
  UNIQUE (organization_id, external_doctor_id),
  UNIQUE (organization_id, registration_code),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.doctor_specialties (
  doctor_id varchar(64) NOT NULL REFERENCES clinic.doctors(id),
  specialty_id varchar(64) NOT NULL REFERENCES clinic.specialties(id),
  PRIMARY KEY (doctor_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS clinic.patients (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL REFERENCES clinic.organizations(id),
  external_patient_id varchar(96) NOT NULL UNIQUE,
  chart_number varchar(60) NOT NULL,
  given_names varchar(100) NOT NULL,
  family_names varchar(140) NOT NULL,
  birth_date date NOT NULL,
  sex_at_birth varchar(12) NOT NULL DEFAULT 'UNKNOWN'
    CHECK (sex_at_birth IN ('FEMALE', 'MALE', 'INTERSEX', 'UNKNOWN')),
  is_synthetic boolean NOT NULL DEFAULT true CHECK (is_synthetic),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, chart_number),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.patient_contacts (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  contact_kind varchar(16) NOT NULL CHECK (contact_kind IN ('SELF', 'FAMILY', 'EMERGENCY', 'OTHER')),
  contact_name varchar(180) NOT NULL,
  relationship varchar(80),
  phone varchar(40),
  email varchar(254),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  CHECK (nullif(btrim(phone), '') IS NOT NULL OR nullif(btrim(email), '') IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_contacts_primary
  ON clinic.patient_contacts(patient_id, contact_kind) WHERE is_primary;

CREATE TABLE IF NOT EXISTS clinic.allergen_catalog (
  id varchar(64) PRIMARY KEY,
  code varchar(40) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  allergen_kind varchar(16) NOT NULL CHECK (allergen_kind IN ('MEDICATION', 'FOOD', 'ENVIRONMENT', 'OTHER'))
);

CREATE TABLE IF NOT EXISTS clinic.patient_allergy_status (
  patient_id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  knowledge_status varchar(16) NOT NULL DEFAULT 'UNKNOWN'
    CHECK (knowledge_status IN ('UNKNOWN', 'NO_KNOWN', 'KNOWN')),
  reviewed_by_doctor_id varchar(64),
  recorded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes text NOT NULL DEFAULT '',
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (reviewed_by_doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.patient_allergies (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  allergen_id varchar(64) NOT NULL REFERENCES clinic.allergen_catalog(id),
  severity varchar(12) NOT NULL DEFAULT 'UNKNOWN'
    CHECK (severity IN ('UNKNOWN', 'MILD', 'MODERATE', 'SEVERE')),
  reaction text,
  is_active boolean NOT NULL DEFAULT true,
  recorded_by_doctor_id varchar(64),
  recorded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (recorded_by_doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  UNIQUE (patient_id, allergen_id)
);

CREATE TABLE IF NOT EXISTS clinic.insurers (
  id varchar(64) PRIMARY KEY,
  code varchar(40) NOT NULL UNIQUE,
  name varchar(180) NOT NULL,
  is_synthetic boolean NOT NULL DEFAULT true CHECK (is_synthetic)
);

CREATE TABLE IF NOT EXISTS clinic.insurance_plans (
  id varchar(64) PRIMARY KEY,
  insurer_id varchar(64) NOT NULL REFERENCES clinic.insurers(id),
  code varchar(40) NOT NULL,
  name varchar(140) NOT NULL,
  UNIQUE (insurer_id, code)
);

CREATE TABLE IF NOT EXISTS clinic.patient_insurance_policies (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  plan_id varchar(64) NOT NULL REFERENCES clinic.insurance_plans(id),
  policy_number varchar(80) NOT NULL,
  starts_on date NOT NULL,
  ends_on date,
  coverage_percent numeric(5,2) NOT NULL CHECK (coverage_percent BETWEEN 0 AND 100),
  status varchar(12) NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  CHECK (ends_on IS NULL OR ends_on >= starts_on),
  UNIQUE (plan_id, policy_number),
  UNIQUE (id, patient_id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.medical_records (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL UNIQUE,
  opened_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes text NOT NULL DEFAULT '',
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  UNIQUE (id, patient_id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.encounters (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  medical_record_id varchar(64) NOT NULL,
  doctor_id varchar(64) NOT NULL,
  specialty_id varchar(64) NOT NULL,
  site_id varchar(64) NOT NULL,
  occurred_at timestamptz NOT NULL,
  encounter_type varchar(16) NOT NULL CHECK (encounter_type IN ('OUTPATIENT', 'REMOTE', 'EMERGENCY', 'OTHER')),
  status varchar(12) NOT NULL CHECK (status IN ('OPEN', 'SIGNED', 'CANCELLED')),
  reason text NOT NULL,
  clinical_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medical_record_id, patient_id, organization_id) REFERENCES clinic.medical_records(id, patient_id, organization_id),
  FOREIGN KEY (doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  FOREIGN KEY (doctor_id, specialty_id) REFERENCES clinic.doctor_specialties(doctor_id, specialty_id),
  FOREIGN KEY (site_id, organization_id) REFERENCES clinic.sites(id, organization_id),
  UNIQUE (id, patient_id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.diagnosis_catalog (
  code varchar(20) PRIMARY KEY,
  coding_system varchar(30) NOT NULL DEFAULT 'ICD-10',
  description varchar(240) NOT NULL
);

CREATE TABLE IF NOT EXISTS clinic.patient_diagnoses (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  encounter_id varchar(64) NOT NULL,
  diagnosis_code varchar(20) NOT NULL REFERENCES clinic.diagnosis_catalog(code),
  diagnosed_by_doctor_id varchar(64) NOT NULL,
  diagnosis_kind varchar(12) NOT NULL CHECK (diagnosis_kind IN ('PRIMARY', 'SECONDARY')),
  status varchar(12) NOT NULL CHECK (status IN ('CONFIRMED', 'SUSPECTED', 'RESOLVED', 'ENTERED_ERROR')),
  diagnosed_at timestamptz NOT NULL,
  resolved_at timestamptz,
  notes text NOT NULL DEFAULT '',
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (encounter_id, patient_id, organization_id) REFERENCES clinic.encounters(id, patient_id, organization_id),
  FOREIGN KEY (diagnosed_by_doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  CHECK (resolved_at IS NULL OR resolved_at >= diagnosed_at),
  UNIQUE (encounter_id, diagnosis_code),
  UNIQUE (id, patient_id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.medication_catalog (
  id varchar(64) PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  generic_name varchar(160) NOT NULL,
  form_factor varchar(20) NOT NULL CHECK (form_factor IN ('TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'TOPICAL', 'OTHER')),
  stock_unit varchar(40) NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS clinic.prescriptions (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  encounter_id varchar(64) NOT NULL,
  prescribing_doctor_id varchar(64) NOT NULL,
  external_document_id varchar(96) NOT NULL,
  issued_at timestamptz NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status varchar(12) NOT NULL CHECK (status IN ('ACTIVE', 'CANCELLED', 'DRAFT')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (encounter_id, patient_id, organization_id) REFERENCES clinic.encounters(id, patient_id, organization_id),
  FOREIGN KEY (prescribing_doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  CHECK (end_date >= start_date),
  UNIQUE (organization_id, external_document_id),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.prescription_items (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  prescription_id varchar(64) NOT NULL,
  medication_id varchar(64) NOT NULL REFERENCES clinic.medication_catalog(id),
  patient_diagnosis_id varchar(64) NOT NULL REFERENCES clinic.patient_diagnoses(id),
  external_prescription_id varchar(96) NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  dosage varchar(100) NOT NULL CHECK (btrim(dosage) <> ''),
  frequency_type varchar(20) NOT NULL DEFAULT 'DAILY' CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'AS_NEEDED')),
  units_per_dose numeric(9,3) NOT NULL CHECK (units_per_dose > 0),
  instructions text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id, organization_id) REFERENCES clinic.prescriptions(id, organization_id),
  UNIQUE (organization_id, external_prescription_id),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.prescription_schedules (
  id varchar(64) PRIMARY KEY,
  prescription_item_id varchar(64) NOT NULL REFERENCES clinic.prescription_items(id),
  scheduled_time time(0) NOT NULL,
  day_of_week smallint CHECK (day_of_week BETWEEN 0 AND 6),
  CHECK (extract(second FROM scheduled_time) = 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_prescription_schedule_daily
  ON clinic.prescription_schedules(prescription_item_id, scheduled_time) WHERE day_of_week IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_prescription_schedule_weekly
  ON clinic.prescription_schedules(prescription_item_id, day_of_week, scheduled_time) WHERE day_of_week IS NOT NULL;

CREATE TABLE IF NOT EXISTS clinic.appointments (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  doctor_id varchar(64) NOT NULL,
  specialty_id varchar(64) NOT NULL,
  site_id varchar(64) NOT NULL,
  encounter_id varchar(64),
  external_id varchar(96) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  room varchar(80) NOT NULL,
  status varchar(16) NOT NULL CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  instructions text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  FOREIGN KEY (doctor_id, specialty_id) REFERENCES clinic.doctor_specialties(doctor_id, specialty_id),
  FOREIGN KEY (site_id, organization_id) REFERENCES clinic.sites(id, organization_id),
  FOREIGN KEY (encounter_id, patient_id, organization_id) REFERENCES clinic.encounters(id, patient_id, organization_id),
  CHECK (ends_at > starts_at),
  UNIQUE (organization_id, external_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_start
  ON clinic.appointments(doctor_id, starts_at) WHERE status = 'SCHEDULED';
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_patient_start
  ON clinic.appointments(patient_id, starts_at) WHERE status = 'SCHEDULED';

CREATE TABLE IF NOT EXISTS clinic.observations (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  encounter_id varchar(64) NOT NULL,
  recorded_by_doctor_id varchar(64) NOT NULL,
  measured_at timestamptz NOT NULL,
  height_cm numeric(5,2) CHECK (height_cm BETWEEN 30 AND 260),
  weight_kg numeric(6,2) CHECK (weight_kg > 0 AND weight_kg <= 700),
  systolic smallint CHECK (systolic BETWEEN 1 AND 500),
  diastolic smallint CHECK (diastolic BETWEEN 1 AND 500),
  pulse smallint CHECK (pulse BETWEEN 1 AND 500),
  notes text NOT NULL DEFAULT '',
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (encounter_id, patient_id, organization_id) REFERENCES clinic.encounters(id, patient_id, organization_id),
  FOREIGN KEY (recorded_by_doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  CHECK (num_nonnulls(height_cm, weight_kg, systolic, diastolic, pulse) > 0),
  CHECK ((systolic IS NULL) = (diastolic IS NULL)),
  CHECK (systolic IS NULL OR systolic > diastolic)
);

CREATE TABLE IF NOT EXISTS clinic.service_catalog (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL REFERENCES clinic.organizations(id),
  code varchar(50) NOT NULL,
  name varchar(180) NOT NULL,
  category varchar(16) NOT NULL CHECK (category IN ('CONSULTATION', 'LABORATORY', 'PROCEDURE', 'OTHER')),
  reference_price numeric(12,2) NOT NULL CHECK (reference_price >= 0),
  currency char(3) NOT NULL DEFAULT 'PEN' CHECK (currency ~ '^[A-Z]{3}$'),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (organization_id, code),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.lab_test_catalog (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  service_id varchar(64) NOT NULL,
  code varchar(50) NOT NULL,
  name varchar(180) NOT NULL,
  specimen_type varchar(60) NOT NULL,
  result_unit varchar(40),
  is_active boolean NOT NULL DEFAULT true,
  FOREIGN KEY (service_id, organization_id) REFERENCES clinic.service_catalog(id, organization_id),
  UNIQUE (organization_id, code),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.lab_orders (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  encounter_id varchar(64) NOT NULL,
  ordering_doctor_id varchar(64) NOT NULL,
  order_number varchar(60) NOT NULL,
  ordered_at timestamptz NOT NULL,
  status varchar(16) NOT NULL CHECK (status IN ('ORDERED', 'COLLECTED', 'COMPLETED', 'CANCELLED')),
  instructions text NOT NULL DEFAULT '',
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (encounter_id, patient_id, organization_id) REFERENCES clinic.encounters(id, patient_id, organization_id),
  FOREIGN KEY (ordering_doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  UNIQUE (organization_id, order_number),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.lab_order_items (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  lab_order_id varchar(64) NOT NULL,
  test_id varchar(64) NOT NULL,
  collected_at timestamptz,
  FOREIGN KEY (lab_order_id, organization_id) REFERENCES clinic.lab_orders(id, organization_id),
  FOREIGN KEY (test_id, organization_id) REFERENCES clinic.lab_test_catalog(id, organization_id),
  UNIQUE (lab_order_id, test_id),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.lab_results (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  lab_order_item_id varchar(64) NOT NULL UNIQUE,
  validated_by_doctor_id varchar(64) NOT NULL,
  value_numeric numeric(14,4),
  value_text text,
  result_unit varchar(40),
  reference_low numeric(14,4),
  reference_high numeric(14,4),
  status varchar(12) NOT NULL CHECK (status IN ('FINAL', 'AMENDED')),
  resulted_at timestamptz NOT NULL,
  notes text NOT NULL DEFAULT '',
  FOREIGN KEY (lab_order_item_id, organization_id) REFERENCES clinic.lab_order_items(id, organization_id),
  FOREIGN KEY (validated_by_doctor_id, organization_id) REFERENCES clinic.doctors(id, organization_id),
  CHECK (num_nonnulls(value_numeric, value_text) = 1),
  CHECK (value_text IS NULL OR btrim(value_text) <> ''),
  CHECK (reference_low IS NULL OR reference_high IS NULL OR reference_low <= reference_high)
);

CREATE TABLE IF NOT EXISTS clinic.invoices (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  patient_id varchar(64) NOT NULL,
  encounter_id varchar(64),
  insurance_policy_id varchar(64),
  invoice_number varchar(60) NOT NULL,
  issued_at timestamptz NOT NULL,
  currency char(3) NOT NULL DEFAULT 'PEN' CHECK (currency ~ '^[A-Z]{3}$'),
  status varchar(16) NOT NULL CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID')),
  notes text NOT NULL DEFAULT '',
  FOREIGN KEY (patient_id, organization_id) REFERENCES clinic.patients(id, organization_id),
  FOREIGN KEY (encounter_id, patient_id, organization_id) REFERENCES clinic.encounters(id, patient_id, organization_id),
  FOREIGN KEY (insurance_policy_id, patient_id, organization_id) REFERENCES clinic.patient_insurance_policies(id, patient_id, organization_id),
  UNIQUE (organization_id, invoice_number),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS clinic.invoice_items (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  invoice_id varchar(64) NOT NULL,
  service_id varchar(64) NOT NULL,
  description varchar(240) NOT NULL,
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate BETWEEN 0 AND 100),
  line_total numeric(14,2) GENERATED ALWAYS AS
    (round(quantity * unit_price - discount_amount, 2) + round((quantity * unit_price - discount_amount) * tax_rate / 100, 2)) STORED,
  FOREIGN KEY (invoice_id, organization_id) REFERENCES clinic.invoices(id, organization_id),
  FOREIGN KEY (service_id, organization_id) REFERENCES clinic.service_catalog(id, organization_id),
  CHECK (discount_amount <= quantity * unit_price)
);

CREATE TABLE IF NOT EXISTS clinic.payments (
  id varchar(64) PRIMARY KEY,
  organization_id varchar(64) NOT NULL,
  invoice_id varchar(64) NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'PEN' CHECK (currency ~ '^[A-Z]{3}$'),
  payment_method varchar(16) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'INSURANCE')),
  transaction_reference varchar(100),
  status varchar(12) NOT NULL CHECK (status IN ('POSTED', 'VOID')),
  paid_at timestamptz NOT NULL,
  notes text NOT NULL DEFAULT '',
  FOREIGN KEY (invoice_id, organization_id) REFERENCES clinic.invoices(id, organization_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_transaction_reference
  ON clinic.payments(organization_id, transaction_reference) WHERE transaction_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS clinic.audit_log (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  organization_id varchar(64) REFERENCES clinic.organizations(id),
  entity_table varchar(100) NOT NULL,
  entity_key text NOT NULL,
  action varchar(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  actor_id text NOT NULL,
  change_reason text,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  transaction_id bigint NOT NULL DEFAULT txid_current(),
  old_row jsonb,
  new_row jsonb
);

-- Índices de consulta y de claves foráneas de los recorridos principales.
CREATE INDEX IF NOT EXISTS ix_contacts_patient ON clinic.patient_contacts(patient_id);
CREATE INDEX IF NOT EXISTS ix_allergies_patient ON clinic.patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS ix_policies_patient ON clinic.patient_insurance_policies(patient_id, status);
CREATE INDEX IF NOT EXISTS ix_encounters_patient_time ON clinic.encounters(patient_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_encounters_doctor_time ON clinic.encounters(doctor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_diagnoses_patient_status ON clinic.patient_diagnoses(patient_id, status);
CREATE INDEX IF NOT EXISTS ix_diagnoses_code ON clinic.patient_diagnoses(diagnosis_code);
CREATE INDEX IF NOT EXISTS ix_prescriptions_patient_dates ON clinic.prescriptions(patient_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS ix_prescription_items_header ON clinic.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS ix_prescription_items_diagnosis ON clinic.prescription_items(patient_diagnosis_id);
CREATE INDEX IF NOT EXISTS ix_appointments_patient_time ON clinic.appointments(patient_id, starts_at);
CREATE INDEX IF NOT EXISTS ix_appointments_site_time ON clinic.appointments(site_id, starts_at);
CREATE INDEX IF NOT EXISTS ix_observations_patient_time ON clinic.observations(patient_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS ix_lab_orders_patient_time ON clinic.lab_orders(patient_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS ix_lab_order_items_test ON clinic.lab_order_items(test_id);
CREATE INDEX IF NOT EXISTS ix_invoices_patient_time ON clinic.invoices(patient_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS ix_invoice_items_invoice ON clinic.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS ix_payments_invoice ON clinic.payments(invoice_id, status);
CREATE INDEX IF NOT EXISTS ix_audit_entity_time ON clinic.audit_log(entity_table, entity_key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_organization_time ON clinic.audit_log(organization_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION clinic.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- La receta apunta a un diagnóstico elegido expresamente por el médico del caso.
-- Este guardia comprueba pertenencia. No elige fármacos, dosis ni horarios.
CREATE OR REPLACE FUNCTION clinic.check_item_diagnosis_patient() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prescription_patient varchar(64); diagnosis_patient varchar(64); diagnosis_organization varchar(64);
BEGIN
  SELECT patient_id INTO prescription_patient FROM clinic.prescriptions WHERE id = NEW.prescription_id;
  SELECT patient_id, organization_id INTO diagnosis_patient, diagnosis_organization
    FROM clinic.patient_diagnoses WHERE id = NEW.patient_diagnosis_id;
  IF prescription_patient IS DISTINCT FROM diagnosis_patient
     OR NEW.organization_id IS DISTINCT FROM diagnosis_organization THEN
    RAISE EXCEPTION 'El diagnóstico de un item debe pertenecer al paciente y organización de su receta' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION clinic.capture_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE before_value jsonb; after_value jsonb; row_value jsonb; row_organization text; row_key text;
BEGIN
  IF TG_OP <> 'INSERT' THEN before_value := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN after_value := to_jsonb(NEW); END IF;
  row_value := coalesce(after_value, before_value);
  row_organization := row_value ->> 'organization_id';
  IF TG_TABLE_NAME = 'organizations' THEN row_organization := row_value ->> 'id'; END IF;
  row_key := coalesce(row_value ->> 'id', row_value ->> 'code',
    CASE WHEN row_value ? 'doctor_id' THEN (row_value ->> 'doctor_id') || '/' || (row_value ->> 'specialty_id') END,
    row_value ->> 'patient_id', '?');
  INSERT INTO clinic.audit_log(organization_id, entity_table, entity_key, action, actor_id, change_reason, old_row, new_row)
  VALUES (row_organization, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, row_key, TG_OP,
    coalesce(nullif(current_setting('clinic.actor_id', true), ''), current_user),
    nullif(current_setting('clinic.change_reason', true), ''), before_value, after_value);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION clinic.protect_audit_log() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La auditoría es de solo anexado; no se modifica desde los flujos de la aplicación' USING ERRCODE = '42501';
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['organizations','sites','doctors','patients','patient_contacts','encounters','prescriptions','prescription_items','appointments'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = format('clinic.%I', table_name)::regclass AND tgname = 'set_updated_at') THEN
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON clinic.%I FOR EACH ROW EXECUTE FUNCTION clinic.set_updated_at()', table_name);
    END IF;
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['organizations','sites','specialties','doctors','doctor_specialties','patients','patient_contacts','allergen_catalog','patient_allergy_status','patient_allergies','insurers','insurance_plans','patient_insurance_policies','medical_records','encounters','diagnosis_catalog','patient_diagnoses','medication_catalog','prescriptions','prescription_items','prescription_schedules','appointments','observations','service_catalog','lab_test_catalog','lab_orders','lab_order_items','lab_results','invoices','invoice_items','payments'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = format('clinic.%I', table_name)::regclass AND tgname = 'capture_audit_change') THEN
      EXECUTE format('CREATE TRIGGER capture_audit_change AFTER INSERT OR UPDATE OR DELETE ON clinic.%I FOR EACH ROW EXECUTE FUNCTION clinic.capture_audit_change()', table_name);
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'clinic.prescription_items'::regclass AND tgname = 'check_diagnosis_patient') THEN
    CREATE TRIGGER check_diagnosis_patient BEFORE INSERT OR UPDATE ON clinic.prescription_items
      FOR EACH ROW EXECUTE FUNCTION clinic.check_item_diagnosis_patient();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'clinic.audit_log'::regclass AND tgname = 'protect_audit_log') THEN
    CREATE TRIGGER protect_audit_log BEFORE UPDATE OR DELETE ON clinic.audit_log
      FOR EACH ROW EXECUTE FUNCTION clinic.protect_audit_log();
  END IF;
END;
$$;
COMMIT;
