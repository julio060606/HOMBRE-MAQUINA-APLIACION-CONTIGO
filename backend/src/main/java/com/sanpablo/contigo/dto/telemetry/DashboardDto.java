package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.dto.clinical.*;
import java.util.List;

public class DashboardDto {
    private PatientDto patient;
    private List<MedicationDto> medications;
    private List<PillIntakeDto> today;
    private List<PillIntakeDto> history;
    private List<BloodPressureLogDto> pressures;
    private List<WeightLogDto> weights;
    private List<SupplyDto> supplies;
    private List<StockMovementDto> movements;
    private List<AppointmentDto> appointments;
    private ClinicalProfileDto profile;
    private ClinicalSettingsDto settings;
    private List<AlertEventDto> alerts;
    private List<AuditLogDto> audit;

    public DashboardDto() {}

    public PatientDto getPatient() { return patient; }
    public void setPatient(PatientDto patient) { this.patient = patient; }
    public List<MedicationDto> getMedications() { return medications; }
    public void setMedications(List<MedicationDto> medications) { this.medications = medications; }
    public List<PillIntakeDto> getToday() { return today; }
    public void setToday(List<PillIntakeDto> today) { this.today = today; }
    public List<PillIntakeDto> getHistory() { return history; }
    public void setHistory(List<PillIntakeDto> history) { this.history = history; }
    public List<BloodPressureLogDto> getPressures() { return pressures; }
    public void setPressures(List<BloodPressureLogDto> pressures) { this.pressures = pressures; }
    public List<WeightLogDto> getWeights() { return weights; }
    public void setWeights(List<WeightLogDto> weights) { this.weights = weights; }
    public List<SupplyDto> getSupplies() { return supplies; }
    public void setSupplies(List<SupplyDto> supplies) { this.supplies = supplies; }
    public List<StockMovementDto> getMovements() { return movements; }
    public void setMovements(List<StockMovementDto> movements) { this.movements = movements; }
    public List<AppointmentDto> getAppointments() { return appointments; }
    public void setAppointments(List<AppointmentDto> appointments) { this.appointments = appointments; }
    public ClinicalProfileDto getProfile() { return profile; }
    public void setProfile(ClinicalProfileDto profile) { this.profile = profile; }
    public ClinicalSettingsDto getSettings() { return settings; }
    public void setSettings(ClinicalSettingsDto settings) { this.settings = settings; }
    public List<AlertEventDto> getAlerts() { return alerts; }
    public void setAlerts(List<AlertEventDto> alerts) { this.alerts = alerts; }
    public List<AuditLogDto> getAudit() { return audit; }
    public void setAudit(List<AuditLogDto> audit) { this.audit = audit; }
}
