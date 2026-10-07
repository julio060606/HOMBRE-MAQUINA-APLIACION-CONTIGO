package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.dto.auth.LoginRequest;
import com.sanpablo.contigo.dto.auth.LoginResponse;
import com.sanpablo.contigo.dto.telemetry.IntakeResponseRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthAndPermissionsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String caregiverToken;
    private String patientDacioToken;
    private String caregiverOtherClinicToken;

    @BeforeEach
    void setUp() throws Exception {
        caregiverToken = loginAndGetToken("cuidador@contigo.example", "Contigo2026!");
        patientDacioToken = loginAndGetToken("dacio@contigo.example", "Contigo2026!");
        caregiverOtherClinicToken = loginAndGetToken("cuidador_sur@contigo.example", "Contigo2026!");
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
    @DisplayName("Login con credenciales incorrectas debe retornar 401 Unauthorized")
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest req = new LoginRequest("cuidador@contigo.example", "PasswordErronea123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Paciente puede consultar su propia ficha clínica pero no la de otro paciente")
    void testPatientAccessIsolation() throws Exception {
        // Dacio consulta su propio perfil -> 200 OK
        mockMvc.perform(get("/api/v1/patients/pat_001/clinical-profile")
                        .header("Authorization", "Bearer " + patientDacioToken))
                .andExpect(status().isOk());

        // Dacio intenta consultar el perfil de Rosa (pat_002) -> 403 Forbidden
        mockMvc.perform(get("/api/v1/patients/pat_002/clinical-profile")
                        .header("Authorization", "Bearer " + patientDacioToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Cuidador de otra clínica no puede acceder a pacientes de otra organización")
    void testMultiTenantIsolation() throws Exception {
        // Cuidador Sur (clinic_sur) intenta consultar a Dacio (clinic_demo) -> 403 Forbidden
        mockMvc.perform(get("/api/v1/patients/pat_001")
                        .header("Authorization", "Bearer " + caregiverOtherClinicToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Cuidador no puede registrar tomas en nombre del paciente (solo lectura de seguimiento)")
    void testCaregiverCannotRecordIntake() throws Exception {
        IntakeResponseRequest req = new IntakeResponseRequest();
        req.setResponse("TAKEN");
        req.setOperationId("caregiver-attempt-1");
        req.setExpectedDoseVersion(1);

        mockMvc.perform(post("/api/v1/patients/pat_001/doses/some-dose-id/responses")
                        .header("Authorization", "Bearer " + caregiverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}
