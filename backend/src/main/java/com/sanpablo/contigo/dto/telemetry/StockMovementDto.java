package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.domain.telemetry.StockMovement;
import java.math.BigDecimal;
import java.time.Instant;

public class StockMovementDto {
    private String id;
    private String patientId;
    private String medicationId;
    private BigDecimal quantity;
    private String kind;
    private String unit;
    private String reason;
    private String actorId;
    private Instant recordedAt;
    private String intakeId;

    public StockMovementDto() {}

    public StockMovementDto(StockMovement movement) {
        this.id = movement.getId();
        this.patientId = movement.getPatientId();
        this.medicationId = movement.getMedicationId();
        this.quantity = movement.getQuantity();
        this.kind = movement.getKind();
        this.unit = movement.getUnit();
        this.reason = movement.getReason();
        this.actorId = movement.getActorId();
        this.recordedAt = movement.getRecordedAt();
        this.intakeId = movement.getIntakeId();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getMedicationId() { return medicationId; }
    public void setMedicationId(String medicationId) { this.medicationId = medicationId; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
    public String getIntakeId() { return intakeId; }
    public void setIntakeId(String intakeId) { this.intakeId = intakeId; }
}
