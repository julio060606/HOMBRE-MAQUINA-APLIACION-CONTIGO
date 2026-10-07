package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.auth.CaregiverLinkDto;
import com.sanpablo.contigo.dto.auth.ClaimPinDto;
import com.sanpablo.contigo.dto.auth.PairingResponseDto;
import com.sanpablo.contigo.dto.clinical.PatientDto;
import com.sanpablo.contigo.service.PairingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Vinculación y Cuidadores", description = "Endpoints para generación y canje de PIN efímero, consulta de cuidadores y revocación")
public class PairingController {

    private final PairingService pairingService;

    public PairingController(PairingService pairingService) {
        this.pairingService = pairingService;
    }

    @PostMapping("/pairing/requests")
    @Operation(summary = "Generar PIN efímero", description = "Permite al paciente generar un PIN de 6 dígitos de un solo uso para vincular a un familiar")
    public ResponseEntity<PairingResponseDto> generatePin(
            @AuthenticationPrincipal User actor,
            @RequestBody Map<String, String> body) {
        String patientId = body.get("patientId");
        return ResponseEntity.ok(pairingService.generatePin(actor, patientId));
    }

    @PostMapping("/pairing/claims")
    @Operation(summary = "Canjear PIN de vinculación", description = "Permite al cuidador vincularse introduciendo el PIN de 6 dígitos y su parentesco")
    public ResponseEntity<PatientDto> claimPin(
            @AuthenticationPrincipal User actor,
            @Valid @RequestBody ClaimPinDto dto) {
        return ResponseEntity.ok(pairingService.claimPin(actor, dto));
    }

    @GetMapping("/patients/{patientId}/caregivers")
    @Operation(summary = "Listar cuidadores vinculados", description = "Devuelve los cuidadores que tienen acceso activo a este paciente")
    public ResponseEntity<List<CaregiverLinkDto>> getCaregivers(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId) {
        return ResponseEntity.ok(pairingService.getCaregivers(actor, patientId));
    }

    @DeleteMapping("/links/{patientId}/{caregiverId}")
    @Operation(summary = "Revocar acceso a cuidador", description = "Retira el vínculo de acceso al cuidador de forma inmediata y desconecta eventos en vivo")
    public ResponseEntity<Void> revokeLink(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @PathVariable("caregiverId") String caregiverId) {
        pairingService.revokeLink(actor, patientId, caregiverId);
        return ResponseEntity.noContent().build();
    }
}
