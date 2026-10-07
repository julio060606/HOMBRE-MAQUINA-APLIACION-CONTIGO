package com.sanpablo.contigo.dto.clinical;

import com.sanpablo.contigo.domain.clinical.ClinicalThreshold;
import java.math.BigDecimal;

public class ClinicalThresholdDto {
    private String id;
    private String patientId;
    private String organizationId;
    private String type;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private String unit;
    private String source;
    private int version;

    public ClinicalThresholdDto() {}

    public ClinicalThresholdDto(ClinicalThreshold threshold) {
        this.id = threshold.getId();
        this.patientId = threshold.getPatientId();
        this.organizationId = threshold.getOrganizationId();
        this.type = threshold.getType();
        this.minValue = threshold.getMinValue();
        this.maxValue = threshold.getMaxValue();
        this.unit = threshold.getUnit();
        this.source = threshold.getSource();
        this.version = threshold.getVersion();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public BigDecimal getMinValue() { return minValue; }
    public void setMinValue(BigDecimal minValue) { this.minValue = minValue; }
    public BigDecimal getMaxValue() { return maxValue; }
    public void setMaxValue(BigDecimal maxValue) { this.maxValue = maxValue; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
}
