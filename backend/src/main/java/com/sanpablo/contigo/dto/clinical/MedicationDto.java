package com.sanpablo.contigo.dto.clinical;

import com.sanpablo.contigo.domain.clinical.Medication;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class MedicationDto {
    private String id;
    private String patientId;
    private String organizationId;
    private String externalPrescriptionId;
    private int version;
    private String name;
    private String dosage;
    private String formFactor;
    private String imageUrl;
    private List<String> times;
    private String frequencyType;
    private String specificDays;
    private Integer durationDays;
    private String startDate;
    private String endDate;
    private String instructions;
    private boolean isActive;
    private String source;
    private Instant syncedAt;
    private BigDecimal unitsPerDose;
    private String stockUnit;
    private String effectiveFrom;

    public MedicationDto() {}

    public MedicationDto(Medication medication) {
        this.id = medication.getId();
        this.patientId = medication.getPatientId();
        this.organizationId = medication.getOrganizationId();
        this.externalPrescriptionId = medication.getExternalPrescriptionId();
        this.version = medication.getVersion();
        this.name = medication.getName();
        this.dosage = medication.getDosage();
        this.formFactor = medication.getFormFactor();
        this.imageUrl = medication.getImageUrl();
        this.times = medication.getTimesList();
        this.frequencyType = medication.getFrequencyType();
        this.specificDays = medication.getSpecificDays();
        this.durationDays = medication.getDurationDays();
        this.startDate = medication.getStartDate();
        this.endDate = medication.getEndDate();
        this.instructions = medication.getInstructions();
        this.isActive = medication.isActive();
        this.source = medication.getSource();
        this.syncedAt = medication.getSyncedAt();
        this.unitsPerDose = medication.getUnitsPerDose();
        this.stockUnit = medication.getStockUnit();
        this.effectiveFrom = medication.getEffectiveFrom();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getExternalPrescriptionId() { return externalPrescriptionId; }
    public void setExternalPrescriptionId(String externalPrescriptionId) { this.externalPrescriptionId = externalPrescriptionId; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }
    public String getFormFactor() { return formFactor; }
    public void setFormFactor(String formFactor) { this.formFactor = formFactor; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public List<String> getTimes() { return times; }
    public void setTimes(List<String> times) { this.times = times; }
    public String getFrequencyType() { return frequencyType; }
    public void setFrequencyType(String frequencyType) { this.frequencyType = frequencyType; }
    public String getSpecificDays() { return specificDays; }
    public void setSpecificDays(String specificDays) { this.specificDays = specificDays; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Instant getSyncedAt() { return syncedAt; }
    public void setSyncedAt(Instant syncedAt) { this.syncedAt = syncedAt; }
    public BigDecimal getUnitsPerDose() { return unitsPerDose; }
    public void setUnitsPerDose(BigDecimal unitsPerDose) { this.unitsPerDose = unitsPerDose; }
    public String getStockUnit() { return stockUnit; }
    public void setStockUnit(String stockUnit) { this.stockUnit = stockUnit; }
    public String getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(String effectiveFrom) { this.effectiveFrom = effectiveFrom; }
}
