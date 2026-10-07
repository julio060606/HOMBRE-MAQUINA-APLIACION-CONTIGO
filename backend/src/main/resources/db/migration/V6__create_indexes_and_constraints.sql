-- V6__create_indexes_and_constraints.sql

CREATE INDEX IF NOT EXISTS idx_pill_intakes_patient_date
ON telemetry.pill_intakes (patient_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_bp_logs_patient_date
ON telemetry.blood_pressure_logs (patient_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_weight_logs_patient_date
ON telemetry.weight_logs (patient_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_medications_patient_active
ON clinical.medications (patient_id, is_active);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date
ON clinical.appointments (patient_id, starts_at ASC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_medication
ON telemetry.stock_movements (patient_id, medication_id);

CREATE INDEX IF NOT EXISTS idx_links_caregiver_active
ON auth.patient_caregiver_links (caregiver_id, is_active);

CREATE INDEX IF NOT EXISTS idx_links_patient_active
ON auth.patient_caregiver_links (patient_id, is_active);

CREATE INDEX IF NOT EXISTS idx_alert_events_patient
ON telemetry.alert_events (patient_id, timestamp DESC);
