package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pill_intakes", schema = "telemetry")
public class PillIntake {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "medication_id", nullable = false, length = 36)
    private String medicationId;

    @Column(name = "medication_name", nullable = false)
    private String medicationName;

    @Column(nullable = false, length = 100)
    private String dosage;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "scheduled_time", nullable = false, length = 10)
    private String scheduledTime;

    @Column(name = "scheduled_date", nullable = false, length = 20)
    private String scheduledDate;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "taken_at")
    private Instant takenAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(nullable = false, length = 50)
    private String status; // TAKEN | NOT_TAKEN | PENDING | UNCONFIRMED | CANCELLED

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "prescription_version")
    private Integer prescriptionVersion;

    @Column(name = "units_per_dose", precision = 6, scale = 2)
    private BigDecimal unitsPerDose;

    @Column(name = "stock_unit", length = 50)
    private String stockUnit;

    @Column(name = "actor_id", length = 36)
    private String actorId;

    @Column(name = "recorded_via", length = 50)
    private String recordedVia;

    @Column(columnDefinition = "TEXT")
    private String reason;

    public PillIntake() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getMedicationId() { return medicationId; }
    public void setMedicationId(String medicationId) { this.medicationId = medicationId; }
    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }
    public String getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(String scheduledDate) { this.scheduledDate = scheduledDate; }
    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    public Instant getTakenAt() { return takenAt; }
    public void setTakenAt(Instant takenAt) { this.takenAt = takenAt; }
    public Instant getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Instant respondedAt) { this.respondedAt = respondedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public Integer getPrescriptionVersion() { return prescriptionVersion; }
    public void setPrescriptionVersion(Integer prescriptionVersion) { this.prescriptionVersion = prescriptionVersion; }
    public BigDecimal getUnitsPerDose() { return unitsPerDose; }
    public void setUnitsPerDose(BigDecimal unitsPerDose) { this.unitsPerDose = unitsPerDose; }
    public String getStockUnit() { return stockUnit; }
    public void setStockUnit(String stockUnit) { this.stockUnit = stockUnit; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getRecordedVia() { return recordedVia; }
    public void setRecordedVia(String recordedVia) { this.recordedVia = recordedVia; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
