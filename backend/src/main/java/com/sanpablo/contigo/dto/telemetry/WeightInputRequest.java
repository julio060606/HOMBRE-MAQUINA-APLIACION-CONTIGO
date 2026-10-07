package com.sanpablo.contigo.dto.telemetry;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class WeightInputRequest {

    @NotNull(message = "El peso es obligatorio")
    @DecimalMin(value = "20.0", message = "El peso debe ser al menos 20 kg")
    @DecimalMax(value = "300.0", message = "El peso no puede exceder 300 kg")
    private BigDecimal weightKg;

    private String recordedAt;

    @NotBlank(message = "operationId es obligatorio")
    private String operationId;

    public WeightInputRequest() {}

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
    public String getRecordedAt() { return recordedAt; }
    public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
}
