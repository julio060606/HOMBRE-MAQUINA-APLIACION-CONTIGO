package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "clinical_profiles", schema = "clinical")
public class ClinicalProfile {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, unique = true, length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "height_cm", precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;

    @Column(nullable = false, length = 20)
    private String source = "CLINIC";

    @Column(columnDefinition = "TEXT")
    private String notes;

    public ClinicalProfile() {}

    public ClinicalProfile(String id, String patientId, String organizationId, BigDecimal heightCm, BigDecimal weightKg, Instant measuredAt, String notes) {
        this.id = id;
        this.patientId = patientId;
        this.organizationId = organizationId;
        this.heightCm = heightCm;
        this.weightKg = weightKg;
        this.measuredAt = measuredAt;
        this.source = "CLINIC";
        this.notes = notes;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public BigDecimal getHeightCm() { return heightCm; }
    public void setHeightCm(BigDecimal heightCm) { this.heightCm = heightCm; }
    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
    public Instant getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(Instant measuredAt) { this.measuredAt = measuredAt; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
