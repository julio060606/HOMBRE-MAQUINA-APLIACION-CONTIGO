-- V7__seed_initial_data.sql

-- Organizations
INSERT INTO clinical.organizations (id, name, tax_id, time_zone, is_active)
VALUES 
('clinic_demo', 'Clínica San Pablo Demo', '20100128456', 'America/Lima', TRUE),
('clinic_sur', 'Clínica Sur Red', '20987654321', 'America/Lima', TRUE);

-- Initial users (password: Contigo2026! encoded with BCrypt)
INSERT INTO auth.users (id, email, password_hash, name, role, organization_id, patient_id, phone, is_active)
VALUES
('caregiver_demo', 'cuidador@contigo.example', '$2a$10$EW86GLPewvdh8tWMy14S6.beEnnw87RUweJWIvF3loCp4aO55fxf.', 'Cuidador de demostración', 'ROLE_CAREGIVER', 'clinic_demo', NULL, '999888777', TRUE),
('patient_dacio', 'dacio@contigo.example', '$2a$10$EW86GLPewvdh8tWMy14S6.beEnnw87RUweJWIvF3loCp4aO55fxf.', 'Dacio Ramos', 'ROLE_PATIENT', 'clinic_demo', 'pat_001', '987654321', TRUE),
('patient_rosa', 'rosa@contigo.example', '$2a$10$EW86GLPewvdh8tWMy14S6.beEnnw87RUweJWIvF3loCp4aO55fxf.', 'Rosa Martínez', 'ROLE_PATIENT', 'clinic_demo', 'pat_002', '987654322', TRUE),
('caregiver_unlinked', 'sinvinculo@contigo.example', '$2a$10$EW86GLPewvdh8tWMy14S6.beEnnw87RUweJWIvF3loCp4aO55fxf.', 'Cuidador sin vínculo', 'ROLE_CAREGIVER', 'clinic_demo', NULL, '999111222', TRUE),
('caregiver_other_clinic', 'cuidador_sur@contigo.example', '$2a$10$EW86GLPewvdh8tWMy14S6.beEnnw87RUweJWIvF3loCp4aO55fxf.', 'Cuidador Clínica Sur', 'ROLE_CAREGIVER', 'clinic_sur', NULL, '999333444', TRUE),
('admin_demo', 'admin@contigo.example', '$2a$10$EW86GLPewvdh8tWMy14S6.beEnnw87RUweJWIvF3loCp4aO55fxf.', 'Administrador Clínico', 'ROLE_CLINIC_ADMIN', 'clinic_demo', NULL, '999555666', TRUE);

-- Patients
INSERT INTO clinical.patients (id, organization_id, external_patient_id, full_name, age, emergency_phone, medical_notes, relationship, is_online, last_sync_at, easy_mode_enabled, voice_guide_enabled)
VALUES
('pat_001', 'clinic_demo', 'demo-pat_001', 'Dacio Ramos', 78, '999888777', 'Ficha de prueba del programa de seguimiento.', 'Papá', FALSE, CURRENT_TIMESTAMP, TRUE, TRUE),
('pat_002', 'clinic_demo', 'demo-pat_002', 'Rosa Martínez', 74, '999888777', 'Paciente sintético para comprobar aislamiento.', 'Mamá', FALSE, CURRENT_TIMESTAMP, TRUE, TRUE);

-- Links
INSERT INTO auth.patient_caregiver_links (id, patient_id, caregiver_id, relationship, is_active, linked_at)
VALUES
('link_001', 'pat_001', 'caregiver_demo', 'Hijo / Hija', TRUE, CURRENT_TIMESTAMP),
('link_002', 'pat_002', 'caregiver_demo', 'Hijo / Hija', TRUE, CURRENT_TIMESTAMP);

-- Clinical profiles
INSERT INTO clinical.clinical_profiles (id, patient_id, organization_id, height_cm, weight_kg, measured_at, source, notes)
VALUES
('prof_001', 'pat_001', 'clinic_demo', 168.0, 72.0, CURRENT_TIMESTAMP, 'CLINIC', 'Evaluación geriátrica periódica'),
('prof_002', 'pat_002', 'clinic_demo', 159.0, 61.0, CURRENT_TIMESTAMP, 'CLINIC', 'Evaluación médica preventiva');

-- Clinical settings
INSERT INTO clinical.clinical_settings (patient_id, organization_id, notify_missed_dose_minutes, voice_volume_level, repeat_alarm_count, voice_guide_enabled, easy_mode_enabled, high_contrast, large_text)
VALUES
('pat_001', 'clinic_demo', 30, 50.0, 1, TRUE, TRUE, FALSE, FALSE),
('pat_002', 'clinic_demo', 30, 50.0, 1, TRUE, TRUE, FALSE, FALSE);

-- Medications
INSERT INTO clinical.medications (id, patient_id, organization_id, external_prescription_id, version, name, dosage, form_factor, times, frequency_type, start_date, end_date, duration_days, instructions, is_active, source, units_per_dose, stock_unit)
VALUES
('med_001', 'pat_001', 'clinic_demo', 'rx-med_001', 1, 'Losartán', '50 mg', 'TABLET', '08:00,20:00', 'DAILY', '2026-09-23', '2026-12-22', 90, 'Tomar con abundante agua después de los alimentos.', TRUE, 'CLINIC', 1.0, 'tabletas'),
('med_002', 'pat_001', 'clinic_demo', 'rx-med_002', 1, 'Vitamina D3', '2000 UI', 'TABLET', '14:00', 'DAILY', '2026-09-23', '2026-12-22', 90, 'Tomar al mediodía con almuerzo.', TRUE, 'CLINIC', 1.0, 'tabletas'),
('med_003', 'pat_002', 'clinic_demo', 'rx-med_003', 1, 'Tratamiento de ejemplo', 'Consultar indicación clínica', 'TABLET', '09:00', 'DAILY', '2026-09-23', '2026-12-22', 90, 'Indicación sintética para probar la interfaz; no es una receta para uso real.', TRUE, 'CLINIC', 1.0, 'unidades');

-- Stock movements
INSERT INTO telemetry.stock_movements (id, patient_id, medication_id, quantity, kind, unit, reason, actor_id, recorded_at)
VALUES
('supply_med_001', 'pat_001', 'med_001', 30.0, 'INITIAL', 'tabletas', 'Dispensación clínica simulada', 'clinic_provider_demo', CURRENT_TIMESTAMP),
('supply_med_002', 'pat_001', 'med_002', 3.0, 'INITIAL', 'tabletas', 'Dispensación clínica simulada', 'clinic_provider_demo', CURRENT_TIMESTAMP);

-- Appointments
INSERT INTO clinical.appointments (id, patient_id, organization_id, external_id, starts_at, specialty, doctor, location, status, instructions, source)
VALUES
('appt_pat_001', 'pat_001', 'clinic_demo', 'external-pat_001', CURRENT_TIMESTAMP + INTERVAL '2' DAY, 'Geriatría', 'Dr. Manuel Vargas', 'Consultorio 302 · Sede Central San Pablo', 'SCHEDULED', 'Traer últimos análisis de sangre y lista de medicamentos.', 'CLINIC'),
('appt_pat_002', 'pat_002', 'clinic_demo', 'external-pat_002', CURRENT_TIMESTAMP + INTERVAL '3' DAY, 'Medicina General', 'Dra. Carmen Solís', 'Consultorio 105 · Sede Miraflores', 'SCHEDULED', 'Ayuno de 8 horas previo a la consulta.', 'CLINIC');

-- Pairing PIN
INSERT INTO auth.pairing_pin_requests (id, pin, patient_id, expires_at)
VALUES
('pin_req_001', '123456', 'pat_001', CURRENT_TIMESTAMP + INTERVAL '1' HOUR);
