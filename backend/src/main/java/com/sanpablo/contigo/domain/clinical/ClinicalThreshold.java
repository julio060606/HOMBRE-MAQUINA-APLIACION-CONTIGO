package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "clinical_thresholds", schema = "clinical")
public class ClinicalThreshold {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "min_value", precision = 6, scale = 2)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 6, scale = 2)
    private BigDecimal maxValue;

    @Column(length = 20)
    private String unit;

    @Column(length = 50)
    private String source = "CLINIC";

    @Column(nullable = false)
    private int version = 1;

    public ClinicalThreshold() {}

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
