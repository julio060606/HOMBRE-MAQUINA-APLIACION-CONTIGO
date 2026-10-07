package com.sanpablo.contigo.dto.telemetry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class IntakeResponseRequest {

    @NotBlank(message = "La respuesta es obligatoria")
    @Pattern(regexp = "^(TAKEN|NOT_TAKEN)$", message = "La respuesta debe ser TAKEN o NOT_TAKEN")
    private String response;

    private String recordedAt;
    private String channel = "MANUAL_PATIENT";
    private int expectedDoseVersion = 1;

    @NotBlank(message = "operationId es obligatorio para garantizar idempotencia")
    private String operationId;

    private String reason;
    private boolean correction = false;

    public IntakeResponseRequest() {}

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public String getRecordedAt() { return recordedAt; }
    public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public int getExpectedDoseVersion() { return expectedDoseVersion; }
    public void setExpectedDoseVersion(int expectedDoseVersion) { this.expectedDoseVersion = expectedDoseVersion; }
    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public boolean isCorrection() { return correction; }
    public void setCorrection(boolean correction) { this.correction = correction; }
}
