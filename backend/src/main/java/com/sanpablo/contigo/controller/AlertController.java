package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.AlertEventDto;
import com.sanpablo.contigo.service.TelemetryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    @Operation(summary = "Petición de auxilio SOS", description = "Permite al paciente emitir una alerta crítica con estado de notificación")
    public ResponseEntity<AlertEventDto> triggerSos(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @RequestBody(required = false) Map<String, String> body) {
        String operationId = body != null && body.containsKey("operationId") ? body.get("operationId") : java.util.UUID.randomUUID().toString();
        return ResponseEntity.ok(telemetryService.triggerSos(actor, patientId, operationId));
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
