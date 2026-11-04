package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.AlertEventDto;
import com.sanpablo.contigo.dto.telemetry.SosInputRequest;
import com.sanpablo.contigo.service.TelemetryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/alerts")
@Tag(name = "Alertas y SOS", description = "Endpoints para consultar avisos, emitir auxilio SOS y confirmar atención")
public class AlertController {

    private final TelemetryService telemetryService;

    public AlertController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @GetMapping
    @Operation(summary = "Listar alertas", description = "Devuelve los avisos registrados del paciente")
    public ResponseEntity<List<AlertEventDto>> getAlerts(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId) {
        return ResponseEntity.ok(telemetryService.getAlerts(actor, patientId));
    }

    @PostMapping("/sos")
    @Operation(summary = "Registrar SOS de prueba", description = "Registra una petición con mensaje escrito opcional de hasta 240 caracteres. No contacta emergencias ni acredita recepción por otra persona.")
    public ResponseEntity<AlertEventDto> triggerSos(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @Valid @RequestBody(required = false) SosInputRequest body) {
        String operationId = body != null && body.getOperationId() != null ? body.getOperationId() : java.util.UUID.randomUUID().toString();
        return ResponseEntity.ok(telemetryService.triggerSos(actor, patientId, operationId, body == null ? null : body.getMessage()));
    }

    @PostMapping("/{alertId}/acknowledgements")
    @Operation(summary = "Reconocer alerta", description = "Permite al cuidador marcar como atendida una alerta")
    public ResponseEntity<AlertEventDto> acknowledgeAlert(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @PathVariable("alertId") String alertId) {
        return ResponseEntity.ok(telemetryService.acknowledgeAlert(actor, patientId, alertId));
    }
}
