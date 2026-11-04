package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.repository.AlertEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Synthetic, transactional H2 tests; no connection to the running local databases. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SosTextCommunicationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AlertEventRepository alerts;

    private String login(String email) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", "Contigo2026!"))))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private MvcResult send(String token, String patientId, Map<String, String> body, int expectedStatus) throws Exception {
        return mvc.perform(post("/api/v1/patients/" + patientId + "/alerts/sos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().is(expectedStatus)).andReturn();
    }

    private JsonNode payload(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsByteArray());
    }

    @Test
    void writtenMessageIsTrimmedStoredAndVisibleToLinkedCaregiver() throws Exception {
        String message = "No puedo hablar. Por favor, escríbeme.";
        var created = payload(send(login("dacio@contigo.example"), "pat_001",
                Map.of("operationId", UUID.randomUUID().toString(), "message", "  " + message + "  "), 200));
        String id = created.get("id").asText();
        assertThat(created.get("title").asText()).isEqualTo("SOS de prueba del paciente");
        assertThat(created.get("description").asText()).endsWith("Mensaje del paciente: " + message)
                .contains("No se contactó a servicios de emergencia");
        assertThat(created.get("notificationStatus").asText()).isEqualTo("REGISTERED");
        assertThat(alerts.findById(id).orElseThrow().getDescription()).isEqualTo(created.get("description").asText());

        var caregiverAlerts = mvc.perform(get("/api/v1/patients/pat_001/alerts")
                        .header("Authorization", "Bearer " + login("cuidador@contigo.example")))
                .andExpect(status().isOk()).andReturn();
        assertThat(payload(caregiverAlerts).findValuesAsText("description")).contains(created.get("description").asText());
    }

    @Test
    void existingClientsMayOmitTheEntireBody() throws Exception {
        mvc.perform(post("/api/v1/patients/pat_001/alerts/sos")
                        .header("Authorization", "Bearer " + login("dacio@contigo.example")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notificationStatus").value("REGISTERED"))
                .andExpect(jsonPath("$.title").value("SOS de prueba del paciente"));
    }

    @Test
    void blankMessageBehavesLikeTheOriginalRequestAndRetriesDoNotDuplicate() throws Exception {
        String token = login("dacio@contigo.example");
        String operation = UUID.randomUUID().toString();
        long countBefore = alerts.count();
        var first = payload(send(token, "pat_001", Map.of("operationId", operation), 200));
        var repeated = payload(send(token, "pat_001", Map.of("operationId", operation, "message", " \n\t "), 200));
        assertThat(repeated.get("id")).isEqualTo(first.get("id"));
        assertThat(repeated.get("description").asText()).doesNotContain("Mensaje del paciente:");
        assertThat(alerts.count()).isEqualTo(countBefore + 1);
    }

    @Test
    void repeatedWrittenMessageReturnsTheSameRecord() throws Exception {
        String token = login("dacio@contigo.example");
        String operation = UUID.randomUUID().toString();
        long countBefore = alerts.count();
        var first = payload(send(token, "pat_001", Map.of("operationId", operation, "message", "Necesito ayuda por escrito."), 200));
        var repeated = payload(send(token, "pat_001", Map.of("operationId", operation, "message", " Necesito ayuda por escrito. "), 200));
        assertThat(repeated.get("id")).isEqualTo(first.get("id"));
        assertThat(alerts.count()).isEqualTo(countBefore + 1);
    }

    @Test
    void changingTheMessageOnRetryIsRejectedWithoutReplacingOriginal() throws Exception {
        String token = login("dacio@contigo.example");
        String operation = UUID.randomUUID().toString();
        var first = payload(send(token, "pat_001", Map.of("operationId", operation, "message", "Por favor, escribe."), 200));
        send(token, "pat_001", Map.of("operationId", operation, "message", "Otro mensaje."), 409);
        assertThat(alerts.findById(first.get("id").asText()).orElseThrow().getDescription())
                .endsWith("Mensaje del paciente: Por favor, escribe.");
    }

    @Test
    void messageAccepts240CharactersButRejects241WithoutCreatingAnAlert() throws Exception {
        String token = login("dacio@contigo.example");
        long before = alerts.count();
        send(token, "pat_001", Map.of("operationId", UUID.randomUUID().toString(), "message", "á".repeat(240)), 200);
        var invalid = send(token, "pat_001", Map.of("operationId", UUID.randomUUID().toString(), "message", "á".repeat(241)), 422);
        assertThat(payload(invalid).get("details").has("message")).isTrue();
        assertThat(alerts.count()).isEqualTo(before + 1);
    }

    @Test
    void unsupportedControlCharactersAreRejectedWithValidationError() throws Exception {
        String token = login("dacio@contigo.example");
        long before = alerts.count();
        send(token, "pat_001", Map.of("operationId", UUID.randomUUID().toString(), "message", "Por favor\u0000 escribe"), 422);
        assertThat(alerts.count()).isEqualTo(before);
    }

    @Test
    void anotherPatientAndCaregiverCannotWriteASos() throws Exception {
        long before = alerts.count();
        String operation = UUID.randomUUID().toString();
        send(login("dacio@contigo.example"), "pat_002", Map.of("operationId", operation, "message", "Mensaje privado"), 403);
        send(login("cuidador@contigo.example"), "pat_001", Map.of("operationId", operation, "message", "Mensaje privado"), 403);
        assertThat(alerts.count()).isEqualTo(before);
    }
}
