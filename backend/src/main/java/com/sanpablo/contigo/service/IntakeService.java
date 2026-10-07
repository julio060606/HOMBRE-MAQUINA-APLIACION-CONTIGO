package com.sanpablo.contigo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.clinical.Medication;
import com.sanpablo.contigo.domain.clinical.Patient;
import com.sanpablo.contigo.domain.telemetry.AuditLog;
import com.sanpablo.contigo.domain.telemetry.IdempotencyRecord;
import com.sanpablo.contigo.domain.telemetry.IntakeCorrection;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.domain.telemetry.StockMovement;
import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.dto.telemetry.IntakeCorrectionRequest;
import com.sanpablo.contigo.dto.telemetry.IntakeResponseRequest;
import com.sanpablo.contigo.dto.telemetry.PillIntakeDto;
import com.sanpablo.contigo.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IntakeService {

    private final PillIntakeRepository intakeRepository;
    private final IntakeCorrectionRepository correctionRepository;
    private final StockMovementRepository movementRepository;
    private final MedicationRepository medicationRepository;
    private final AuditLogRepository auditRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final AuthorizationService authorizationService;
    private final EventPublishingService eventPublishingService;
    private final ObjectMapper objectMapper;

    public IntakeService(PillIntakeRepository intakeRepository,
                         IntakeCorrectionRepository correctionRepository,
                         StockMovementRepository movementRepository,
                         MedicationRepository medicationRepository,
                         AuditLogRepository auditRepository,
                         IdempotencyRecordRepository idempotencyRepository,
                         AuthorizationService authorizationService,
                         EventPublishingService eventPublishingService,
                         ObjectMapper objectMapper) {
        this.intakeRepository = intakeRepository;
        this.correctionRepository = correctionRepository;
        this.movementRepository = movementRepository;
        this.medicationRepository = medicationRepository;
        this.auditRepository = auditRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.authorizationService = authorizationService;
        this.eventPublishingService = eventPublishingService;
        this.objectMapper = objectMapper;
    }

    public List<PillIntakeDto> getDoses(User actor, String patientId, String from, String to) {
        authorizationService.authorizePatientAccess(actor, patientId);
        List<PillIntake> list;
        if (from != null && to != null) {
            list = intakeRepository.findByPatientIdAndScheduledAtBetween(patientId, Instant.parse(from), Instant.parse(to));
        } else {
            list = intakeRepository.findByPatientId(patientId);
        }
        return list.stream().map(PillIntakeDto::new).collect(Collectors.toList());
    }

    @Transactional
    public PillIntakeDto respond(User actor, String patientId, String doseId, IntakeResponseRequest req) {
        Patient patient = authorizationService.authorizePatientWrite(actor, patientId);

        String operationKey = actor.getId() + ":dose:" + req.getOperationId();
        String fingerprint = patientId + ":" + doseId + ":" + req.getResponse() + ":" + req.getExpectedDoseVersion();

        Optional<IdempotencyRecord> existingOp = idempotencyRepository.findByOperationKey(operationKey);
        if (existingOp.isPresent()) {
            if (!existingOp.get().getFingerprint().equals(fingerprint)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Operación repetida con datos diferentes");
            }
            return intakeRepository.findById(existingOp.get().getResourceId())
                    .map(PillIntakeDto::new)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Registro no encontrado"));
        }

        PillIntake intake = intakeRepository.findByIdAndPatientIdWithLock(doseId, patientId)
                .or(() -> intakeRepository.findByIdAndPatientId(doseId, patientId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dosis programada no encontrada"));

        if ("CANCELLED".equals(intake.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede responder a una dosis cancelada");
        }

        if (!"PENDING".equals(intake.getStatus()) && !"UNCONFIRMED".equals(intake.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La dosis ya ha sido respondida previamente. Utilice el flujo de corrección si necesita modificar la respuesta.");
        }

        // Concurrency / version check if provided
        if (req.getExpectedDoseVersion() > 0 && intake.getVersion() != req.getExpectedDoseVersion()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Conflicto de versión de dosis: esperaba versión " + req.getExpectedDoseVersion() + " pero es " + intake.getVersion());
        }

        Instant now = Instant.now();
        Instant declaredTime = req.getRecordedAt() != null ? Instant.parse(req.getRecordedAt()) : now;

        intake.setStatus(req.getResponse());
        intake.setRespondedAt(declaredTime);
        intake.setTakenAt("TAKEN".equals(req.getResponse()) ? declaredTime : null);
        intake.setActorId(actor.getId());
        intake.setRecordedVia(req.getChannel());
        intake.setReason(req.getReason());
        intake.setVersion(intake.getVersion() + 1);

        intake = intakeRepository.save(intake);

        // Atomic inventory deduction on TAKEN (idempotent, uses dose units)
        if ("TAKEN".equals(req.getResponse())) {
            boolean alreadyConsumed = movementRepository.findByIntakeId(intake.getId()).stream()
                    .anyMatch(m -> "CONSUMPTION".equals(m.getKind()));
            if (!alreadyConsumed) {
                BigDecimal units = intake.getUnitsPerDose();
                String unit = intake.getStockUnit();
                String medId = intake.getMedicationId();

                if (units == null || unit == null) {
                    Optional<Medication> medOpt = medicationRepository.findById(intake.getMedicationId());
                    if (medOpt.isPresent()) {
                        Medication med = medOpt.get();
                        if (units == null) units = med.getUnitsPerDose();
                        if (unit == null) unit = med.getStockUnit();
                    }
                }

                if (units != null && units.compareTo(BigDecimal.ZERO) > 0 && unit != null) {
                    StockMovement mov = new StockMovement(
                            UUID.randomUUID().toString(),
                            patientId,
                            medId,
                            units.negate(),
                            "CONSUMPTION",
                            unit,
                            "Consumo por toma registrada (" + intake.getMedicationName() + " " + intake.getScheduledTime() + ")",
                            actor.getId(),
                            intake.getId()
                    );
                    movementRepository.save(mov);
                }
            }
        }

        // Audit log
        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "INTAKE_RECORDED",
                "Dosis " + intake.getMedicationName() + " (" + intake.getScheduledTime() + ") marcada como " + req.getResponse()
        );
        auditRepository.save(audit);

        // Save idempotency record
        idempotencyRepository.save(new IdempotencyRecord(
                UUID.randomUUID().toString(),
                operationKey,
                fingerprint,
                intake.getId(),
                intake.getStatus()
        ));

        // Publish event
        PillIntakeDto dto = new PillIntakeDto(intake);
        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "INTAKE_RECORDED",
                patient.getOrganizationId(),
                patientId,
                intake.getId(),
                dto
        ));

        return dto;
    }

    @Transactional
    public PillIntakeDto correct(User actor, String patientId, String intakeId, IntakeCorrectionRequest req) {
        Patient patient = authorizationService.authorizePatientWrite(actor, patientId);

        String operationKey = actor.getId() + ":intake_correct:" + req.getOperationId();
        String fingerprint = patientId + ":" + intakeId + ":" + req.getNewStatus() + ":" + req.getReason();

        Optional<IdempotencyRecord> existingOp = idempotencyRepository.findByOperationKey(operationKey);
        if (existingOp.isPresent()) {
            if (!existingOp.get().getFingerprint().equals(fingerprint)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Corrección repetida con parámetros diferentes");
            }
            return intakeRepository.findById(existingOp.get().getResourceId())
                    .map(PillIntakeDto::new)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Registro no encontrado"));
        }

        PillIntake intake = intakeRepository.findByIdAndPatientIdWithLock(intakeId, patientId)
                .or(() -> intakeRepository.findByIdAndPatientId(intakeId, patientId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro de toma no encontrado"));

        if ("CANCELLED".equals(intake.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede corregir una dosis cancelada");
        }

        if (req.getReason() == null || req.getReason().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El motivo de la corrección es obligatorio");
        }

        String oldStatus = intake.getStatus();
        if (oldStatus.equals(req.getNewStatus())) {
            return new PillIntakeDto(intake);
        }

        // Record immutable correction entity
        IntakeCorrection correction = new IntakeCorrection(
                UUID.randomUUID().toString(),
                intake.getId(),
                patientId,
                oldStatus,
                req.getNewStatus(),
                req.getReason(),
                actor.getId()
        );
        correctionRepository.save(correction);

        // Update intake
        intake.setStatus(req.getNewStatus());
        intake.setReason(req.getReason());
        intake.setVersion(intake.getVersion() + 1);
        if ("TAKEN".equals(req.getNewStatus())) {
            intake.setTakenAt(Instant.now());
        } else {
            intake.setTakenAt(null);
        }
        intake = intakeRepository.save(intake);

        // Reversal or deduction of inventory (using historical dose units)
        BigDecimal units = intake.getUnitsPerDose();
        String unit = intake.getStockUnit();
        if (units == null || unit == null) {
            Optional<Medication> medOpt = medicationRepository.findById(intake.getMedicationId());
            if (medOpt.isPresent()) {
                if (units == null) units = medOpt.get().getUnitsPerDose();
                if (unit == null) unit = medOpt.get().getStockUnit();
            }
        }

        if (units != null && units.compareTo(BigDecimal.ZERO) > 0 && unit != null) {
            if ("TAKEN".equals(oldStatus) && "NOT_TAKEN".equals(req.getNewStatus())) {
                // Reversal: add back the historical units
                StockMovement reversal = new StockMovement(
                        UUID.randomUUID().toString(),
                        patientId,
                        intake.getMedicationId(),
                        units,
                        "REVERSAL",
                        unit,
                        "Reversión por corrección a no tomada: " + req.getReason(),
                        actor.getId(),
                        intake.getId()
                );
                movementRepository.save(reversal);
            } else if ("NOT_TAKEN".equals(oldStatus) && "TAKEN".equals(req.getNewStatus())) {
                // Deduction: subtract historical units
                StockMovement consumption = new StockMovement(
                        UUID.randomUUID().toString(),
                        patientId,
                        intake.getMedicationId(),
                        units.negate(),
                        "CONSUMPTION",
                        unit,
                        "Consumo por corrección a tomada: " + req.getReason(),
                            actor.getId(),
                            intake.getId()
                    );
                    movementRepository.save(consumption);
            }
        }
        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "INTAKE_CORRECTED",
                "Toma " + intake.getMedicationName() + " corregida de " + oldStatus + " a " + req.getNewStatus() + " (" + req.getReason() + ")"
        );
        auditRepository.save(audit);

        idempotencyRepository.save(new IdempotencyRecord(
                UUID.randomUUID().toString(),
                operationKey,
                fingerprint,
                intake.getId(),
                intake.getStatus()
        ));

        PillIntakeDto dto = new PillIntakeDto(intake);
        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "INTAKE_CORRECTED",
                patient.getOrganizationId(),
                patientId,
                intake.getId(),
                dto
        ));

        return dto;
    }
}
