package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blood_pressure_logs", schema = "telemetry")
public class BloodPressureLog {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(nullable = false)
    private int systolic;

    @Column(nullable = false)
    private int diastolic;

    private Integer pulse;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt = Instant.now();

    @Column(name = "actor_id", nullable = false, length = 36)
    private String actorId;

    @Column(name = "recorded_via", nullable = false, length = 50)
    private String recordedVia; // MANUAL_PATIENT | VOICE_PATIENT | CLINICAL_IMPORT

    @Column(nullable = false, length = 20)
    private String source = "HOME"; // HOME | CLINIC

    @Column(nullable = false, length = 50)
    private String status = "UNCLASSIFIED";

    @Column(columnDefinition = "TEXT")
    private String notes;

    public BloodPressureLog() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public int getSystolic() { return systolic; }
    public void setSystolic(int systolic) { this.systolic = systolic; }
    public int getDiastolic() { return diastolic; }
    public void setDiastolic(int diastolic) { this.diastolic = diastolic; }
    public Integer getPulse() { return pulse; }
    public void setPulse(Integer pulse) { this.pulse = pulse; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getRecordedVia() { return recordedVia; }
    public void setRecordedVia(String recordedVia) { this.recordedVia = recordedVia; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
