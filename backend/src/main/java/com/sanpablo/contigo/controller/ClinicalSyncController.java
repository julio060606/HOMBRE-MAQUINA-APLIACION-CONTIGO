package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.service.AuthorizationService;
import com.sanpablo.contigo.service.clinical.ClinicalSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/clinical-sync")
@Tag(name = "Sincronización Clínica", description = "Endpoints para disparar sincronización e importación de recetas y citas")
public class ClinicalSyncController {

    private final ClinicalSyncService syncService;
    private final AuthorizationService authorizationService;

    public ClinicalSyncController(ClinicalSyncService syncService, AuthorizationService authorizationService) {
        this.syncService = syncService;
        this.authorizationService = authorizationService;
    }

    @PostMapping("/{patientId}")
    @Operation(summary = "Sincronizar datos clínicos del paciente", description = "Consulta al proveedor clínico y actualiza prescripciones, citas y ficha")
    public ResponseEntity<Map<String, String>> syncPatient(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        syncService.syncPatient(patientId);
        return ResponseEntity.ok(Map.of("message", "Sincronización completada con éxito", "patientId", patientId));
    }
}
