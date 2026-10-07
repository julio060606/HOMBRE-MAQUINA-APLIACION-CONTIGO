package com.sanpablo.contigo.dto.telemetry;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class PressureInputRequest {

    @Min(value = 50, message = "Sistólica debe ser al menos 50 mmHg")
    @Max(value = 260, message = "Sistólica no puede exceder 260 mmHg")
    private int systolic;

    @Min(value = 30, message = "Diastólica debe ser al menos 30 mmHg")
    @Max(value = 160, message = "Diastólica no puede exceder 160 mmHg")
    private int diastolic;

    @Min(value = 30, message = "Pulso debe ser al menos 30 bpm")
    @Max(value = 220, message = "Pulso no puede exceder 220 bpm")
    private Integer pulse;

    private String recordedAt;
    private String notes;

    @NotBlank(message = "operationId es obligatorio")
    private String operationId;

    public PressureInputRequest() {}

    public int getSystolic() { return systolic; }
    public void setSystolic(int systolic) { this.systolic = systolic; }
    public int getDiastolic() { return diastolic; }
    public void setDiastolic(int diastolic) { this.diastolic = diastolic; }
    public Integer getPulse() { return pulse; }
    public void setPulse(Integer pulse) { this.pulse = pulse; }
    public String getRecordedAt() { return recordedAt; }
    public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
}
