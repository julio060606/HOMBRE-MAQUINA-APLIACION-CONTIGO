package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.domain.telemetry.AlertEvent;
import java.time.Instant;

public class AlertEventDto {
    private String id;
    private String patientId;
    private String patientName;
    private String type;
    private String title;
    private String description;
    private Instant timestamp;
    private String severity;
    private boolean isResolved;
    private String notificationStatus;
    private Instant acknowledgedAt;
    private String acknowledgedBy;

    public AlertEventDto() {}

    public AlertEventDto(AlertEvent alert) {
        this.id = alert.getId();
        this.patientId = alert.getPatientId();
        this.patientName = alert.getPatientName();
        this.type = alert.getType();
        this.title = alert.getTitle();
        this.description = alert.getDescription();
        this.timestamp = alert.getTimestamp();
        this.severity = alert.getSeverity();
        this.isResolved = alert.isResolved();
        this.notificationStatus = alert.getNotificationStatus();
        this.acknowledgedAt = alert.getAcknowledgedAt();
        this.acknowledgedBy = alert.getAcknowledgedBy();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public boolean isResolved() { return isResolved; }
    public void setResolved(boolean resolved) { isResolved = resolved; }
    public String getNotificationStatus() { return notificationStatus; }
    public void setNotificationStatus(String notificationStatus) { this.notificationStatus = notificationStatus; }
    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
    public String getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(String acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }
}
