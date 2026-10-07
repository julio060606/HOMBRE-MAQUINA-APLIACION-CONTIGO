package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "stock_movements", schema = "telemetry")
public class StockMovement {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "medication_id", nullable = false, length = 36)
    private String medicationId;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, length = 50)
    private String kind; // INITIAL | RESTOCK | ADJUSTMENT | CONSUMPTION | REVERSAL

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "actor_id", nullable = false, length = 36)
    private String actorId;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt = Instant.now();

    @Column(name = "intake_id", length = 100)
    private String intakeId;

    public StockMovement() {}

    public StockMovement(String id, String patientId, String medicationId, BigDecimal quantity, String kind, String unit, String reason, String actorId, String intakeId) {
        this.id = id;
        this.patientId = patientId;
        this.medicationId = medicationId;
        this.quantity = quantity;
        this.kind = kind;
        this.unit = unit;
        this.reason = reason;
        this.actorId = actorId;
        this.intakeId = intakeId;
        this.recordedAt = Instant.now();
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
