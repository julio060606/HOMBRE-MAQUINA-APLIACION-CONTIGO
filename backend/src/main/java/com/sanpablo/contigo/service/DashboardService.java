package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.clinical.Patient;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.dto.clinical.*;
import com.sanpablo.contigo.dto.telemetry.*;
import com.sanpablo.contigo.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final PatientService patientService;
    private final IntakeService intakeService;
    private final InventoryService inventoryService;
    private final TelemetryService telemetryService;
    private final AuditLogRepository auditRepository;
    private final AuthorizationService authorizationService;

    public DashboardService(PatientService patientService,
                            IntakeService intakeService,
                            InventoryService inventoryService,
                            TelemetryService telemetryService,
                            AuditLogRepository auditRepository,
                            AuthorizationService authorizationService) {
        this.patientService = patientService;
        this.intakeService = intakeService;
        this.inventoryService = inventoryService;
        this.telemetryService = telemetryService;
        this.auditRepository = auditRepository;
        this.authorizationService = authorizationService;
    }

    public DashboardDto getDashboard(User actor, String patientId, String date) {
        Patient patient = authorizationService.authorizePatientAccess(actor, patientId);

        String localDateStr = date != null ? date : LocalDate.now(ZoneId.of("America/Lima")).toString();

        PatientDto patientDto = patientService.getPatient(actor, patientId);
        List<MedicationDto> medications = patientService.getPrescriptions(actor, patientId);
        List<PillIntakeDto> allDoses = intakeService.getDoses(actor, patientId, null, null);
        ClinicalSettingsDto settings = patientService.getSettings(actor, patientId);

        Instant now = Instant.now();
        long toleranceMs = (long) settings.getNotifyMissedDoseMinutes() * 60 * 1000;

        List<PillIntakeDto> evaluatedDoses = new ArrayList<>();
        List<AlertEventDto> unconfirmedAlerts = new ArrayList<>();

        for (PillIntakeDto d : allDoses) {
            String status = d.getStatus();
            if ("PENDING".equals(status)) {
                if (now.isAfter(d.getScheduledAt().plusMillis(toleranceMs))) {
                    status = "UNCONFIRMED";
                }
            }
            d.setStatus(status);
            evaluatedDoses.add(d);

            if ("UNCONFIRMED".equals(status) && localDateStr.equals(d.getScheduledDate())) {
                AlertEventDto alert = new AlertEventDto();
                alert.setId("unconfirmed:" + d.getId());
                alert.setPatientId(patientId);
                alert.setPatientName(patient.getFullName());
                alert.setType("MISSED_MEDICATION");
                alert.setTitle("Sin confirmar: " + d.getMedicationName());
                alert.setDescription("Dosis de las " + d.getScheduledTime() + ". No indica que el paciente afirmó no tomarla.");
                alert.setTimestamp(d.getScheduledAt());
                alert.setSeverity("WARNING");
                alert.setResolved(false);
                alert.setNotificationStatus("REGISTERED");
                unconfirmedAlerts.add(alert);
            }
        }

        List<PillIntakeDto> todayDoses = evaluatedDoses.stream()
                .filter(d -> localDateStr.equals(d.getScheduledDate()))
                .sorted((a, b) -> a.getScheduledAt().compareTo(b.getScheduledAt()))
                .collect(Collectors.toList());

        List<BloodPressureLogDto> pressures = telemetryService.getPressures(actor, patientId, null, null);
        List<WeightLogDto> weights = telemetryService.getWeights(actor, patientId, null, null);
        List<SupplyDto> supplies = inventoryService.getSupplies(actor, patientId);
        List<StockMovementDto> movements = inventoryService.getMovements(actor, patientId);
        List<AppointmentDto> appointments = patientService.getAppointments(actor, patientId);
        ClinicalProfileDto profile = patientService.getClinicalProfile(actor, patientId);
        List<AlertEventDto> savedAlerts = telemetryService.getAlerts(actor, patientId);

        List<AlertEventDto> combinedAlerts = new ArrayList<>(savedAlerts);
        combinedAlerts.addAll(unconfirmedAlerts);
        combinedAlerts.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

        List<AuditLogDto> audit = auditRepository.findByPatientIdOrderByRecordedAtDesc(patientId).stream()
                .limit(30)
                .map(AuditLogDto::new)
                .collect(Collectors.toList());

        DashboardDto dashboard = new DashboardDto();
        dashboard.setPatient(patientDto);
        dashboard.setMedications(medications);
        dashboard.setToday(todayDoses);
        dashboard.setHistory(evaluatedDoses);
        dashboard.setPressures(pressures);
        dashboard.setWeights(weights);
        dashboard.setSupplies(supplies);
        dashboard.setMovements(movements);
        dashboard.setAppointments(appointments);
        dashboard.setProfile(profile);
        dashboard.setSettings(settings);
        dashboard.setAlerts(combinedAlerts);
        dashboard.setAudit(audit);

        return dashboard;
    }
}
