package com.sanpablo.contigo.dto.telemetry;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Optional written communication; existing SOS clients may omit the body. */
public class SosInputRequest {
    @Size(max = 128, message = "operationId no puede exceder 128 caracteres")
    @Pattern(regexp = "(?s).*\\S.*", message = "operationId no puede estar vacío")
    private String operationId;

    @Size(max = 240, message = "El mensaje no puede exceder 240 caracteres")
    @Pattern(regexp = "[\\P{Cc}\\n\\r\\t]*", message = "El mensaje contiene caracteres de control no permitidos")
    private String message;

    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message == null ? null : message.strip(); }
}
