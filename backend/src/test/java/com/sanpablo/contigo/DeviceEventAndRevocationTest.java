package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.dto.auth.ClaimPinDto;
import com.sanpablo.contigo.dto.auth.LoginRequest;
import com.sanpablo.contigo.dto.auth.LoginResponse;
import com.sanpablo.contigo.dto.auth.PairingResponseDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DeviceEventAndRevocationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    @DisplayName("Flujo de vinculación por PIN y revocación inmediata de acceso y canal SSE")
    void testPairingAndRevocationFlow() throws Exception {
        String patientToken = loginAndGetToken("dacio@contigo.example", "Contigo2026!");
        String unlinkedCaregiverToken = loginAndGetToken("sinvinculo@contigo.example", "Contigo2026!");

        // 1. Cuidador sin vínculo intenta acceder a pat_001 -> 403 Forbidden
        mockMvc.perform(get("/api/v1/patients/pat_001")
                        .header("Authorization", "Bearer " + unlinkedCaregiverToken))
                .andExpect(status().isForbidden());

        // 2. Paciente genera PIN de un solo uso
        String pinJson = mockMvc.perform(post("/api/v1/pairing/requests")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("patientId", "pat_001"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        PairingResponseDto pinResp = objectMapper.readValue(pinJson, PairingResponseDto.class);
        String pin = pinResp.getPin();

        // 3. Cuidador canjea PIN con parentesco "Hijo"
        ClaimPinDto claimDto = new ClaimPinDto(pin, "Hijo");
        mockMvc.perform(post("/api/v1/pairing/claims")
                        .header("Authorization", "Bearer " + unlinkedCaregiverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(claimDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("pat_001"));

        // 4. Ahora el cuidador SÍ puede consultar a pat_001 -> 200 OK
        mockMvc.perform(get("/api/v1/patients/pat_001")
                        .header("Authorization", "Bearer " + unlinkedCaregiverToken))
                .andExpect(status().isOk());

        // 5. El cuidador puede suscribirse a SSE del paciente -> 200 OK (text/event-stream)
        mockMvc.perform(get("/api/v1/events/subscribe?patientId=pat_001")
                        .header("Authorization", "Bearer " + unlinkedCaregiverToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));

        // 6. Paciente revoca el acceso al cuidador
        mockMvc.perform(delete("/api/v1/links/pat_001/caregiver_unlinked")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isNoContent());

        // 7. Acceso revocado: consultas subsiguientes del cuidador son rechazadas -> 403 Forbidden
        mockMvc.perform(get("/api/v1/patients/pat_001")
                        .header("Authorization", "Bearer " + unlinkedCaregiverToken))
                .andExpect(status().isForbidden());

        // 8. Suscripción a eventos SSE del paciente revocado también es rechazada -> 403 Forbidden
        mockMvc.perform(get("/api/v1/events/subscribe?patientId=pat_001")
                        .header("Authorization", "Bearer " + unlinkedCaregiverToken))
                .andExpect(status().isForbidden());
    }
}
