package com.sanpablo.contigo.dto.clinical;

import com.sanpablo.contigo.domain.clinical.ClinicalProfile;
import java.math.BigDecimal;
import java.time.Instant;

public class ClinicalProfileDto {
    private String patientId;
    private String organizationId;
    private BigDecimal heightCm;
    private BigDecimal weightKg;
    private Instant measuredAt;
    private String source;
    private String notes;

    public ClinicalProfileDto() {}

    public ClinicalProfileDto(ClinicalProfile profile) {
        if (profile != null) {
            this.patientId = profile.getPatientId();
            this.organizationId = profile.getOrganizationId();
            this.heightCm = profile.getHeightCm();
            this.weightKg = profile.getWeightKg();
            this.measuredAt = profile.getMeasuredAt();
            this.source = profile.getSource();
            this.notes = profile.getNotes();
        }
    }

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
