-- Datos de la clínica ficticia San Pablo para el proyecto CONTIGO.
-- Todos los pacientes, profesionales, documentos, importes y resultados son sintéticos.
-- ON CONFLICT DO NOTHING conserva modificaciones posteriores y evita duplicados.
BEGIN;
SET LOCAL TIME ZONE 'America/Lima';
SELECT set_config('clinic.actor_id', 'synthetic-clinic-seed', true);
SELECT set_config('clinic.change_reason', 'Carga inicial explícita de datos académicos sintéticos', true);

INSERT INTO clinic.organizations(id, code, name)
VALUES ('clinic_demo', 'SAN-PABLO-FICTICIA', 'Clínica San Pablo ficticia del proyecto CONTIGO')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.sites(id, organization_id, code, name, address, city)
VALUES
  ('site_demo_central', 'clinic_demo', 'CENTRAL-DEMO', 'Sede Central de demostración', 'Dirección académica ficticia 100; no corresponde a un establecimiento real', 'Lima ficticia'),
  ('site_demo_norte', 'clinic_demo', 'NORTE-DEMO', 'Sede Norte de demostración', 'Dirección académica ficticia 200; no corresponde a un establecimiento real', 'Lima ficticia')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.specialties(id, code, name)
VALUES ('specialty_geriatrics', 'GERIATRICS', 'Geriatría'),
       ('specialty_cardiology', 'CARDIOLOGY', 'Cardiología'),
       ('specialty_general', 'GENERAL-MEDICINE', 'Medicina general')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.doctors(id, organization_id, primary_site_id, external_doctor_id, given_names, family_names, registration_code)
VALUES
  ('doctor_demo_ger', 'clinic_demo', 'site_demo_central', 'SYN-DOCTOR-001', 'Lucía', 'Valdés', 'FICT-CMP-001'),
  ('doctor_demo_cardio', 'clinic_demo', 'site_demo_central', 'SYN-DOCTOR-002', 'Mateo', 'Salazar', 'FICT-CMP-002'),
  ('doctor_demo_general', 'clinic_demo', 'site_demo_norte', 'SYN-DOCTOR-003', 'Camila', 'Torres', 'FICT-CMP-003')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.doctor_specialties(doctor_id, specialty_id)
VALUES ('doctor_demo_ger', 'specialty_geriatrics'),
       ('doctor_demo_cardio', 'specialty_cardiology'),
       ('doctor_demo_general', 'specialty_general')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.patients(id, organization_id, external_patient_id, chart_number, given_names, family_names, birth_date, sex_at_birth)
VALUES
  ('patient_demo_dacio', 'clinic_demo', 'demo-pat_001', 'FICT-HC-0001', 'Dacio', 'Ramos', (CURRENT_DATE - INTERVAL '78 years')::date, 'MALE'),
  ('patient_demo_rosa', 'clinic_demo', 'demo-pat_002', 'FICT-HC-0002', 'Rosa', 'Martínez', (CURRENT_DATE - INTERVAL '72 years')::date, 'FEMALE')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.patient_contacts(id, organization_id, patient_id, contact_kind, contact_name, relationship, email, is_primary)
VALUES
  ('contact_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'FAMILY', 'Familiar ficticio de Dacio', 'Hijo / Hija', 'familia.dacio@example.invalid', true),
  ('contact_demo_rosa', 'clinic_demo', 'patient_demo_rosa', 'FAMILY', 'Familiar ficticio de Rosa', 'Hijo / Hija', 'familia.rosa@example.invalid', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinic.allergen_catalog(id, code, name, allergen_kind)
VALUES ('allergen_demo_penicillin', 'SYN-PENICILLIN', 'Penicilina, entrada de catálogo de demostración', 'MEDICATION')
ON CONFLICT DO NOTHING;

-- Desconocido se conserva como UNKNOWN; no se interpreta la ausencia de filas como ausencia de alergias.
INSERT INTO clinic.patient_allergy_status(patient_id, organization_id, knowledge_status, reviewed_by_doctor_id, notes)
VALUES
  ('patient_demo_dacio', 'clinic_demo', 'UNKNOWN', 'doctor_demo_ger', 'Alergias desconocidas en el caso sintético. No equivale a ninguna alergia.'),
  ('patient_demo_rosa', 'clinic_demo', 'UNKNOWN', 'doctor_demo_general', 'Alergias desconocidas en el caso sintético. No equivale a ninguna alergia.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.insurers(id, code, name)
VALUES ('insurer_demo', 'FICT-INSURER', 'Aseguradora académica ficticia')
ON CONFLICT DO NOTHING;
INSERT INTO clinic.insurance_plans(id, insurer_id, code, name)
VALUES ('plan_demo_senior', 'insurer_demo', 'SENIOR-DEMO', 'Plan Senior de demostración')
ON CONFLICT DO NOTHING;
INSERT INTO clinic.patient_insurance_policies(id, organization_id, patient_id, plan_id, policy_number, starts_on, ends_on, coverage_percent, status)
VALUES
  ('policy_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'plan_demo_senior', 'FICT-POL-0001', CURRENT_DATE - 30, CURRENT_DATE + 335, 80, 'ACTIVE'),
  ('policy_demo_rosa', 'clinic_demo', 'patient_demo_rosa', 'plan_demo_senior', 'FICT-POL-0002', CURRENT_DATE - 30, CURRENT_DATE + 335, 70, 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.medical_records(id, organization_id, patient_id, notes)
VALUES
  ('record_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'Historia íntegramente sintética. Seguimiento académico de hipertensión y deficiencia de vitamina D.'),
  ('record_demo_rosa', 'clinic_demo', 'patient_demo_rosa', 'Historia íntegramente sintética para comprobar aislamiento entre pacientes.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.encounters(id, organization_id, patient_id, medical_record_id, doctor_id, specialty_id, site_id, occurred_at, encounter_type, status, reason, clinical_notes)
VALUES
  ('encounter_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'record_demo_dacio', 'doctor_demo_ger', 'specialty_geriatrics', 'site_demo_central',
    (CURRENT_DATE - 7 + TIME '09:00') AT TIME ZONE 'America/Lima', 'OUTPATIENT', 'SIGNED',
    'Consulta de seguimiento ficticia', 'Escenario académico. Diagnósticos y receta elegidos expresamente por el profesional ficticio; no son recomendaciones médicas.'),
  ('encounter_demo_rosa', 'clinic_demo', 'patient_demo_rosa', 'record_demo_rosa', 'doctor_demo_general', 'specialty_general', 'site_demo_norte',
    (CURRENT_DATE - 5 + TIME '10:00') AT TIME ZONE 'America/Lima', 'OUTPATIENT', 'SIGNED',
    'Consulta ficticia para un segundo paciente', 'Caso sintético independiente de Dacio; sirve para comprobar permisos y filtros.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.diagnosis_catalog(code, description)
VALUES ('I10', 'Hipertensión esencial (primaria)'),
       ('E55.9', 'Deficiencia de vitamina D, no especificada'),
       ('E11.9', 'Diabetes mellitus tipo 2 sin complicaciones, caso sintético')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.patient_diagnoses(id, organization_id, patient_id, encounter_id, diagnosis_code, diagnosed_by_doctor_id, diagnosis_kind, status, diagnosed_at, notes)
VALUES
  ('diagnosis_demo_dacio_i10', 'clinic_demo', 'patient_demo_dacio', 'encounter_demo_dacio', 'I10', 'doctor_demo_ger', 'PRIMARY', 'CONFIRMED',
    (CURRENT_DATE - 7 + TIME '09:10') AT TIME ZONE 'America/Lima', 'Diagnóstico asignado al personaje ficticio de Dacio; no inferido por CONTIGO.'),
  ('diagnosis_demo_dacio_e559', 'clinic_demo', 'patient_demo_dacio', 'encounter_demo_dacio', 'E55.9', 'doctor_demo_ger', 'SECONDARY', 'CONFIRMED',
    (CURRENT_DATE - 7 + TIME '09:12') AT TIME ZONE 'America/Lima', 'Diagnóstico sintético elegido para documentar la procedencia de la receta del caso.'),
  ('diagnosis_demo_rosa_e119', 'clinic_demo', 'patient_demo_rosa', 'encounter_demo_rosa', 'E11.9', 'doctor_demo_general', 'PRIMARY', 'CONFIRMED',
    (CURRENT_DATE - 5 + TIME '10:10') AT TIME ZONE 'America/Lima', 'Diagnóstico del segundo personaje ficticio. No mezclar con la historia de Dacio.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.medication_catalog(id, code, name, generic_name, form_factor, stock_unit, image_url)
VALUES
  ('drug_demo_losartan', 'SYN-LOSARTAN-TABLET', 'Losartán', 'Losartán', 'TABLET', 'tabletas', '/images/losartan_pill.jpg'),
  ('drug_demo_vitd3', 'SYN-VITD3-TABLET', 'Vitamina D3', 'Colecalciferol', 'TABLET', 'tabletas', '/images/vitamina_d3.jpg'),
  ('drug_demo_metformin', 'SYN-METFORMIN-TABLET', 'Metformina', 'Metformina', 'TABLET', 'tabletas', '/images/metformina.jpg')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.prescriptions(id, organization_id, patient_id, encounter_id, prescribing_doctor_id, external_document_id, issued_at, start_date, end_date, status, notes)
VALUES
  ('prescription_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'encounter_demo_dacio', 'doctor_demo_ger', 'FICT-RX-DACIO-001',
    (CURRENT_DATE + TIME '08:00') AT TIME ZONE 'America/Lima', CURRENT_DATE, CURRENT_DATE + 90, 'ACTIVE',
    'Receta ficticia escrita expresamente para el caso académico. No existe una regla de prescripción automática por diagnóstico.'),
  ('prescription_demo_rosa', 'clinic_demo', 'patient_demo_rosa', 'encounter_demo_rosa', 'doctor_demo_general', 'FICT-RX-ROSA-001',
    (CURRENT_DATE + TIME '08:00') AT TIME ZONE 'America/Lima', CURRENT_DATE, CURRENT_DATE + 90, 'ACTIVE',
    'Receta ficticia de Rosa para comprobar que la importación no incluye datos de otro paciente.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.prescription_items(id, organization_id, prescription_id, medication_id, patient_diagnosis_id, external_prescription_id, version, dosage, frequency_type, units_per_dose, instructions)
VALUES
  ('prescription_item_demo_losartan', 'clinic_demo', 'prescription_demo_dacio', 'drug_demo_losartan', 'diagnosis_demo_dacio_i10', 'rx-med_001', 1,
    '50 mg', 'DAILY', 1, 'Tomar con agua en ayunas. Indicación del profesional ficticio para este caso académico.'),
  ('prescription_item_demo_vitd3', 'clinic_demo', 'prescription_demo_dacio', 'drug_demo_vitd3', 'diagnosis_demo_dacio_e559', 'rx-med_002', 1,
    '2000 UI', 'DAILY', 1, 'Tomar con el almuerzo. Indicación del profesional ficticio para este caso académico.'),
  ('prescription_item_demo_metformin', 'clinic_demo', 'prescription_demo_rosa', 'drug_demo_metformin', 'diagnosis_demo_rosa_e119', 'rx-med_003', 1,
    '850 mg', 'DAILY', 1, 'Tomar con el desayuno. Receta ficticia correspondiente únicamente a Rosa.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.prescription_schedules(id, prescription_item_id, scheduled_time)
VALUES
  ('schedule_demo_losartan_0800', 'prescription_item_demo_losartan', TIME '08:00'),
  ('schedule_demo_losartan_2000', 'prescription_item_demo_losartan', TIME '20:00'),
  ('schedule_demo_vitd3_1400', 'prescription_item_demo_vitd3', TIME '14:00'),
  ('schedule_demo_metformin_0900', 'prescription_item_demo_metformin', TIME '09:00')
ON CONFLICT DO NOTHING;

-- Las dos citas futuras de Dacio y la cita de Rosa tienen identificadores estables.
INSERT INTO clinic.appointments(id, organization_id, patient_id, doctor_id, specialty_id, site_id, external_id, starts_at, ends_at, room, status, instructions)
VALUES
  ('appointment_demo_dacio_ger', 'clinic_demo', 'patient_demo_dacio', 'doctor_demo_ger', 'specialty_geriatrics', 'site_demo_central', 'external-pat_001',
    (CURRENT_DATE + 7 + TIME '10:30') AT TIME ZONE 'America/Lima', (CURRENT_DATE + 7 + TIME '11:00') AT TIME ZONE 'America/Lima',
    'Consultorio académico 01', 'SCHEDULED', 'Cita ficticia. Llevar la lista de registros de demostración de CONTIGO.'),
  ('appointment_demo_dacio_cardio', 'clinic_demo', 'patient_demo_dacio', 'doctor_demo_cardio', 'specialty_cardiology', 'site_demo_central', 'clinic-appt-dacio-cardio-02',
    (CURRENT_DATE + 30 + TIME '09:00') AT TIME ZONE 'America/Lima', (CURRENT_DATE + 30 + TIME '09:30') AT TIME ZONE 'America/Lima',
    'Consultorio académico 02', 'SCHEDULED', 'Seguimiento ficticio de cardiología. La aplicación no reprograma esta cita.'),
  ('appointment_demo_rosa_general', 'clinic_demo', 'patient_demo_rosa', 'doctor_demo_general', 'specialty_general', 'site_demo_norte', 'external-pat_002',
    (CURRENT_DATE + 9 + TIME '11:00') AT TIME ZONE 'America/Lima', (CURRENT_DATE + 9 + TIME '11:30') AT TIME ZONE 'America/Lima',
    'Consultorio académico 03', 'SCHEDULED', 'Cita ficticia del caso de Rosa. No pertenece al paciente Dacio.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.observations(id, organization_id, patient_id, encounter_id, recorded_by_doctor_id, measured_at, height_cm, weight_kg, systolic, diastolic, pulse, notes)
VALUES
  ('observation_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'encounter_demo_dacio', 'doctor_demo_ger',
    (CURRENT_DATE - 7 + TIME '09:05') AT TIME ZONE 'America/Lima', 168, 72, 120, 80, 76,
    'Valores sintéticos de la atención ficticia. No sustituyen mediciones domésticas ni resultados reales.'),
  ('observation_demo_rosa', 'clinic_demo', 'patient_demo_rosa', 'encounter_demo_rosa', 'doctor_demo_general',
    (CURRENT_DATE - 5 + TIME '10:05') AT TIME ZONE 'America/Lima', 159, 61, 118, 78, NULL,
    'Datos sintéticos de Rosa. Pulso no registrado; NULL se conserva sin convertirlo en cero.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.service_catalog(id, organization_id, code, name, category, reference_price)
VALUES
  ('service_demo_geriatrics', 'clinic_demo', 'FICT-CONS-GER', 'Consulta ficticia de geriatría', 'CONSULTATION', 180),
  ('service_demo_cardiology', 'clinic_demo', 'FICT-CONS-CARD', 'Consulta ficticia de cardiología', 'CONSULTATION', 200),
  ('service_demo_general', 'clinic_demo', 'FICT-CONS-GEN', 'Consulta ficticia de medicina general', 'CONSULTATION', 120),
  ('service_demo_vitd', 'clinic_demo', 'FICT-LAB-VITD', 'Determinación ficticia de vitamina D', 'LABORATORY', 70),
  ('service_demo_creatinine', 'clinic_demo', 'FICT-LAB-CREA', 'Determinación ficticia de creatinina', 'LABORATORY', 40)
ON CONFLICT DO NOTHING;

INSERT INTO clinic.lab_test_catalog(id, organization_id, service_id, code, name, specimen_type, result_unit)
VALUES
  ('lab_test_demo_vitd', 'clinic_demo', 'service_demo_vitd', 'FICT-VITD-25OH', 'Vitamina D, determinación sintética', 'Sangre de demostración', 'ng/mL'),
  ('lab_test_demo_creatinine', 'clinic_demo', 'service_demo_creatinine', 'FICT-CREATININE', 'Creatinina, determinación sintética', 'Sangre de demostración', 'mg/dL')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.lab_orders(id, organization_id, patient_id, encounter_id, ordering_doctor_id, order_number, ordered_at, status, instructions)
VALUES
  ('lab_order_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'encounter_demo_dacio', 'doctor_demo_ger', 'FICT-LAB-0001',
    (CURRENT_DATE - 7 + TIME '09:20') AT TIME ZONE 'America/Lima', 'COMPLETED', 'Orden ficticia para probar el modelo de exámenes y resultados.'),
  ('lab_order_demo_rosa', 'clinic_demo', 'patient_demo_rosa', 'encounter_demo_rosa', 'doctor_demo_general', 'FICT-LAB-0002',
    (CURRENT_DATE - 5 + TIME '10:20') AT TIME ZONE 'America/Lima', 'ORDERED', 'Orden ficticia pendiente; no inventar un resultado para Rosa.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.lab_order_items(id, organization_id, lab_order_id, test_id, collected_at)
VALUES
  ('lab_item_demo_dacio_vitd', 'clinic_demo', 'lab_order_demo_dacio', 'lab_test_demo_vitd', (CURRENT_DATE - 6 + TIME '08:00') AT TIME ZONE 'America/Lima'),
  ('lab_item_demo_dacio_crea', 'clinic_demo', 'lab_order_demo_dacio', 'lab_test_demo_creatinine', (CURRENT_DATE - 6 + TIME '08:00') AT TIME ZONE 'America/Lima'),
  ('lab_item_demo_rosa_crea', 'clinic_demo', 'lab_order_demo_rosa', 'lab_test_demo_creatinine', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO clinic.lab_results(id, organization_id, lab_order_item_id, validated_by_doctor_id, value_numeric, result_unit, status, resulted_at, notes)
VALUES
  ('lab_result_demo_dacio_vitd', 'clinic_demo', 'lab_item_demo_dacio_vitd', 'doctor_demo_ger', 20.5, 'ng/mL', 'FINAL',
    (CURRENT_DATE - 4 + TIME '12:00') AT TIME ZONE 'America/Lima', 'Resultado totalmente sintético. Sin rango de referencia ni interpretación clínica configurados.'),
  ('lab_result_demo_dacio_crea', 'clinic_demo', 'lab_item_demo_dacio_crea', 'doctor_demo_ger', 1.0, 'mg/dL', 'FINAL',
    (CURRENT_DATE - 4 + TIME '12:00') AT TIME ZONE 'America/Lima', 'Resultado totalmente sintético. No activa ni cambia una receta automáticamente.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.invoices(id, organization_id, patient_id, encounter_id, invoice_number, issued_at, status, notes)
VALUES ('invoice_demo_dacio', 'clinic_demo', 'patient_demo_dacio', 'encounter_demo_dacio', 'FICT-INV-0001',
  (CURRENT_DATE - 7 + TIME '11:00') AT TIME ZONE 'America/Lima', 'PAID',
  'Factura ficticia. Importes ilustrativos; no acredita facturación real ni una regla tributaria.')
ON CONFLICT DO NOTHING;

INSERT INTO clinic.invoice_items(id, organization_id, invoice_id, service_id, description, quantity, unit_price, tax_rate)
VALUES
  ('invoice_item_demo_consult', 'clinic_demo', 'invoice_demo_dacio', 'service_demo_geriatrics', 'Consulta ficticia de geriatría del caso Dacio', 1, 180, 0),
  ('invoice_item_demo_lab', 'clinic_demo', 'invoice_demo_dacio', 'service_demo_vitd', 'Determinación ficticia de vitamina D', 1, 70, 0)
ON CONFLICT DO NOTHING;

INSERT INTO clinic.payments(id, organization_id, invoice_id, amount, payment_method, transaction_reference, status, paid_at, notes)
VALUES
  ('payment_demo_dacio_01', 'clinic_demo', 'invoice_demo_dacio', 100, 'CASH', 'FICT-CASH-0001', 'POSTED',
    (CURRENT_DATE - 7 + TIME '11:05') AT TIME ZONE 'America/Lima', 'Pago de demostración. No representa un movimiento de dinero.'),
  ('payment_demo_dacio_02', 'clinic_demo', 'invoice_demo_dacio', 150, 'TRANSFER', 'FICT-TRANSFER-0002', 'POSTED',
    (CURRENT_DATE - 7 + TIME '11:10') AT TIME ZONE 'America/Lima', 'Transferencia ficticia sin banco ni cuenta real.')
ON CONFLICT DO NOTHING;
COMMIT;
