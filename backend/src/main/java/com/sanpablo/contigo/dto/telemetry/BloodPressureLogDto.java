package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.domain.telemetry.BloodPressureLog;
import java.time.Instant;

public class BloodPressureLogDto {
    private String id;
    private String patientId;
    private String organizationId;
    private int systolic;
    private int diastolic;
    private Integer pulse;
    private Instant recordedAt;
    private Instant receivedAt;
    private String actorId;
    private String recordedVia;
    private String source;
    private String status;
    private String notes;

    public BloodPressureLogDto() {}

    public BloodPressureLogDto(BloodPressureLog log) {
        this.id = log.getId();
        this.patientId = log.getPatientId();
        this.organizationId = log.getOrganizationId();
        this.systolic = log.getSystolic();
        this.diastolic = log.getDiastolic();
        this.pulse = log.getPulse();
        this.recordedAt = log.getRecordedAt();
        this.receivedAt = log.getReceivedAt();
        this.actorId = log.getActorId();
        this.recordedVia = log.getRecordedVia();
        this.source = log.getSource();
        this.status = log.getStatus();
        this.notes = log.getNotes();
    }

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
