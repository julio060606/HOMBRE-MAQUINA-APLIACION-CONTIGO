-- Add origin metadata without changing applied V1-V8 migrations or historical intake answers.
ALTER TABLE clinical.medications ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE clinical.medications ADD COLUMN IF NOT EXISTS doctor VARCHAR(255);
ALTER TABLE telemetry.pill_intakes ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE telemetry.pill_intakes ADD COLUMN IF NOT EXISTS doctor VARCHAR(255);

UPDATE clinical.organizations SET name = 'Clínica San Pablo · Proyecto ficticio', tax_id = NULL WHERE id = 'clinic_demo';
UPDATE clinical.patients SET emergency_phone = '', medical_notes = 'Paciente ficticio del proyecto académico CONTIGO. No corresponde a una historia clínica real.' WHERE id IN ('pat_001', 'pat_002');
UPDATE auth.users SET phone = '' WHERE id IN ('caregiver_demo', 'patient_dacio', 'patient_rosa', 'caregiver_unlinked', 'admin_demo');
UPDATE clinical.medications SET image_url = '/images/losartan_pill.jpg' WHERE id = 'med_001' AND image_url IS NULL;
UPDATE clinical.medications SET image_url = '/images/vitamina_d3.jpg' WHERE id = 'med_002' AND image_url IS NULL;
UPDATE clinical.clinical_profiles SET notes = 'Ficha inicial ficticia para pruebas del proyecto. La sincronización reemplaza esta información con las vistas de la base clínica separada.' WHERE patient_id IN ('pat_001', 'pat_002');
