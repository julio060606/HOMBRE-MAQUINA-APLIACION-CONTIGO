package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "alert_events", schema = "telemetry")
public class AlertEvent {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    @Column(nullable = false, length = 50)
    private String type; // MISSED_MEDICATION | PANIC_BUTTON | LOW_STOCK

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false, length = 50)
    private String severity; // WARNING | CRITICAL | INFO

    @Column(name = "is_resolved", nullable = false)
    private boolean resolved = false;

    @Column(name = "notification_status", nullable = false, length = 50)
    private String notificationStatus = "REGISTERED"; // REGISTERED | DELIVERED | ACKNOWLEDGED

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "acknowledged_by", length = 36)
    private String acknowledgedBy;

    public AlertEvent() {}

    public AlertEvent(String id, String patientId, String patientName, String type, String title, String description, Instant timestamp, String severity) {
        this.id = id;
        this.patientId = patientId;
        this.patientName = patientName;
        this.type = type;
        this.title = title;
        this.description = description;
        this.timestamp = timestamp;
        this.severity = severity;
        this.resolved = false;
        this.notificationStatus = "REGISTERED";
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
    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public String getNotificationStatus() { return notificationStatus; }
    public void setNotificationStatus(String notificationStatus) { this.notificationStatus = notificationStatus; }
    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
    public String getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(String acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }
}
