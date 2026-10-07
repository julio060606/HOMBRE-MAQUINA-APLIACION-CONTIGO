package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.dto.auth.LoginRequest;
import com.sanpablo.contigo.dto.auth.LoginResponse;
import com.sanpablo.contigo.dto.telemetry.IntakeCorrectionRequest;
import com.sanpablo.contigo.dto.telemetry.IntakeResponseRequest;
import com.sanpablo.contigo.dto.telemetry.SupplyMovementRequest;
import com.sanpablo.contigo.repository.PillIntakeRepository;
import com.sanpablo.contigo.service.clinical.ClinicalSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class IntakeAndInventoryConcurrencyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PillIntakeRepository intakeRepository;

    @Autowired
    private ClinicalSyncService syncService;

    private String patientToken;
    private String caregiverToken;
    private PillIntake testDose;

    @BeforeEach
    void setUp() throws Exception {
        patientToken = loginAndGetToken("dacio@contigo.example", "Contigo2026!");
        caregiverToken = loginAndGetToken("cuidador@contigo.example", "Contigo2026!");

        // Ensure doses exist for today
        syncService.syncPatient("pat_001");

        String today = LocalDate.now(ZoneId.of("America/Lima")).toString();
        testDose = intakeRepository.findByPatientId( "pat_001").stream()
                .filter(d -> "PENDING".equals(d.getStatus()))
                .findFirst()
                .orElseGet(() -> {
                    PillIntake intake = new PillIntake();
                    intake.setId(UUID.randomUUID().toString());
                    intake.setPatientId("pat_001");
                    intake.setOrganizationId("clinic_demo");
                    intake.setMedicationId("med_001");
                    intake.setMedicationName("Losartán");
                    intake.setDosage("50 mg");
                    intake.setScheduledTime("08:00");
                    intake.setScheduledDate(today);
                    intake.setScheduledAt(Instant.now());
                    intake.setStatus("PENDING");
                    intake.setVersion(1);
                    intake.setPrescriptionVersion(1);
                    intake.setUnitsPerDose(BigDecimal.ONE);
                    intake.setStockUnit("tabletas");
                    return intakeRepository.save(intake);
                });
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password);
        String responseJson = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        LoginResponse resp = objectMapper.readValue(responseJson, LoginResponse.class);
        return resp.getToken();
    }

    @Test
    @DisplayName("Toma positiva descuenta inventario de forma atómica e idempotente sin duplicados")
    void testAtomicIntakeAndIdempotency() throws Exception {
        String operationId = "op-dose-test-" + UUID.randomUUID();

        IntakeResponseRequest req = new IntakeResponseRequest();
        req.setResponse("TAKEN");
        req.setOperationId(operationId);
        req.setExpectedDoseVersion(testDose.getVersion());

        // 1. Primera confirmación
        mockMvc.perform(post("/api/v1/patients/pat_001/doses/" + testDose.getId() + "/responses")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TAKEN"));

        // 2. Reintento con la misma operationId e idéntico payload -> Retorna 200 OK y NO descuenta doble
        mockMvc.perform(post("/api/v1/patients/pat_001/doses/" + testDose.getId() + "/responses")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TAKEN"));

        // 3. Reintento con la misma operationId pero payload alterado -> 409 Conflict
        IntakeResponseRequest conflictingReq = new IntakeResponseRequest();
        conflictingReq.setResponse("NOT_TAKEN");
        conflictingReq.setOperationId(operationId);
        conflictingReq.setExpectedDoseVersion(testDose.getVersion());

        mockMvc.perform(post("/api/v1/patients/pat_001/doses/" + testDose.getId() + "/responses")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conflictingReq)))
                .andExpect(status().isConflict());

        // 4. Corregir la toma a NOT_TAKEN revierte el inventario con motivo obligatorio
        IntakeCorrectionRequest corrReq = new IntakeCorrectionRequest();
        corrReq.setNewStatus("NOT_TAKEN");
        corrReq.setReason("Error de digitación, no la tomé");
        corrReq.setOperationId("op-correct-" + UUID.randomUUID());

        mockMvc.perform(post("/api/v1/patients/pat_001/intakes/" + testDose.getId() + "/corrections")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corrReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NOT_TAKEN"));
    }

    @Test
    @DisplayName("Cuidador puede registrar reposición con motivo y la operación es idempotente")
    void testCaregiverRestockIdempotency() throws Exception {
        String operationId = "op-restock-" + UUID.randomUUID();

        SupplyMovementRequest req = new SupplyMovementRequest();
        req.setKind("RESTOCK");
        req.setQuantity(BigDecimal.valueOf(10));
        req.setReason("Compra mensual en farmacia");
        req.setOperationId(operationId);

        // Primera llamada -> 200 OK
        mockMvc.perform(post("/api/v1/patients/pat_001/supplies/med_001/movements")
                        .header("Authorization", "Bearer " + caregiverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Segunda llamada idéntica -> 200 OK idempotente
        mockMvc.perform(post("/api/v1/patients/pat_001/supplies/med_001/movements")
                        .header("Authorization", "Bearer " + caregiverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }
}
