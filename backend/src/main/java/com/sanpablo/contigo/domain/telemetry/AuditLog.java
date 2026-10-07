package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs", schema = "reports_audit")
public class AuditLog {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", length = 36)
    private String patientId;

    @Column(name = "actor_id", nullable = false, length = 36)
    private String actorId;

    @Column(nullable = false, length = 100)
    private String kind;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt = Instant.now();

    @Column(columnDefinition = "TEXT", nullable = false)
    private String detail;

    public AuditLog() {}

    public AuditLog(String id, String patientId, String actorId, String kind, String detail) {
        this.id = id;
        this.patientId = patientId;
        this.actorId = actorId;
        this.kind = kind;
        this.detail = detail;
        this.recordedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
