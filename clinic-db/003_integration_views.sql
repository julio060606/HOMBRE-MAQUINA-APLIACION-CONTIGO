-- Read models for CONTIGO. No access to real San Pablo systems or patient data.
BEGIN;

CREATE OR REPLACE VIEW clinic.contigo_prescriptions AS
SELECT p.external_patient_id,
       item.external_prescription_id,
       item.version,
       med.name,
       item.dosage,
       med.form_factor,
       schedule.times,
       item.frequency_type,
       rx.start_date,
       rx.end_date,
       item.instructions,
       (item.is_active AND med.is_active AND rx.status = 'ACTIVE') AS is_active,
       item.units_per_dose,
       med.stock_unit,
       med.image_url,
       (dc.code || ' · ' || dc.description) AS diagnosis,
       (doc.given_names || ' ' || doc.family_names || ' (médico ficticio)') AS doctor
FROM clinic.prescription_items item
JOIN clinic.prescriptions rx ON rx.id = item.prescription_id AND rx.organization_id = item.organization_id
JOIN clinic.patients p ON p.id = rx.patient_id AND p.organization_id = rx.organization_id
JOIN clinic.medication_catalog med ON med.id = item.medication_id
JOIN clinic.patient_diagnoses pd ON pd.id = item.patient_diagnosis_id
  AND pd.patient_id = p.id AND pd.organization_id = p.organization_id
JOIN clinic.diagnosis_catalog dc ON dc.code = pd.diagnosis_code
JOIN clinic.doctors doc ON doc.id = rx.prescribing_doctor_id AND doc.organization_id = rx.organization_id
LEFT JOIN LATERAL (
  SELECT string_agg(to_char(s.scheduled_time, 'HH24:MI'), ',' ORDER BY s.scheduled_time) AS times
  FROM clinic.prescription_schedules s
  WHERE s.prescription_item_id = item.id AND s.day_of_week IS NULL
) schedule ON true
-- The current adapter represents only daily fixed-time prescriptions. It cannot
-- represent weekly day selection or PRN clinical conditions without information loss.
WHERE rx.status <> 'DRAFT' AND item.frequency_type = 'DAILY';

CREATE OR REPLACE VIEW clinic.contigo_appointments AS
SELECT p.external_patient_id,
       a.external_id,
       a.starts_at,
       specialty.name AS specialty,
       (doc.given_names || ' ' || doc.family_names || ' (médico ficticio)') AS doctor,
       (site.name || ' · ' || a.room) AS location,
       a.status,
       a.instructions
FROM clinic.appointments a
JOIN clinic.patients p ON p.id = a.patient_id AND p.organization_id = a.organization_id
JOIN clinic.doctors doc ON doc.id = a.doctor_id AND doc.organization_id = a.organization_id
JOIN clinic.specialties specialty ON specialty.id = a.specialty_id
JOIN clinic.sites site ON site.id = a.site_id AND site.organization_id = a.organization_id;

CREATE OR REPLACE VIEW clinic.contigo_profiles AS
SELECT p.external_patient_id,
       latest.height_cm,
       latest.weight_kg,
       latest.measured_at,
       concat_ws(' ',
         'Perfil exclusivamente sintético de una clínica ficticia; no contiene mediciones reales.',
         latest.notes,
         CASE WHEN diagnoses.summary IS NOT NULL THEN 'Diagnósticos asignados al caso ficticio: ' || diagnoses.summary || '.' END,
         CASE coalesce(allergy.knowledge_status, 'UNKNOWN')
           WHEN 'UNKNOWN' THEN 'Alergias: información desconocida; no equivale a ausencia de alergias.'
           WHEN 'NO_KNOWN' THEN 'Alergias: ausencia de alergias conocidas declarada en este caso sintético.'
           ELSE 'Alergias conocidas registradas; consultar el registro clínico sintético.'
         END,
         allergy.notes
       ) AS notes
FROM clinic.patients p
LEFT JOIN clinic.patient_allergy_status allergy ON allergy.patient_id = p.id AND allergy.organization_id = p.organization_id
LEFT JOIN LATERAL (
  SELECT o.height_cm, o.weight_kg, o.measured_at, o.notes
  FROM clinic.observations o
  WHERE o.patient_id = p.id AND o.organization_id = p.organization_id
    AND (o.height_cm IS NOT NULL OR o.weight_kg IS NOT NULL)
  ORDER BY o.measured_at DESC, o.id DESC
  LIMIT 1
) latest ON true
LEFT JOIN LATERAL (
  SELECT string_agg(dc.code || ' · ' || dc.description || ' — ' || doc.given_names || ' ' || doc.family_names
                   || ' (médico ficticio)', '; ' ORDER BY pd.diagnosed_at, pd.id) AS summary
  FROM clinic.patient_diagnoses pd
  JOIN clinic.diagnosis_catalog dc ON dc.code = pd.diagnosis_code
  JOIN clinic.doctors doc ON doc.id = pd.diagnosed_by_doctor_id AND doc.organization_id = pd.organization_id
  WHERE pd.patient_id = p.id AND pd.organization_id = p.organization_id AND pd.status = 'CONFIRMED'
) diagnoses ON true;

-- Derive amounts from independent aggregates: joining lines and payments directly
-- would multiply totals. Payment currency must be compared with invoice currency.
CREATE OR REPLACE VIEW clinic.invoice_balances AS
SELECT invoice.id AS invoice_id, invoice.organization_id, invoice.patient_id,
       invoice.invoice_number, invoice.currency, invoice.status,
       coalesce(lines.total, 0)::numeric(14,2) AS invoiced_amount,
       coalesce(paid.total, 0)::numeric(14,2) AS paid_amount,
       (coalesce(lines.total, 0) - coalesce(paid.total, 0))::numeric(14,2) AS balance,
       coalesce(paid.mismatched_currency_count, 0) AS mismatched_currency_count
FROM clinic.invoices invoice
LEFT JOIN LATERAL (
  SELECT sum(item.line_total) AS total FROM clinic.invoice_items item WHERE item.invoice_id = invoice.id
) lines ON true
LEFT JOIN LATERAL (
  SELECT sum(payment.amount) FILTER (WHERE payment.currency = invoice.currency) AS total,
         count(*) FILTER (WHERE payment.currency <> invoice.currency) AS mismatched_currency_count
  FROM clinic.payments payment WHERE payment.invoice_id = invoice.id AND payment.status = 'POSTED'
) paid ON true;

COMMENT ON VIEW clinic.contigo_prescriptions IS 'Read-only daily fixed-time prescription projection for the fictional CONTIGO clinic. Cancelled rows remain available for synchronization; dates retain their independent validity semantics.';
COMMENT ON VIEW clinic.contigo_appointments IS 'Read-only fictional appointment projection; cancelled/past appointments remain visible so synchronization can update existing records.';
COMMENT ON VIEW clinic.contigo_profiles IS 'Read-only synthetic profile projection; latest available anthropometric observation, explicit unknown allergies and human-authored fictional diagnoses.';
REVOKE ALL ON clinic.contigo_prescriptions, clinic.contigo_appointments, clinic.contigo_profiles, clinic.invoice_balances FROM PUBLIC;
COMMIT;
