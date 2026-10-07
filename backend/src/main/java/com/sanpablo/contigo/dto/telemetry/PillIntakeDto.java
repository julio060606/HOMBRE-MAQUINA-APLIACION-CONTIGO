package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.domain.telemetry.PillIntake;
import java.math.BigDecimal;
import java.time.Instant;

public class PillIntakeDto {
    private String id;
    private String patientId;
    private String organizationId;
    private String medicationId;
    private String medicationName;
    private String dosage;
    private String imageUrl;
    private String scheduledTime;
    private String scheduledDate;
    private Instant scheduledAt;
    private Instant takenAt;
    private Instant respondedAt;
    private String status;
    private String instructions;
    private int version;
    private Integer prescriptionVersion;
    private BigDecimal unitsPerDose;
    private String stockUnit;
    private String actorId;
    private String recordedVia;
    private String reason;

    public PillIntakeDto() {}

    public PillIntakeDto(PillIntake intake) {
        this.id = intake.getId();
        this.patientId = intake.getPatientId();
        this.organizationId = intake.getOrganizationId();
        this.medicationId = intake.getMedicationId();
        this.medicationName = intake.getMedicationName();
        this.dosage = intake.getDosage();
        this.imageUrl = intake.getImageUrl();
        this.scheduledTime = intake.getScheduledTime();
        this.scheduledDate = intake.getScheduledDate();
        this.scheduledAt = intake.getScheduledAt();
        this.takenAt = intake.getTakenAt();
        this.respondedAt = intake.getRespondedAt();
        this.status = intake.getStatus();
        this.instructions = intake.getInstructions();
        this.version = intake.getVersion();
        this.prescriptionVersion = intake.getPrescriptionVersion();
        this.unitsPerDose = intake.getUnitsPerDose();
        this.stockUnit = intake.getStockUnit();
        this.actorId = intake.getActorId();
        this.recordedVia = intake.getRecordedVia();
        this.reason = intake.getReason();
    }

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
