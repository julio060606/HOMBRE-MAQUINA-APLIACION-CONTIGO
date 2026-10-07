package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.domain.telemetry.AuditLog;
import java.time.Instant;

public class AuditLogDto {
    private String id;
    private String patientId;
    private String actorId;
    private String kind;
    private Instant recordedAt;
    private String detail;

    public AuditLogDto() {}

    public AuditLogDto(AuditLog log) {
        this.id = log.getId();
        this.patientId = log.getPatientId();
        this.actorId = log.getActorId();
        this.kind = log.getKind();
        this.recordedAt = log.getRecordedAt();
        this.detail = log.getDetail();
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
