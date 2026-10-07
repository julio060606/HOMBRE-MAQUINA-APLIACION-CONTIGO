package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.DashboardDto;
import com.sanpablo.contigo.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/dashboard")
@Tag(name = "Dashboard", description = "Agregado integral del paciente: tratamiento, tomas de hoy, biometría, existencias y alertas")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @Operation(summary = "Obtener resumen del dashboard", description = "Devuelve el agregado consolidado y coherente del paciente")
    public ResponseEntity<DashboardDto> getDashboard(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @RequestParam(value = "date", required = false) String date) {
        return ResponseEntity.ok(dashboardService.getDashboard(actor, patientId, date));
    }
}
