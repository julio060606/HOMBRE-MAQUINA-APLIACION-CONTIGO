package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.IntakeCorrectionRequest;
import com.sanpablo.contigo.dto.telemetry.IntakeResponseRequest;
import com.sanpablo.contigo.dto.telemetry.PillIntakeDto;
import com.sanpablo.contigo.service.IntakeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients/{patientId}")
@Tag(name = "Tomas y Dosis", description = "Endpoints para consultar dosis, registrar confirmaciones (TAKEN/NOT_TAKEN) y correcciones")
public class IntakeController {

    private final IntakeService intakeService;

    public IntakeController(IntakeService intakeService) {
        this.intakeService = intakeService;
    }

    @GetMapping("/doses")
    @Operation(summary = "Listar dosis", description = "Devuelve las dosis del paciente filtradas opcionalmente por rango temporal")
    public ResponseEntity<List<PillIntakeDto>> getDoses(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to) {
        return ResponseEntity.ok(intakeService.getDoses(actor, patientId, from, to));
    }

    @PostMapping("/doses/{doseId}/responses")
    @Operation(summary = "Registrar toma/no toma", description = "Permite al paciente confirmar TAKEN o NOT_TAKEN con idempotencia y descuento de stock")
    public ResponseEntity<PillIntakeDto> respond(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @PathVariable("doseId") String doseId,
            @Valid @RequestBody IntakeResponseRequest request) {
        return ResponseEntity.ok(intakeService.respond(actor, patientId, doseId, request));
    }

    @PostMapping("/intakes/{intakeId}/corrections")
    @Operation(summary = "Corregir respuesta de toma", description = "Permite al paciente modificar una declaración previa con motivo obligatorio y reversión de inventario")
    public ResponseEntity<PillIntakeDto> correct(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @PathVariable("intakeId") String intakeId,
            @Valid @RequestBody IntakeCorrectionRequest request) {
        return ResponseEntity.ok(intakeService.correct(actor, patientId, intakeId, request));
    }
}
