package com.sanpablo.contigo.dto.telemetry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class IntakeCorrectionRequest {

    @NotBlank(message = "El nuevo estado es obligatorio")
    @Pattern(regexp = "^(TAKEN|NOT_TAKEN)$", message = "El nuevo estado debe ser TAKEN o NOT_TAKEN")
    private String newStatus;

    @NotBlank(message = "El motivo de la corrección es obligatorio")
    private String reason;

    @NotBlank(message = "operationId es obligatorio")
    private String operationId;

    public IntakeCorrectionRequest() {}

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
}
