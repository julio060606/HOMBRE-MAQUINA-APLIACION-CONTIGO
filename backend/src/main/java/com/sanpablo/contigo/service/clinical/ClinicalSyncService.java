package com.sanpablo.contigo.service.clinical;

import com.sanpablo.contigo.domain.clinical.Appointment;
import com.sanpablo.contigo.domain.clinical.ClinicalProfile;
import com.sanpablo.contigo.domain.clinical.ClinicalSyncState;
import com.sanpablo.contigo.domain.clinical.Medication;
import com.sanpablo.contigo.domain.clinical.Patient;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.repository.AppointmentRepository;
import com.sanpablo.contigo.repository.ClinicalProfileRepository;
import com.sanpablo.contigo.repository.ClinicalSyncStateRepository;
import com.sanpablo.contigo.repository.MedicationRepository;
import com.sanpablo.contigo.repository.PatientRepository;
import com.sanpablo.contigo.repository.PillIntakeRepository;
import com.sanpablo.contigo.service.EventPublishingService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ClinicalSyncService {

    private final ClinicalProvider simulatedProvider;
    private final ClinicalProvider externalProvider;
    private final String configuredMode;
    private final PatientRepository patientRepository;
    private final MedicationRepository medicationRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicalProfileRepository profileRepository;
    private final PillIntakeRepository intakeRepository;
    private final ClinicalSyncStateRepository syncStateRepository;
    private final EventPublishingService eventPublishingService;
    private final SyncStateRecorder syncStateRecorder;

    public ClinicalSyncService(
            @Qualifier("simulatedClinicalProvider") ClinicalProvider simulatedProvider,
            @Qualifier("authorizedExternalClinicalProvider") ClinicalProvider externalProvider,
            @Value("${contigo.clinical-provider.mode:simulated}") String configuredMode,
            PatientRepository patientRepository,
            MedicationRepository medicationRepository,
            AppointmentRepository appointmentRepository,
            ClinicalProfileRepository profileRepository,
            PillIntakeRepository intakeRepository,
            ClinicalSyncStateRepository syncStateRepository,
            EventPublishingService eventPublishingService,
            SyncStateRecorder syncStateRecorder) {
        this.simulatedProvider = simulatedProvider;
        this.externalProvider = externalProvider;
        this.configuredMode = configuredMode;
        this.patientRepository = patientRepository;
        this.medicationRepository = medicationRepository;
        this.appointmentRepository = appointmentRepository;
        this.profileRepository = profileRepository;
        this.intakeRepository = intakeRepository;
        this.syncStateRepository = syncStateRepository;
        this.eventPublishingService = eventPublishingService;
        this.syncStateRecorder = syncStateRecorder;
    }

    public ClinicalProvider getActiveProvider() {
        return "external".equalsIgnoreCase(configuredMode) ? externalProvider : simulatedProvider;
    }

    @Transactional
    public void syncPatient(String patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));

        String extId = patient.getExternalPatientId() != null ? patient.getExternalPatientId() : patient.getId();
        ClinicalProvider provider = getActiveProvider();

        try {
            // 1. Prescriptions
            List<ClinicalProvider.PrescriptionData> prescriptions = provider.fetchPrescriptions(extId);
            for (ClinicalProvider.PrescriptionData rx : prescriptions) {
                Optional<Medication> existingOpt = medicationRepository.findByPatientIdAndExternalPrescriptionId(patientId, rx.externalPrescriptionId());
                Medication med;
                if (existingOpt.isPresent()) {
                    med = existingOpt.get();
                    boolean versionIncreased = rx.version() > med.getVersion();
                    if (rx.version() >= med.getVersion()) {
                        med.setVersion(rx.version());
                        med.setName(rx.name());
                        med.setDosage(rx.dosage());
                        med.setFormFactor(rx.formFactor());
                        med.setTimesList(rx.times());
                        med.setFrequencyType(rx.frequencyType());
                        med.setStartDate(rx.startDate());
                        med.setEndDate(rx.endDate());
                        med.setInstructions(rx.instructions());
                        med.setActive(rx.isActive());
                        med.setUnitsPerDose(rx.unitsPerDose());
                        med.setStockUnit(rx.stockUnit());
                        med.setSyncedAt(Instant.now());
                        med = medicationRepository.save(med);

                        if (versionIncreased) {
                            // Invariant: Only cancel future PENDING doses when prescription version increases
                            List<PillIntake> pendingFuture = intakeRepository.findByMedicationIdAndStatus(med.getId(), "PENDING");
                            for (PillIntake p : pendingFuture) {
                                if (p.getScheduledAt().isAfter(Instant.now())) {
                                p.setStatus("CANCELLED");
                                p.setReason("Cancelada por actualización de pauta clínica v" + rx.version());
                                intakeRepository.save(p);
                                }
                            }
                        }
                        // Generate updated doses for today if active
                        generateDosesForToday(patient, med);
                    }
                } else {
                    med = new Medication();
                    med.setId(UUID.randomUUID().toString());
                    med.setPatientId(patientId);
                    med.setOrganizationId(patient.getOrganizationId());
                    med.setExternalPrescriptionId(rx.externalPrescriptionId());
                    med.setVersion(rx.version());
                    med.setName(rx.name());
                    med.setDosage(rx.dosage());
                    med.setFormFactor(rx.formFactor());
                    med.setTimesList(rx.times());
                    med.setFrequencyType(rx.frequencyType());
                    med.setStartDate(rx.startDate());
                    med.setEndDate(rx.endDate());
                    med.setInstructions(rx.instructions());
                    med.setActive(rx.isActive());
                    med.setUnitsPerDose(rx.unitsPerDose());
                    med.setStockUnit(rx.stockUnit());
                    med.setSource("CLINIC");
                    med.setSyncedAt(Instant.now());
                    med = medicationRepository.save(med);

                    generateDosesForToday(patient, med);
                }
            }

            // 2. Appointments
            List<ClinicalProvider.AppointmentData> appointments = provider.fetchAppointments(extId);
            for (ClinicalProvider.AppointmentData appt : appointments) {
                Optional<Appointment> apptOpt = appointmentRepository.findByPatientIdAndExternalId(patientId, appt.externalId());
                Appointment appointment = apptOpt.orElseGet(Appointment::new);
                if (appointment.getId() == null) {
                    appointment.setId(UUID.randomUUID().toString());
                    appointment.setPatientId(patientId);
                    appointment.setOrganizationId(patient.getOrganizationId());
                    appointment.setExternalId(appt.externalId());
                    appointment.setSource("CLINIC");
                }
                appointment.setStartsAt(appt.startsAt());
                appointment.setSpecialty(appt.specialty());
                appointment.setDoctor(appt.doctor());
                appointment.setLocation(appt.location());
                appointment.setStatus(appt.status());
                appointment.setInstructions(appt.instructions());
                appointmentRepository.save(appointment);
            }

            // 3. Clinical Profile
            ClinicalProvider.ProfileData profile = provider.fetchProfile(extId);
            if (profile != null) {
                ClinicalProfile prof = profileRepository.findByPatientId(patientId).orElseGet(ClinicalProfile::new);
                if (prof.getId() == null) {
                    prof.setId(UUID.randomUUID().toString());
                    prof.setPatientId(patientId);
                    prof.setOrganizationId(patient.getOrganizationId());
                    prof.setSource("CLINIC");
                }
                prof.setHeightCm(profile.heightCm());
                prof.setWeightKg(profile.weightKg());
                prof.setMeasuredAt(profile.measuredAt());
                prof.setNotes(profile.notes());
                profileRepository.save(prof);
            }

            // 4. Update sync state via independent transaction
            syncStateRecorder.recordSuccess(patientId, patient.getOrganizationId(),
                    "Sincronización exitosa con proveedor " + (provider.isLiveConnection() ? "real" : "simulado"));

            patient.setLastSyncAt(Instant.now());
            patientRepository.save(patient);

            eventPublishingService.publish(new DomainEventDto(
                    UUID.randomUUID().toString(),
                    "CLINICAL_DATA_UPDATED",
                    patient.getOrganizationId(),
                    patientId,
                    null,
                    "Datos clínicos actualizados"
            ));
        } catch (Exception e) {
            syncStateRecorder.recordFailure(patientId, patient.getOrganizationId(),
                    "Error en sincronización: " + e.getMessage());
            throw e;
        }
    }

    private void generateDosesForToday(Patient patient, Medication med) {
        if (!med.isActive()) return;
        LocalDate today = LocalDate.now(ZoneId.of("America/Lima"));
        String todayStr = today.toString();

        if (med.getStartDate() != null) {
            try {
                LocalDate start = LocalDate.parse(med.getStartDate());
                if (today.isBefore(start)) return;
            } catch (Exception ignored) {}
        }
        if (med.getEndDate() != null) {
            try {
                LocalDate end = LocalDate.parse(med.getEndDate());
                if (today.isAfter(end)) return;
            } catch (Exception ignored) {}
        }

        if (med.getFrequencyType() != null && "INTERVAL".equalsIgnoreCase(med.getFrequencyType())) {
            return;
        }

        List<PillIntake> existingToday = intakeRepository.findByPatientIdAndScheduledDate(patient.getId(), todayStr);

        for (String time : med.getTimesList()) {
            String[] parts = time.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);

            Instant scheduledAt = today.atTime(hour, minute)
                    .atZone(ZoneId.of("America/Lima"))
                    .toInstant();

            boolean exists = existingToday.stream().anyMatch(d ->
                    d.getMedicationId().equals(med.getId()) && d.getScheduledTime().equals(time) && !"CANCELLED".equals(d.getStatus()));

            if (!exists) {
                PillIntake intake = new PillIntake();
                intake.setId(UUID.randomUUID().toString());
                intake.setPatientId(patient.getId());
                intake.setOrganizationId(patient.getOrganizationId());
                intake.setMedicationId(med.getId());
                intake.setMedicationName(med.getName());
                intake.setDosage(med.getDosage());
                intake.setImageUrl(med.getImageUrl());
                intake.setScheduledTime(time);
                intake.setScheduledDate(todayStr);
                intake.setScheduledAt(scheduledAt);
                intake.setStatus("PENDING");
                intake.setInstructions(med.getInstructions());
                intake.setVersion(1);
                intake.setPrescriptionVersion(med.getVersion());
                intake.setUnitsPerDose(med.getUnitsPerDose());
                intake.setStockUnit(med.getStockUnit());
                intakeRepository.save(intake);
            }
        }
    }
}
