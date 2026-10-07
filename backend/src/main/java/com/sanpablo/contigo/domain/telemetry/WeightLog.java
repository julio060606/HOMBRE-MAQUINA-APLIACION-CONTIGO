package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "weight_logs", schema = "telemetry")
public class WeightLog {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "weight_kg", nullable = false, precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "actor_id", nullable = false, length = 36)
    private String actorId;

    @Column(nullable = false, length = 20)
    private String source = "HOME";

    public WeightLog() {}

    public WeightLog(String id, String patientId, String organizationId, BigDecimal weightKg, Instant recordedAt, String actorId) {
        this.id = id;
        this.patientId = patientId;
        this.organizationId = organizationId;
        this.weightKg = weightKg;
        this.recordedAt = recordedAt;
        this.actorId = actorId;
        this.source = "HOME";
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
