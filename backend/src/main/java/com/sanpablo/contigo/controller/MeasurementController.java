package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.BloodPressureLogDto;
import com.sanpablo.contigo.dto.telemetry.PressureInputRequest;
import com.sanpablo.contigo.dto.telemetry.WeightInputRequest;
import com.sanpablo.contigo.dto.telemetry.WeightLogDto;
import com.sanpablo.contigo.service.TelemetryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/measurements")
@Tag(name = "Mediciones y Signos", description = "Endpoints para consultar y registrar presión arterial, pulso y peso doméstico")
public class MeasurementController {

    private final TelemetryService telemetryService;

    public MeasurementController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @GetMapping("/pressure")
    @Operation(summary = "Historial de presión arterial", description = "Devuelve registros cronológicos con origen y canal")
    public ResponseEntity<List<BloodPressureLogDto>> getPressures(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to) {
        return ResponseEntity.ok(telemetryService.getPressures(actor, patientId, from, to));
    }

    @PostMapping("/pressure")
    @Operation(summary = "Registrar presión arterial", description = "Permite al paciente registrar sistólica, diastólica y pulso en casa")
    public ResponseEntity<BloodPressureLogDto> recordPressure(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @Valid @RequestBody PressureInputRequest request) {
        return ResponseEntity.ok(telemetryService.recordBloodPressure(actor, patientId, request));
    }

    @GetMapping("/weight")
    @Operation(summary = "Historial de peso", description = "Devuelve registros de peso doméstico")
    public ResponseEntity<List<WeightLogDto>> getWeights(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to) {
        return ResponseEntity.ok(telemetryService.getWeights(actor, patientId, from, to));
    }

    @PostMapping("/weight")
    @Operation(summary = "Registrar peso doméstico", description = "Permite al paciente registrar su peso en kilogramos en casa")
    public ResponseEntity<WeightLogDto> recordWeight(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @Valid @RequestBody WeightInputRequest request) {
        return ResponseEntity.ok(telemetryService.recordWeight(actor, patientId, request));
    }
}
