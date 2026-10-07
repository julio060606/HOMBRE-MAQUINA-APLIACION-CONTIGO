package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.dto.clinical.AppointmentDto;
import com.sanpablo.contigo.dto.clinical.MedicationDto;
import com.sanpablo.contigo.dto.clinical.PatientDto;
import java.time.Instant;
import java.util.List;

public class ReportSummaryDto {
    private PatientDto patient;
    private String fromDate;
    private String toDate;
    private Instant generatedAt;
    private double adherencePercentage;
    private int dosesScheduled;
    private int dosesTaken;
    private int dosesNotTaken;
    private int dosesUnconfirmed;
    private List<MedicationDto> medications;
    private List<BloodPressureLogDto> pressures;
    private List<WeightLogDto> weights;
    private List<AppointmentDto> appointments;
    private Double averageSystolic;
    private Double averageDiastolic;
    private Double averagePulse;

    public ReportSummaryDto() {}

    public PatientDto getPatient() { return patient; }
    public void setPatient(PatientDto patient) { this.patient = patient; }
    public String getFromDate() { return fromDate; }
    public void setFromDate(String fromDate) { this.fromDate = fromDate; }
    public String getToDate() { return toDate; }
    public void setToDate(String toDate) { this.toDate = toDate; }
    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
    public double getAdherencePercentage() { return adherencePercentage; }
    public void setAdherencePercentage(double adherencePercentage) { this.adherencePercentage = adherencePercentage; }
    public int getDosesScheduled() { return dosesScheduled; }
    public void setDosesScheduled(int dosesScheduled) { this.dosesScheduled = dosesScheduled; }
    public int getDosesTaken() { return dosesTaken; }
    public void setDosesTaken(int dosesTaken) { this.dosesTaken = dosesTaken; }
    public int getDosesNotTaken() { return dosesNotTaken; }
    public void setDosesNotTaken(int dosesNotTaken) { this.dosesNotTaken = dosesNotTaken; }
    public int getDosesUnconfirmed() { return dosesUnconfirmed; }
    public void setDosesUnconfirmed(int dosesUnconfirmed) { this.dosesUnconfirmed = dosesUnconfirmed; }
    public List<MedicationDto> getMedications() { return medications; }
    public void setMedications(List<MedicationDto> medications) { this.medications = medications; }
    public List<BloodPressureLogDto> getPressures() { return pressures; }
    public void setPressures(List<BloodPressureLogDto> pressures) { this.pressures = pressures; }
    public List<WeightLogDto> getWeights() { return weights; }
    public void setWeights(List<WeightLogDto> weights) { this.weights = weights; }
    public List<AppointmentDto> getAppointments() { return appointments; }
    public void setAppointments(List<AppointmentDto> appointments) { this.appointments = appointments; }
    public Double getAverageSystolic() { return averageSystolic; }
    public void setAverageSystolic(Double averageSystolic) { this.averageSystolic = averageSystolic; }
    public Double getAverageDiastolic() { return averageDiastolic; }
    public void setAverageDiastolic(Double averageDiastolic) { this.averageDiastolic = averageDiastolic; }
    public Double getAveragePulse() { return averagePulse; }
    public void setAveragePulse(Double averagePulse) { this.averagePulse = averagePulse; }
}
