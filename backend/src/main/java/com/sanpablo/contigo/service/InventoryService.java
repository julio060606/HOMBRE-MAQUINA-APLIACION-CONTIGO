package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.clinical.Medication;
import com.sanpablo.contigo.domain.clinical.Patient;
import com.sanpablo.contigo.domain.telemetry.AuditLog;
import com.sanpablo.contigo.domain.telemetry.IdempotencyRecord;
import com.sanpablo.contigo.domain.telemetry.StockMovement;
import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.dto.telemetry.StockMovementDto;
import com.sanpablo.contigo.dto.telemetry.SupplyDto;
import com.sanpablo.contigo.dto.telemetry.SupplyMovementRequest;
import com.sanpablo.contigo.repository.AuditLogRepository;
import com.sanpablo.contigo.repository.IdempotencyRecordRepository;
import com.sanpablo.contigo.repository.MedicationRepository;
import com.sanpablo.contigo.repository.StockMovementRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final StockMovementRepository movementRepository;
    private final MedicationRepository medicationRepository;
    private final AuditLogRepository auditRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final AuthorizationService authorizationService;
    private final EventPublishingService eventPublishingService;

    public InventoryService(StockMovementRepository movementRepository,
                            MedicationRepository medicationRepository,
                            AuditLogRepository auditRepository,
                            IdempotencyRecordRepository idempotencyRepository,
                            AuthorizationService authorizationService,
                            EventPublishingService eventPublishingService) {
        this.movementRepository = movementRepository;
        this.medicationRepository = medicationRepository;
        this.auditRepository = auditRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.authorizationService = authorizationService;
        this.eventPublishingService = eventPublishingService;
    }

    public List<SupplyDto> getSupplies(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        List<Medication> medications = medicationRepository.findByPatientId(patientId);
        List<StockMovement> movements = movementRepository.findByPatientId(patientId);

        Map<String, List<StockMovement>> movementsByMed = movements.stream()
                .collect(Collectors.groupingBy(StockMovement::getMedicationId));

        List<SupplyDto> results = new ArrayList<>();
        for (Medication med : medications) {
            List<StockMovement> medMovements = movementsByMed.getOrDefault(med.getId(), Collections.emptyList());
            if (medMovements.isEmpty() || med.getStockUnit() == null) {
                results.add(new SupplyDto(med.getId(), patientId, med.getStockUnit() != null ? med.getStockUnit() : "unidades", null, null, "UNKNOWN"));
                continue;
            }

            BigDecimal total = BigDecimal.ZERO;
            for (StockMovement m : medMovements) {
                total = total.add(m.getQuantity());
            }

            String state;
            Integer daysRemaining = null;

            if (total.compareTo(BigDecimal.ZERO) < 0) {
                state = "DISCREPANCY";
            } else if (total.compareTo(BigDecimal.ZERO) == 0) {
                state = "EMPTY";
                daysRemaining = 0;
            } else {
                List<String> times = med.getTimesList();
                BigDecimal unitsPerDose = med.getUnitsPerDose() != null ? med.getUnitsPerDose() : BigDecimal.ONE;
                if (!times.isEmpty() && "DAILY".equals(med.getFrequencyType()) && unitsPerDose.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal dailyConsumption = unitsPerDose.multiply(BigDecimal.valueOf(times.size()));
                    daysRemaining = total.divide(dailyConsumption, 0, RoundingMode.FLOOR).intValue();
                    state = daysRemaining <= 3 ? "LOW" : "AVAILABLE";
                } else {
                    state = "AVAILABLE";
                }
            }

            results.add(new SupplyDto(med.getId(), patientId, med.getStockUnit(), total, daysRemaining, state));
        }

        return results;
    }

    public List<StockMovementDto> getMovements(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return movementRepository.findByPatientId(patientId).stream()
                .map(StockMovementDto::new)
                .sorted((a, b) -> b.getRecordedAt().compareTo(a.getRecordedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void addMovement(User actor, String patientId, String medicationId, SupplyMovementRequest req) {
        Patient patient = authorizationService.authorizeCaregiverRestock(actor, patientId);

        String operationKey = actor.getId() + ":supply:" + req.getOperationId();
        String fingerprint = patientId + ":" + medicationId + ":" + req.getKind() + ":" + req.getQuantity();

        Optional<IdempotencyRecord> existingOp = idempotencyRepository.findByOperationKey(operationKey);
        if (existingOp.isPresent()) {
            if (!existingOp.get().getFingerprint().equals(fingerprint)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Operación repetida con datos diferentes");
            }
            return; // Idempotent return
        }

        Medication med = medicationRepository.findByIdAndPatientId(medicationId, patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicamento no encontrado"));

        if (med.getStockUnit() == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "El medicamento no tiene una unidad física de inventario definida");
        }

        List<StockMovement> currentMovements = movementRepository.findByPatientIdAndMedicationId(patientId, medicationId);
        BigDecimal currentSum = currentMovements.stream()
                .map(StockMovement::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal quantityToSave;
        String recordedKind;

        if ("ADJUSTMENT".equals(req.getKind())) {
            // Absolute physical count: delta = requested - currentSum
            quantityToSave = req.getQuantity().subtract(currentSum);
            recordedKind = currentMovements.isEmpty() ? "INITIAL" : "ADJUSTMENT";
        } else {
            // RESTOCK: addition
            if (currentMovements.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Primero registre el conteo físico disponible inicial");
            }
            quantityToSave = req.getQuantity();
            recordedKind = "RESTOCK";
        }

        StockMovement movement = new StockMovement(
                UUID.randomUUID().toString(),
                patientId,
                medicationId,
                quantityToSave,
                recordedKind,
                med.getStockUnit(),
                req.getReason(),
                actor.getId(),
                null
        );
        movementRepository.save(movement);

        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "SUPPLY_UPDATED",
                med.getName() + ": " + ("RESTOCK".equals(req.getKind()) ? "Reposición" : "Conteo físico") + " " + req.getQuantity() + " " + med.getStockUnit() + " · " + req.getReason()
        );
        auditRepository.save(audit);

        idempotencyRepository.save(new IdempotencyRecord(
                UUID.randomUUID().toString(),
                operationKey,
                fingerprint,
                movement.getId(),
                "SAVED"
        ));

        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "SUPPLY_UPDATED",
                patient.getOrganizationId(),
                patientId,
                medicationId,
                new StockMovementDto(movement)
        ));
    }
}
