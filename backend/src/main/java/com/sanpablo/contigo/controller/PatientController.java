package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.clinical.*;
import com.sanpablo.contigo.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@Tag(name = "Pacientes", description = "Gestión de fichas clínicas, recetas, citas y preferencias de pacientes")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    @Operation(summary = "Listar pacientes accesibles", description = "Devuelve los pacientes autorizados para el actor autenticado")
    public ResponseEntity<List<PatientDto>> getPatients(@AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(patientService.getAccessiblePatients(actor));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener paciente", description = "Devuelve el perfil del paciente si está dentro del ámbito permitido")
    public ResponseEntity<PatientDto> getPatient(@AuthenticationPrincipal User actor, @PathVariable("id") String id) {
        return ResponseEntity.ok(patientService.getPatient(actor, id));
    }

    @GetMapping("/{id}/clinical-profile")
    @Operation(summary = "Ficha clínica", description = "Devuelve los datos clínicos importados de la clínica")
    public ResponseEntity<ClinicalProfileDto> getClinicalProfile(@AuthenticationPrincipal User actor, @PathVariable("id") String id) {
        return ResponseEntity.ok(patientService.getClinicalProfile(actor, id));
    }

    @GetMapping("/{id}/prescriptions")
    @Operation(summary = "Recetas clínicas", description = "Devuelve los tratamientos vigentes importados de la clínica")
    public ResponseEntity<List<MedicationDto>> getPrescriptions(@AuthenticationPrincipal User actor, @PathVariable("id") String id) {
        return ResponseEntity.ok(patientService.getPrescriptions(actor, id));
    }

    @GetMapping("/{id}/appointments")
    @Operation(summary = "Citas médicas", description = "Devuelve las citas agendadas importadas")
    public ResponseEntity<List<AppointmentDto>> getAppointments(@AuthenticationPrincipal User actor, @PathVariable("id") String id) {
        return ResponseEntity.ok(patientService.getAppointments(actor, id));
    }

    @GetMapping("/{id}/preferences")
    @Operation(summary = "Preferencias", description = "Devuelve los ajustes accesibles del paciente")
    public ResponseEntity<ClinicalSettingsDto> getSettings(@AuthenticationPrincipal User actor, @PathVariable("id") String id) {
        return ResponseEntity.ok(patientService.getSettings(actor, id));
    }

    @PatchMapping("/{id}/preferences")
    @Operation(summary = "Actualizar preferencias", description = "Guarda las preferencias del paciente (voz, contraste, tolerancia)")
    public ResponseEntity<ClinicalSettingsDto> updateSettings(
            @AuthenticationPrincipal User actor,
            @PathVariable("id") String id,
            @Valid @RequestBody ClinicalSettingsDto dto) {
        return ResponseEntity.ok(patientService.updateSettings(actor, id, dto));
    }

    @GetMapping("/{id}/clinical-thresholds")
    @Operation(summary = "Rangos clínicos", description = "Devuelve los umbrales clínicos autorizados")
    public ResponseEntity<List<ClinicalThresholdDto>> getThresholds(@AuthenticationPrincipal User actor, @PathVariable("id") String id) {
        return ResponseEntity.ok(patientService.getThresholds(actor, id));
    }

    @GetMapping("/{id}/clinical-sync")
    @Operation(summary = "Estado de sincronización clínica", description = "Devuelve la última sincronización con el proveedor clínico")
    public ResponseEntity<ClinicalSyncStateDto> getSyncState(@AuthenticationPrincipal User actor, @PathVariable("id") String id) {
        return ResponseEntity.ok(patientService.getSyncState(actor, id));
    }
}
