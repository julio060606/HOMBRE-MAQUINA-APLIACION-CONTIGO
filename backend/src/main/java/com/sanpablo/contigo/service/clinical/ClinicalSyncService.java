package com.sanpablo.contigo.service.clinical;

import com.sanpablo.contigo.domain.clinical.*;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.repository.*;
import com.sanpablo.contigo.service.EventPublishingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

@Service
public class ClinicalSyncService {
    private static final Logger log = LoggerFactory.getLogger(ClinicalSyncService.class);
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private final ClinicalProvider simulatedProvider;
    private final ClinicalProvider externalProvider;
    private final ObjectProvider<ClinicalProvider> databaseProvider;
    private final String configuredMode;
    private final String databaseOrganization;
    private final PatientRepository patients;
    private final MedicationRepository medications;
    private final AppointmentRepository appointments;
    private final ClinicalProfileRepository profiles;
    private final PillIntakeRepository intakes;
    private final EventPublishingService events;
    private final SyncStateRecorder syncStates;
    private final TransactionTemplate applicationTransaction;

    public ClinicalSyncService(
            @Qualifier("simulatedClinicalProvider") ClinicalProvider simulatedProvider,
            @Qualifier("authorizedExternalClinicalProvider") ClinicalProvider externalProvider,
            @Qualifier("databaseClinicalProvider") ObjectProvider<ClinicalProvider> databaseProvider,
            @Value("${contigo.clinical-provider.mode:simulated}") String configuredMode,
            @Value("${contigo.clinical-provider.database.organization-id:clinic_demo}") String databaseOrganization,
            PatientRepository patients, MedicationRepository medications, AppointmentRepository appointments,
            ClinicalProfileRepository profiles, PillIntakeRepository intakes, EventPublishingService events,
            SyncStateRecorder syncStates, PlatformTransactionManager transactionManager) {
        this.simulatedProvider = simulatedProvider;
        this.externalProvider = externalProvider;
        this.databaseProvider = databaseProvider;
        this.configuredMode = configuredMode.toLowerCase(Locale.ROOT);
        if (!Set.of("simulated", "external", "database").contains(this.configuredMode)) throw new IllegalArgumentException("Modo de proveedor clínico no reconocido.");
        this.databaseOrganization = databaseOrganization;
        this.patients = patients; this.medications = medications; this.appointments = appointments;
        this.profiles = profiles; this.intakes = intakes; this.events = events; this.syncStates = syncStates;
        applicationTransaction = new TransactionTemplate(transactionManager);
        applicationTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public ClinicalProvider getActiveProvider() {
        return switch (configuredMode) {
            case "external" -> externalProvider;
            case "database" -> Objects.requireNonNull(databaseProvider.getIfAvailable(), "Proveedor de base clínica no configurado.");
            default -> simulatedProvider;
        };
    }

    /** Fetch before the application transaction; success is committed atomically with the imported data. */
    public void syncPatient(String patientId) {
        Patient patient = patients.findById(patientId).orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        if ("database".equals(configuredMode) && !databaseOrganization.equals(patient.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La integración clínica no está configurada para esta organización.");
        }
        String externalId = externalId(patient);
        try {
            ClinicalProvider provider = getActiveProvider();
            ClinicalProvider.Snapshot snapshot = provider.fetchSnapshot(externalId);
            validate(snapshot);
            applicationTransaction.executeWithoutResult(status -> {
                Patient locked = patients.findByIdWithLock(patientId).orElseThrow();
                if (!externalId.equals(externalId(locked))) throw new IllegalStateException("Cambió el vínculo clínico del paciente. Reintente la sincronización.");
                applySnapshot(locked, snapshot);
                locked.setLastSyncAt(Instant.now());
                patients.save(locked);
                syncStates.recordSuccess(patientId, locked.getOrganizationId(), "Sincronización completada desde " + provider.description() + ".");
                events.publish(event(locked));
            });
        } catch (RuntimeException error) {
            // This runs after transaction completion, including failures raised during flush/commit.
            syncStates.recordFailure(patientId, patient.getOrganizationId(),
                    "No se pudieron actualizar los datos de la clínica. Se conserva la última información disponible; se reintentará en la siguiente sincronización.");
            log.warn("Falló la sincronización del paciente {} ({})", patientId, error.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudieron actualizar los datos desde la clínica. Consulte el estado de sincronización o reintente.", error);
        }
    }

    private void applySnapshot(Patient patient, ClinicalProvider.Snapshot snapshot) {
        for (ClinicalProvider.PrescriptionData rx : snapshot.prescriptions()) {
            Medication med = medications.findByPatientIdAndExternalPrescriptionId(patient.getId(), rx.externalPrescriptionId()).orElseGet(Medication::new);
            boolean existing = med.getId() != null;
            if (existing && rx.version() < med.getVersion()) continue;
            boolean changed = existing && (rx.version() > med.getVersion() || !sameSchedule(med, rx));
            if (!existing) { med.setId(UUID.randomUUID().toString()); med.setPatientId(patient.getId()); med.setOrganizationId(patient.getOrganizationId()); med.setExternalPrescriptionId(rx.externalPrescriptionId()); }
            med.setVersion(rx.version()); med.setName(rx.name()); med.setDosage(rx.dosage()); med.setFormFactor(rx.formFactor());
            med.setTimesList(rx.times()); med.setFrequencyType(rx.frequencyType()); med.setStartDate(rx.startDate()); med.setEndDate(rx.endDate());
            med.setInstructions(rx.instructions()); med.setActive(rx.isActive()); med.setUnitsPerDose(rx.unitsPerDose()); med.setStockUnit(rx.stockUnit());
            med.setImageUrl(rx.imageUrl()); med.setDiagnosis(rx.diagnosis()); med.setDoctor(rx.doctor()); med.setSource("CLINIC"); med.setSyncedAt(Instant.now());
            medications.save(med);
            if (changed) {
                for (PillIntake dose : intakes.findPendingFutureByMedicationWithLock(med.getId(), Instant.now())) {
                    dose.setStatus("CANCELLED"); dose.setVersion(dose.getVersion() + 1);
                    dose.setReason("Cancelada por actualización de pauta clínica v" + rx.version()); intakes.save(dose);
                }
            }
            generateDosesForToday(patient, med);
        }
        for (ClinicalProvider.AppointmentData source : snapshot.appointments()) {
            Appointment appt = appointments.findByPatientIdAndExternalId(patient.getId(), source.externalId()).orElseGet(Appointment::new);
            if (appt.getId() == null) { appt.setId(UUID.randomUUID().toString()); appt.setPatientId(patient.getId()); appt.setOrganizationId(patient.getOrganizationId()); appt.setExternalId(source.externalId()); }
            appt.setStartsAt(source.startsAt()); appt.setSpecialty(source.specialty()); appt.setDoctor(source.doctor()); appt.setLocation(source.location());
            appt.setStatus(source.status()); appt.setInstructions(source.instructions()); appt.setSource("CLINIC"); appointments.save(appt);
        }
        ClinicalProvider.ProfileData source = snapshot.profile();
        if (source != null) {
            ClinicalProfile profile = profiles.findByPatientId(patient.getId()).orElseGet(ClinicalProfile::new);
            if (profile.getId() == null) { profile.setId(UUID.randomUUID().toString()); profile.setPatientId(patient.getId()); profile.setOrganizationId(patient.getOrganizationId()); }
            profile.setHeightCm(source.heightCm()); profile.setWeightKg(source.weightKg()); profile.setMeasuredAt(source.measuredAt()); profile.setNotes(source.notes()); profile.setSource("CLINIC"); profiles.save(profile);
        }
    }

    /** Generate each new local day from persisted prescriptions, even if the source database is temporarily down. */
    public void ensureDosesForToday(String patientId) {
        applicationTransaction.executeWithoutResult(status -> {
            Patient patient = patients.findByIdWithLock(patientId).orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
            int created = 0;
            for (Medication medication : medications.findByPatientId(patientId)) created += generateDosesForToday(patient, medication);
            if (created > 0) events.publish(event(patient));
        });
    }

    private int generateDosesForToday(Patient patient, Medication med) {
        if (!med.isActive() || !"DAILY".equalsIgnoreCase(med.getFrequencyType())) return 0;
        LocalDate today = LocalDate.now(LIMA);
        if (med.getStartDate() != null && today.isBefore(LocalDate.parse(med.getStartDate()))) return 0;
        if (med.getEndDate() != null && today.isAfter(LocalDate.parse(med.getEndDate()))) return 0;
        List<PillIntake> existing = new ArrayList<>(intakes.findByPatientIdAndScheduledDate(patient.getId(), today.toString()));
        int created = 0;
        for (String time : new LinkedHashSet<>(med.getTimesList())) {
            LocalTime localTime = LocalTime.parse(time);
            boolean occupied = existing.stream().anyMatch(dose -> med.getId().equals(dose.getMedicationId()) && time.equals(dose.getScheduledTime()) && !"CANCELLED".equals(dose.getStatus()));
            if (occupied) continue;
            PillIntake dose = new PillIntake(); dose.setId(UUID.randomUUID().toString()); dose.setPatientId(patient.getId()); dose.setOrganizationId(patient.getOrganizationId());
            dose.setMedicationId(med.getId()); dose.setMedicationName(med.getName()); dose.setDosage(med.getDosage()); dose.setImageUrl(med.getImageUrl());
            dose.setDiagnosis(med.getDiagnosis()); dose.setDoctor(med.getDoctor()); dose.setScheduledTime(time); dose.setScheduledDate(today.toString());
            dose.setScheduledAt(today.atTime(localTime).atZone(LIMA).toInstant()); dose.setStatus("PENDING"); dose.setInstructions(med.getInstructions());
            dose.setVersion(1); dose.setPrescriptionVersion(med.getVersion()); dose.setUnitsPerDose(med.getUnitsPerDose()); dose.setStockUnit(med.getStockUnit());
            intakes.save(dose); existing.add(dose); created++;
        }
        return created;
    }

    private static boolean sameSchedule(Medication med, ClinicalProvider.PrescriptionData rx) {
        return Objects.equals(med.getName(), rx.name()) && Objects.equals(med.getDosage(), rx.dosage())
                && Objects.equals(med.getTimesList(), rx.times()) && Objects.equals(med.getFrequencyType(), rx.frequencyType())
                && Objects.equals(med.getStartDate(), rx.startDate()) && Objects.equals(med.getEndDate(), rx.endDate())
                && med.isActive() == rx.isActive() && sameQuantity(med.getUnitsPerDose(), rx.unitsPerDose()) && Objects.equals(med.getStockUnit(), rx.stockUnit());
    }

    private static boolean sameQuantity(java.math.BigDecimal left, java.math.BigDecimal right) { return left == null ? right == null : right != null && left.compareTo(right) == 0; }

    private static void validate(ClinicalProvider.Snapshot snapshot) {
        if (snapshot == null || snapshot.prescriptions() == null || snapshot.appointments() == null) throw new IllegalArgumentException("Respuesta clínica incompleta.");
        Set<String> ids = new HashSet<>();
        for (var rx : snapshot.prescriptions()) {
            if (rx.externalPrescriptionId() == null || !ids.add(rx.externalPrescriptionId()) || rx.version() < 1 || rx.name() == null || rx.name().isBlank() || rx.dosage() == null || rx.formFactor() == null || rx.frequencyType() == null || rx.times() == null || rx.startDate() == null) throw new IllegalArgumentException("Prescripción clínica inválida o repetida.");
            LocalDate start = LocalDate.parse(rx.startDate());
            if (rx.endDate() != null && LocalDate.parse(rx.endDate()).isBefore(start)) throw new IllegalArgumentException("Vigencia clínica inválida.");
            Set<String> times = new HashSet<>();
            for (String time : rx.times()) { if (!times.add(time) || !time.matches("[0-2][0-9]:[0-5][0-9]")) throw new IllegalArgumentException("Horario clínico inválido o repetido."); LocalTime.parse(time); }
            if (rx.unitsPerDose() != null && rx.unitsPerDose().signum() <= 0) throw new IllegalArgumentException("Unidades por dosis inválidas.");
        }
        ids.clear();
        for (var appt : snapshot.appointments()) {
            if (appt.externalId() == null || !ids.add(appt.externalId()) || appt.startsAt() == null || appt.specialty() == null || appt.doctor() == null || appt.location() == null || !Set.of("SCHEDULED", "COMPLETED", "CANCELLED").contains(appt.status())) throw new IllegalArgumentException("Cita clínica inválida o repetida.");
        }
        if (snapshot.profile() != null && snapshot.profile().measuredAt() == null) throw new IllegalArgumentException("Ficha sin fecha clínica.");
    }

    private static String externalId(Patient patient) { return patient.getExternalPatientId() == null || patient.getExternalPatientId().isBlank() ? patient.getId() : patient.getExternalPatientId(); }
    private static DomainEventDto event(Patient patient) { return new DomainEventDto(UUID.randomUUID().toString(), "CLINICAL_DATA_UPDATED", patient.getOrganizationId(), patient.getId(), null, "Datos clínicos del proyecto actualizados"); }
}
