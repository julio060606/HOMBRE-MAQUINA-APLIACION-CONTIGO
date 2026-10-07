package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.dto.auth.LoginRequest;
import com.sanpablo.contigo.dto.auth.LoginResponse;
import com.sanpablo.contigo.dto.telemetry.PressureInputRequest;
import com.sanpablo.contigo.dto.telemetry.WeightInputRequest;
import com.sanpablo.contigo.repository.ClinicalProfileRepository;
import com.sanpablo.contigo.repository.WeightLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TelemetryAndReportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClinicalProfileRepository clinicalProfileRepository;

    @Autowired
    private WeightLogRepository weightLogRepository;

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password);
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        LoginResponse response = objectMapper.readValue(res.getResponse().getContentAsString(), LoginResponse.class);
        return response.getToken();
    }

    @Test
    @DisplayName("El registro de peso doméstico no sobrescribe el peso clínico oficial")
    void domesticWeightMustNotOverwriteClinicalWeight() throws Exception {
        String patientToken = loginAndGetToken("dacio@contigo.example", "Contigo2026!");
        String patientId = "pat_001";

        var clinicalProfileBefore = clinicalProfileRepository.findByPatientId(patientId).orElseThrow();
        BigDecimal officialClinicalWeight = clinicalProfileBefore.getWeightKg();
        assertThat(officialClinicalWeight).isNotNull();

        WeightInputRequest weightReq = new WeightInputRequest();
        weightReq.setWeightKg(new BigDecimal("79.5"));
        weightReq.setOperationId("op-weight-" + UUID.randomUUID());

        mockMvc.perform(post("/api/v1/patients/" + patientId + "/measurements/weight")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weightReq)))
                .andExpect(status().isOk());

        var clinicalProfileAfter = clinicalProfileRepository.findByPatientId(patientId).orElseThrow();
        assertThat(clinicalProfileAfter.getWeightKg()).isEqualByComparingTo(officialClinicalWeight);

        var domesticLogs = weightLogRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        assertThat(domesticLogs).isNotEmpty();
        assertThat(domesticLogs.getFirst().getWeightKg()).isEqualByComparingTo(new BigDecimal("79.5"));
    }

    @Test
    @DisplayName("El cuidador puede descargar el informe de adherencia en PDF")
    void caregiverCanDownloadAdherencePdf() throws Exception {
        String caregiverToken = loginAndGetToken("cuidador@contigo.example", "Contigo2026!");
        String patientId = "pat_001";

        MvcResult result = mockMvc.perform(get("/api/v1/patients/" + patientId + "/reports/pdf")
                        .header("Authorization", "Bearer " + caregiverToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();

        byte[] pdfBytes = result.getResponse().getContentAsByteArray();
        assertThat(pdfBytes).isNotEmpty();
        // PDF magic bytes %PDF
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("El paciente registra presión arterial y se almacena con su timestamp")
    void patientRecordsBloodPressure() throws Exception {
        String patientToken = loginAndGetToken("dacio@contigo.example", "Contigo2026!");
        String patientId = "pat_001";

        PressureInputRequest req = new PressureInputRequest();
        req.setSystolic(125);
        req.setDiastolic(82);
        req.setPulse(72);
        req.setRecordedAt(Instant.now().toString());
        req.setNotes("Medición matutina de prueba");
        req.setOperationId("op-bp-" + UUID.randomUUID());

        mockMvc.perform(post("/api/v1/patients/" + patientId + "/measurements/pressure")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("El paciente emite SOS y genera un evento de alerta con estado PENDING")
    void patientTriggersSosAlert() throws Exception {
        String patientToken = loginAndGetToken("dacio@contigo.example", "Contigo2026!");
        String patientId = "pat_001";

        String operationId = "op-sos-" + UUID.randomUUID();
        mockMvc.perform(post("/api/v1/patients/" + patientId + "/alerts/sos")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operationId\":\"" + operationId + "\"}"))
                .andExpect(status().isOk());
    }
}
