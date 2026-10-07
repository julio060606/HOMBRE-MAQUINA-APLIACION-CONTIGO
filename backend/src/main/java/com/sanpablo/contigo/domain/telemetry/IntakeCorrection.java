package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "intake_corrections", schema = "telemetry")
public class IntakeCorrection {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "intake_id", nullable = false, length = 100)
    private String intakeId;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "previous_status", nullable = false, length = 50)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 50)
    private String newStatus;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "actor_id", nullable = false, length = 36)
    private String actorId;

    @Column(name = "corrected_at", nullable = false)
    private Instant correctedAt = Instant.now();

    public IntakeCorrection() {}

    public IntakeCorrection(String id, String intakeId, String patientId, String previousStatus, String newStatus, String reason, String actorId) {
        this.id = id;
        this.intakeId = intakeId;
        this.patientId = patientId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.reason = reason;
        this.actorId = actorId;
        this.correctedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getIntakeId() { return intakeId; }
    public void setIntakeId(String intakeId) { this.intakeId = intakeId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public Instant getCorrectedAt() { return correctedAt; }
    public void setCorrectedAt(Instant correctedAt) { this.correctedAt = correctedAt; }
}
