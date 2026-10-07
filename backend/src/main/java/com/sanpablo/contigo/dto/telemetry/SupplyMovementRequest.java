package com.sanpablo.contigo.dto.telemetry;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public class SupplyMovementRequest {

    @NotBlank(message = "El tipo de movimiento es obligatorio")
    @Pattern(regexp = "^(RESTOCK|ADJUSTMENT)$", message = "El tipo debe ser RESTOCK o ADJUSTMENT")
    private String kind;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.0", inclusive = false, message = "La cantidad debe ser mayor a 0")
    private BigDecimal quantity;

    @NotBlank(message = "El motivo es obligatorio")
    private String reason;

    @NotBlank(message = "operationId es obligatorio")
    private String operationId;

    public SupplyMovementRequest() {}

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
}
