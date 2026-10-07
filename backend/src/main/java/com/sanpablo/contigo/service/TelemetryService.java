package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.clinical.Patient;
import com.sanpablo.contigo.domain.telemetry.AlertEvent;
import com.sanpablo.contigo.domain.telemetry.AuditLog;
import com.sanpablo.contigo.domain.telemetry.BloodPressureLog;
import com.sanpablo.contigo.domain.telemetry.IdempotencyRecord;
import com.sanpablo.contigo.domain.telemetry.WeightLog;
import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.dto.telemetry.AlertEventDto;
import com.sanpablo.contigo.dto.telemetry.BloodPressureLogDto;
import com.sanpablo.contigo.dto.telemetry.PressureInputRequest;
import com.sanpablo.contigo.dto.telemetry.WeightInputRequest;
import com.sanpablo.contigo.dto.telemetry.WeightLogDto;
import com.sanpablo.contigo.repository.AlertEventRepository;
import com.sanpablo.contigo.repository.AuditLogRepository;
import com.sanpablo.contigo.repository.BloodPressureLogRepository;
import com.sanpablo.contigo.repository.IdempotencyRecordRepository;
import com.sanpablo.contigo.repository.WeightLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TelemetryService {

    private final BloodPressureLogRepository bpRepository;
    private final WeightLogRepository weightRepository;
    private final AlertEventRepository alertRepository;
    private final AuditLogRepository auditRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final AuthorizationService authorizationService;
    private final EventPublishingService eventPublishingService;

    public TelemetryService(BloodPressureLogRepository bpRepository,
                            WeightLogRepository weightRepository,
                            AlertEventRepository alertRepository,
                            AuditLogRepository auditRepository,
                            IdempotencyRecordRepository idempotencyRepository,
                            AuthorizationService authorizationService,
                            EventPublishingService eventPublishingService) {
        this.bpRepository = bpRepository;
        this.weightRepository = weightRepository;
        this.alertRepository = alertRepository;
        this.auditRepository = auditRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.authorizationService = authorizationService;
        this.eventPublishingService = eventPublishingService;
    }

    public List<BloodPressureLogDto> getPressures(User actor, String patientId, String from, String to) {
        authorizationService.authorizePatientAccess(actor, patientId);
        List<BloodPressureLog> logs;
        if (from != null && to != null) {
            logs = bpRepository.findByPatientIdAndRecordedAtBetweenOrderByRecordedAtDesc(patientId, Instant.parse(from), Instant.parse(to));
        } else {
            logs = bpRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        }
        return logs.stream().map(BloodPressureLogDto::new).collect(Collectors.toList());
    }

    public List<WeightLogDto> getWeights(User actor, String patientId, String from, String to) {
        authorizationService.authorizePatientAccess(actor, patientId);
        List<WeightLog> logs;
        if (from != null && to != null) {
            logs = weightRepository.findByPatientIdAndRecordedAtBetweenOrderByRecordedAtDesc(patientId, Instant.parse(from), Instant.parse(to));
        } else {
            logs = weightRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        }
        return logs.stream().map(WeightLogDto::new).collect(Collectors.toList());
    }

    public List<AlertEventDto> getAlerts(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return alertRepository.findByPatientIdOrderByTimestampDesc(patientId).stream()
                .map(AlertEventDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public BloodPressureLogDto recordBloodPressure(User actor, String patientId, PressureInputRequest req) {
        Patient patient = authorizationService.authorizePatientWrite(actor, patientId);

        String operationKey = actor.getId() + ":bp:" + req.getOperationId();
        String fingerprint = patientId + ":" + req.getSystolic() + ":" + req.getDiastolic() + ":" + req.getPulse();

        Optional<IdempotencyRecord> existingOp = idempotencyRepository.findByOperationKey(operationKey);
        if (existingOp.isPresent()) {
            if (!existingOp.get().getFingerprint().equals(fingerprint)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Medición repetida con datos diferentes");
            }
            return bpRepository.findById(existingOp.get().getResourceId())
                    .map(BloodPressureLogDto::new)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Registro no encontrado"));
        }

        BloodPressureLog log = new BloodPressureLog();
        log.setId(UUID.randomUUID().toString());
        log.setPatientId(patientId);
        log.setOrganizationId(patient.getOrganizationId());
        log.setSystolic(req.getSystolic());
        log.setDiastolic(req.getDiastolic());
        log.setPulse(req.getPulse());
        log.setRecordedAt(req.getRecordedAt() != null ? Instant.parse(req.getRecordedAt()) : Instant.now());
        log.setReceivedAt(Instant.now());
        log.setActorId(actor.getId());
        log.setRecordedVia("MANUAL_PATIENT");
        log.setSource("HOME");
        log.setStatus("UNCLASSIFIED");
        log.setNotes(req.getNotes());

        log = bpRepository.save(log);

        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "MEASUREMENT_RECORDED",
                "Presión " + req.getSystolic() + "/" + req.getDiastolic() + " mmHg · registro doméstico"
        );
        auditRepository.save(audit);

        idempotencyRepository.save(new IdempotencyRecord(
                UUID.randomUUID().toString(),
                operationKey,
                fingerprint,
                log.getId(),
                "SAVED"
        ));

        BloodPressureLogDto dto = new BloodPressureLogDto(log);
        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "MEASUREMENT_RECORDED",
                patient.getOrganizationId(),
                patientId,
                log.getId(),
                dto
        ));

        return dto;
    }

    @Transactional
    public WeightLogDto recordWeight(User actor, String patientId, WeightInputRequest req) {
        Patient patient = authorizationService.authorizePatientWrite(actor, patientId);

        String operationKey = actor.getId() + ":weight:" + req.getOperationId();
        String fingerprint = patientId + ":" + req.getWeightKg();

        Optional<IdempotencyRecord> existingOp = idempotencyRepository.findByOperationKey(operationKey);
        if (existingOp.isPresent()) {
            if (!existingOp.get().getFingerprint().equals(fingerprint)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Medición de peso repetida con datos diferentes");
            }
            return weightRepository.findById(existingOp.get().getResourceId())
                    .map(WeightLogDto::new)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Registro no encontrado"));
        }

        WeightLog log = new WeightLog(
                UUID.randomUUID().toString(),
                patientId,
                patient.getOrganizationId(),
                req.getWeightKg(),
                req.getRecordedAt() != null ? Instant.parse(req.getRecordedAt()) : Instant.now(),
                actor.getId()
        );
        log = weightRepository.save(log);

        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "MEASUREMENT_RECORDED",
                "Peso doméstico " + req.getWeightKg() + " kg"
        );
        auditRepository.save(audit);

        idempotencyRepository.save(new IdempotencyRecord(
                UUID.randomUUID().toString(),
                operationKey,
                fingerprint,
                log.getId(),
                "SAVED"
        ));

        WeightLogDto dto = new WeightLogDto(log);
        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "MEASUREMENT_RECORDED",
                patient.getOrganizationId(),
                patientId,
                log.getId(),
                dto
        ));

        return dto;
    }

    @Transactional
    public AlertEventDto triggerSos(User actor, String patientId, String operationId) {
        Patient patient = authorizationService.authorizePatientWrite(actor, patientId);

        String operationKey = actor.getId() + ":sos:" + operationId;
        String fingerprint = patientId + ":SOS";

        Optional<IdempotencyRecord> existingOp = idempotencyRepository.findByOperationKey(operationKey);
        if (existingOp.isPresent()) {
            return alertRepository.findById(existingOp.get().getResourceId())
                    .map(AlertEventDto::new)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Registro de alerta no encontrado"));
        }

        AlertEvent alert = new AlertEvent(
                UUID.randomUUID().toString(),
                patientId,
                patient.getFullName(),
                "PANIC_BUTTON",
                "Petición de auxilio de paciente",
                "Alerta generada por el paciente desde su aplicación. Requiere verificación de bienestar.",
                Instant.now(),
                "CRITICAL"
        );
        alert = alertRepository.save(alert);

        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "HELP_REQUESTED",
                "Alerta SOS generada por el paciente"
        );
        auditRepository.save(audit);

        idempotencyRepository.save(new IdempotencyRecord(
                UUID.randomUUID().toString(),
                operationKey,
                fingerprint,
                alert.getId(),
                "SAVED"
        ));

        AlertEventDto dto = new AlertEventDto(alert);
        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "ALERT_CREATED",
                patient.getOrganizationId(),
                patientId,
                alert.getId(),
                dto
        ));

        return dto;
    }

    @Transactional
    public AlertEventDto acknowledgeAlert(User actor, String patientId, String alertId) {
        Patient patient = authorizationService.authorizePatientAccess(actor, patientId);

        AlertEvent alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerta no encontrada"));

        if (!patientId.equals(alert.getPatientId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerta no corresponde al paciente");
        }

        if (actor.getRole() == com.sanpablo.contigo.domain.auth.UserRole.ROLE_PATIENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Un paciente no puede atender o reconocer alertas");
        }

        alert.setNotificationStatus("ACKNOWLEDGED");
        alert.setResolved(true);
        alert.setAcknowledgedAt(Instant.now());
        alert.setAcknowledgedBy(actor.getId());

        alert = alertRepository.save(alert);

        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "ALERT_ACKNOWLEDGED",
                "Alerta " + alert.getTitle() + " atendida por " + actor.getName()
        );
        auditRepository.save(audit);

        AlertEventDto dto = new AlertEventDto(alert);
        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "ALERT_UPDATED",
                patient.getOrganizationId(),
                patientId,
                alert.getId(),
                dto
        ));

        return dto;
    }
}
