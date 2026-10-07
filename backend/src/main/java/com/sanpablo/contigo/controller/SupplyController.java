package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.StockMovementDto;
import com.sanpablo.contigo.dto.telemetry.SupplyDto;
import com.sanpablo.contigo.dto.telemetry.SupplyMovementRequest;
import com.sanpablo.contigo.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients/{patientId}")
@Tag(name = "Inventario y Existencias", description = "Endpoints para consultar existencias físicas y registrar compras o conteos")
public class SupplyController {

    private final InventoryService inventoryService;

    public SupplyController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/supplies")
    @Operation(summary = "Consultar existencias", description = "Devuelve el saldo y cobertura calculada de cada medicamento")
    public ResponseEntity<List<SupplyDto>> getSupplies(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId) {
        return ResponseEntity.ok(inventoryService.getSupplies(actor, patientId));
    }

    @GetMapping("/supplies/movements")
    @Operation(summary = "Historial de movimientos", description = "Devuelve las reposiciones, consumos y ajustes registrados")
    public ResponseEntity<List<StockMovementDto>> getMovements(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId) {
        return ResponseEntity.ok(inventoryService.getMovements(actor, patientId));
    }

    @PostMapping("/supplies/{medicationId}/movements")
    @Operation(summary = "Registrar reposición o ajuste", description = "Permite al cuidador registrar compra o recuento físico con auditoría")
    public ResponseEntity<Void> addMovement(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @PathVariable("medicationId") String medicationId,
            @Valid @RequestBody SupplyMovementRequest request) {
        inventoryService.addMovement(actor, patientId, medicationId, request);
        return ResponseEntity.ok().build();
    }
}
