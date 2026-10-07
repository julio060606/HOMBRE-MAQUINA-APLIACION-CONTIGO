package com.sanpablo.contigo.dto.telemetry;

import java.math.BigDecimal;

public class SupplyDto {
    private String medicationId;
    private String patientId;
    private String unit;
    private BigDecimal quantity;
    private Integer daysRemaining;
    private String state; // UNKNOWN | AVAILABLE | LOW | EMPTY | DISCREPANCY

    public SupplyDto() {}

    public SupplyDto(String medicationId, String patientId, String unit, BigDecimal quantity, Integer daysRemaining, String state) {
        this.medicationId = medicationId;
        this.patientId = patientId;
        this.unit = unit;
        this.quantity = quantity;
        this.daysRemaining = daysRemaining;
        this.state = state;
    }

    public String getMedicationId() { return medicationId; }
    public void setMedicationId(String medicationId) { this.medicationId = medicationId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public Integer getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Integer daysRemaining) { this.daysRemaining = daysRemaining; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
