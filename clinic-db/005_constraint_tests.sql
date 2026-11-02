-- Run as the clinic owner against the initial fixture. All trial changes roll back.
BEGIN;
SET LOCAL clinic.actor_id = 'constraint-test-rollback';
DO $$
DECLARE rejected boolean; trial_org text := 'test_org_' || txid_current(); trial_site text := 'test_site_' || txid_current();
BEGIN
  rejected := false;
  BEGIN
    UPDATE clinic.prescription_items SET patient_diagnosis_id='diagnosis_demo_rosa_e119' WHERE external_prescription_id='rx-med_001';
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: cross-patient prescription diagnosis accepted'; END IF;

  rejected := false;
  BEGIN
    UPDATE clinic.prescription_items SET units_per_dose=-1 WHERE external_prescription_id='rx-med_001';
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: negative dose units accepted'; END IF;

  rejected := false;
  BEGIN
    INSERT INTO clinic.prescription_schedules(id,prescription_item_id,scheduled_time)
      VALUES ('test_duplicate_schedule','prescription_item_demo_losartan','08:00');
  EXCEPTION WHEN unique_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: duplicate daily schedule accepted'; END IF;

  INSERT INTO clinic.organizations(id,code,name) VALUES(trial_org,trial_org,'Organización sintética temporal para prueba');
  INSERT INTO clinic.sites(id,organization_id,code,name,address,city)
    VALUES(trial_site,trial_org,'TEST','Sede temporal','Dirección de prueba','Ciudad de prueba');
  rejected := false;
  BEGIN
    UPDATE clinic.appointments SET site_id=trial_site WHERE id='appointment_demo_dacio_ger';
  EXCEPTION WHEN foreign_key_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: cross-organization appointment site accepted'; END IF;

  rejected := false;
  BEGIN
    UPDATE clinic.appointments SET ends_at=starts_at-INTERVAL '1 minute' WHERE id='appointment_demo_dacio_ger';
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: negative appointment duration accepted'; END IF;

  rejected := false;
  BEGIN
    UPDATE clinic.audit_log SET change_reason='Attempted alteration' WHERE id=(SELECT min(id) FROM clinic.audit_log);
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: audit alteration accepted'; END IF;

  rejected := false;
  BEGIN
    UPDATE clinic.contigo_prescriptions SET dosage='999 mg' WHERE external_prescription_id='rx-med_001';
  EXCEPTION WHEN object_not_in_prerequisite_state THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'FAIL: integration view is writable'; END IF;

  RAISE NOTICE 'PASS: seven negative integrity checks; outer transaction will roll back all temporary rows';
END;
$$;
ROLLBACK;
