package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.domain.telemetry.WeightLog;
import java.math.BigDecimal;
import java.time.Instant;

public class WeightLogDto {
    private String id;
    private String patientId;
    private String organizationId;
    private BigDecimal weightKg;
    private Instant recordedAt;
    private String actorId;
    private String source;

    public WeightLogDto() {}

    public WeightLogDto(WeightLog log) {
        this.id = log.getId();
        this.patientId = log.getPatientId();
        this.organizationId = log.getOrganizationId();
        this.weightKg = log.getWeightKg();
        this.recordedAt = log.getRecordedAt();
        this.actorId = log.getActorId();
        this.source = log.getSource();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
