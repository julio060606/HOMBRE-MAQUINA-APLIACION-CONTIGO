package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "medications", schema = "clinical")
public class Medication {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "external_prescription_id", nullable = false, length = 100)
    private String externalPrescriptionId;

    @Column(nullable = false)
    private int version = 1;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String dosage;

    @Column(name = "form_factor", nullable = false, length = 50)
    private String formFactor;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false, length = 500)
    private String times; // comma-separated e.g. "08:00,20:00"

    @Column(name = "frequency_type", nullable = false, length = 50)
    private String frequencyType;

    @Column(name = "specific_days", length = 100)
    private String specificDays; // comma-separated integers e.g. "1,3,5"

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "start_date", nullable = false, length = 50)
    private String startDate;

    @Column(name = "end_date", length = 50)
    private String endDate;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(nullable = false, length = 50)
    private String source = "CLINIC";

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt = Instant.now();

    @Column(name = "units_per_dose", precision = 6, scale = 2)
    private BigDecimal unitsPerDose;

    @Column(name = "stock_unit", length = 50)
    private String stockUnit;

    @Column(name = "effective_from", length = 50)
    private String effectiveFrom;

    public Medication() {}

    public List<String> getTimesList() {
        if (times == null || times.isBlank()) return Collections.emptyList();
        return Arrays.asList(times.split(","));
    }

    public void setTimesList(List<String> list) {
        if (list == null || list.isEmpty()) {
            this.times = "";
        } else {
            this.times = String.join(",", list);
        }
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
    public String getTimes() { return times; }
    public void setTimes(String times) { this.times = times; }
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
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
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
