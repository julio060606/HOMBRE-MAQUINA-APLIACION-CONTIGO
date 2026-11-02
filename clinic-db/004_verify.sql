-- Read-only assertions for the initial synthetic fixture, not arbitrary edited data.
BEGIN READ ONLY;
DO $$
DECLARE actual_columns text[]; expected_columns text[];
BEGIN
  IF current_database() <> 'san_pablo_clinic' THEN
    RAISE EXCEPTION 'Execute fixture checks against san_pablo_clinic, not %', current_database();
  END IF;
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'clinic' AND table_type = 'BASE TABLE') <> 32 THEN
    RAISE EXCEPTION 'Expected 32 normalized clinic tables';
  END IF;
  expected_columns := ARRAY['external_patient_id','external_prescription_id','version','name','dosage','form_factor','times','frequency_type','start_date','end_date','instructions','is_active','units_per_dose','stock_unit','image_url','diagnosis','doctor'];
  SELECT array_agg(column_name::text ORDER BY ordinal_position) INTO actual_columns
    FROM information_schema.columns WHERE table_schema = 'clinic' AND table_name = 'contigo_prescriptions';
  IF actual_columns IS DISTINCT FROM expected_columns THEN RAISE EXCEPTION 'Prescription view contract differs: %', actual_columns; END IF;
  expected_columns := ARRAY['external_patient_id','external_id','starts_at','specialty','doctor','location','status','instructions'];
  SELECT array_agg(column_name::text ORDER BY ordinal_position) INTO actual_columns
    FROM information_schema.columns WHERE table_schema = 'clinic' AND table_name = 'contigo_appointments';
  IF actual_columns IS DISTINCT FROM expected_columns THEN RAISE EXCEPTION 'Appointment view contract differs: %', actual_columns; END IF;
  expected_columns := ARRAY['external_patient_id','height_cm','weight_kg','measured_at','notes'];
  SELECT array_agg(column_name::text ORDER BY ordinal_position) INTO actual_columns
    FROM information_schema.columns WHERE table_schema = 'clinic' AND table_name = 'contigo_profiles';
  IF actual_columns IS DISTINCT FROM expected_columns THEN RAISE EXCEPTION 'Profile view contract differs: %', actual_columns; END IF;
  IF (SELECT count(*) FROM information_schema.views WHERE table_schema='clinic' AND table_name LIKE 'contigo_%' AND is_updatable='NO') <> 3 THEN
    RAISE EXCEPTION 'All three integration views must be read-only';
  END IF;
  IF (SELECT count(*) FROM clinic.contigo_prescriptions WHERE external_patient_id='demo-pat_001') <> 2
     OR (SELECT count(*) FROM clinic.contigo_prescriptions WHERE external_patient_id='demo-pat_002') <> 1 THEN
    RAISE EXCEPTION 'Unexpected patient-specific prescription count';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM clinic.contigo_prescriptions WHERE external_patient_id='demo-pat_001'
      AND external_prescription_id='rx-med_001' AND dosage='50 mg' AND times='08:00,20:00'
      AND diagnosis LIKE 'I10%' AND doctor LIKE '%ficticio%' AND is_active AND end_date-start_date=90)
     OR NOT EXISTS (SELECT 1 FROM clinic.contigo_prescriptions WHERE external_patient_id='demo-pat_001'
      AND external_prescription_id='rx-med_002' AND dosage='2000 UI' AND times='14:00'
      AND diagnosis LIKE 'E55.9%' AND is_active AND end_date-start_date=90) THEN
    RAISE EXCEPTION 'Dacio prescription, timing, diagnosis, doctor or validity differs from fixture';
  END IF;
  IF EXISTS (SELECT 1 FROM clinic.contigo_prescriptions WHERE external_patient_id='demo-pat_001' AND external_prescription_id='rx-med_003')
    OR EXISTS (SELECT 1 FROM clinic.contigo_prescriptions WHERE external_patient_id='demo-pat_002' AND external_prescription_id IN ('rx-med_001','rx-med_002')) THEN
    RAISE EXCEPTION 'Prescription isolation violated';
  END IF;
  IF (SELECT count(*) FROM clinic.contigo_appointments WHERE external_patient_id='demo-pat_001') <> 2
    OR (SELECT count(*) FROM clinic.contigo_appointments WHERE external_patient_id='demo-pat_002') <> 1
    OR NOT EXISTS (SELECT 1 FROM clinic.contigo_appointments WHERE external_patient_id='demo-pat_001' AND external_id='external-pat_001')
    OR NOT EXISTS (SELECT 1 FROM clinic.contigo_appointments WHERE external_patient_id='demo-pat_002' AND external_id='external-pat_002') THEN
    RAISE EXCEPTION 'Appointment fixture or external identifiers differ';
  END IF;
  IF (SELECT count(*) FROM clinic.patient_allergy_status WHERE patient_id IN ('patient_demo_dacio','patient_demo_rosa') AND knowledge_status='UNKNOWN') <> 2 THEN
    RAISE EXCEPTION 'Unknown allergies must be explicit for both synthetic patients';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM clinic.contigo_profiles WHERE external_patient_id='demo-pat_001' AND height_cm=168 AND weight_kg=72
      AND notes LIKE '%I10%' AND notes LIKE '%E55.9%' AND notes LIKE '%desconocida%') THEN
    RAISE EXCEPTION 'Dacio anthropometric values, diagnoses or allergy note differs';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM clinic.invoice_balances WHERE invoice_id='invoice_demo_dacio'
      AND invoiced_amount=250 AND paid_amount=250 AND balance=0 AND mismatched_currency_count=0) THEN
    RAISE EXCEPTION 'Independent billing aggregates do not match fixture';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM clinic.audit_log WHERE entity_table='clinic.prescriptions' AND entity_key='prescription_demo_dacio'
      AND action='INSERT' AND actor_id='synthetic-clinic-seed') THEN
    RAISE EXCEPTION 'Expected initial prescription audit entry missing';
  END IF;
END;
$$;
SELECT 'PASS: fixture, exact view contracts, patient isolation, allergies, billing and initial audit' AS verification;
SELECT external_patient_id, external_prescription_id, dosage, times, diagnosis, doctor FROM clinic.contigo_prescriptions ORDER BY external_patient_id,external_prescription_id;
COMMIT;
