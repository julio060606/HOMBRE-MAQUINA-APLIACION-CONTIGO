package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.*;
import com.sanpablo.contigo.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Real REST, H2/Flyway and authorization checks. No calls to the running PostgreSQL instance. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SupportSessionIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired SupportSessionRepository sessions;
    @Autowired SupportEventRepository events;
    @Autowired AlertEventRepository alerts;
    @Autowired PatientCaregiverLinkRepository links;
    private static final String BASE = "/api/v1/patients/pat_001/support-sessions";
    private String op() { return UUID.randomUUID().toString(); }
    private String login(String email) throws Exception {
        var result = request("", "/api/v1/auth/login", Map.of("email", email, "password", "Contigo2026!"), 200);
        return result.get("token").asText();
    }
    private JsonNode request(String token, String path, Object body, int expected) throws Exception {
        var request = post(path).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
        if (body != null) request.content(json.writeValueAsBytes(body));
        var result = mvc.perform(request).andExpect(status().is(expected)).andReturn();
        return json.readTree(result.getResponse().getContentAsByteArray());
    }
    private JsonNode read(String token, String path, int expected) throws Exception {
        var result = mvc.perform(get(path).header("Authorization", "Bearer " + token)).andExpect(status().is(expected)).andReturn();
        return json.readTree(result.getResponse().getContentAsByteArray());
    }
    private JsonNode create(String patient, String message) throws Exception {
        return request(patient, BASE, Map.of("operationId", op(), "message", message), 200);
    }
    private JsonNode send(String actor, String id, String operation, String kind, String payload, int status) throws Exception {
        return request(actor, BASE + "/" + id + "/events", Map.of("operationId", operation, "kind", kind, "payload", payload), status);
    }

    @Test void createsPersistentCriticalAlertAndInitialTextAtomically() throws Exception {
        String patient = login("dacio@contigo.example");
        long count = alerts.count();
        var session = create(patient, "  No puedo hablar. Escríbeme.  ");
        String id = session.get("id").asText();
        assertThat(session.get("status").asText()).isEqualTo("WAITING");
        assertThat(session.get("callerId").asText()).isEqualTo("patient_dacio");
        assertThat(sessions.findById(id)).isPresent();
        var alert = alerts.findById(session.get("alertId").asText()).orElseThrow();
        assertThat(alert.getSeverity()).isEqualTo("CRITICAL");
        assertThat(alert.getTitle()).isEqualTo("SOS · Solicitud de comunicación");
        assertThat(alert.getDescription()).contains("No puedo hablar. Escríbeme.");
        assertThat(alerts.count()).isEqualTo(count + 1);
        var page = read(patient, BASE + "/" + id + "/events?after=0", 200);
        assertThat(page.get("events")).hasSize(1);
        assertThat(page.get("events").get(0).get("payload").asText()).isEqualTo("No puedo hablar. Escríbeme.");
    }

    @Test void retryAndAnotherRequestWhileActiveNeverDuplicateAndAliasesStayIdempotentAfterClose() throws Exception {
        String patient = login("dacio@contigo.example");
        String operation = op(), alias = op();
        var first = request(patient, BASE, Map.of("operationId", operation, "message", "Hola"), 200);
        assertThat(request(patient, BASE, Map.of("operationId", operation, "message", " Hola "), 200).get("id")).isEqualTo(first.get("id"));
        request(patient, BASE, Map.of("operationId", operation, "message", "Otro"), 409);
        assertThat(request(patient, BASE, Map.of("operationId", alias, "message", "Alias"), 200).get("id")).isEqualTo(first.get("id"));
        var history = read(patient, BASE + "/" + first.get("id").asText() + "/events", 200);
        assertThat(history.get("events").findValuesAsText("payload")).containsExactly("Hola", "Alias");
        request(patient, BASE + "/" + first.get("id").asText() + "/end", null, 200);
        assertThat(request(patient, BASE, Map.of("operationId", alias, "message", "Alias"), 200).get("id")).isEqualTo(first.get("id"));
        assertThat(create(patient, "Nueva").get("id")).isNotEqualTo(first.get("id"));
    }

    @Test void forbidsOtherPatientOtherTenantUnlinkedCaregiverAndCaregiverCreation() throws Exception {
        String patient = login("dacio@contigo.example");
        String id = create(patient, "Privado").get("id").asText();
        for (String email : List.of("rosa@contigo.example", "cuidador_sur@contigo.example", "sinvinculo@contigo.example")) {
            String token = login(email);
            read(token, BASE, 403);
            read(token, BASE + "/" + id, 403);
            read(token, BASE + "/" + id + "/events", 403);
            request(token, BASE + "/" + id + "/accept", null, 403);
        }
        request(login("cuidador@contigo.example"), BASE, Map.of("operationId", op()), 403);
        request(patient, BASE + "/" + id + "/accept", null, 403);
    }

    @Test void responderClaimIsExclusiveAndOtherAuthorizedViewersCannotReadMessagesOrSignal() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example"), admin = login("admin@contigo.example");
        String id = create(patient, "Mensaje privado").get("id").asText();
        read(caregiver, BASE + "/" + id + "/events", 403);
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        request(admin, BASE + "/" + id + "/accept", null, 409);
        read(admin, BASE + "/" + id, 200);
        read(admin, BASE + "/" + id + "/events", 403);
        send(admin, id, op(), "TEXT", "Intruso", 403);
        request(admin, BASE + "/" + id + "/end", null, 403);
        assertThat(read(caregiver, BASE + "/" + id + "/events", 200).get("events").get(0).get("payload").asText()).isEqualTo("Mensaje privado");
    }

    @Test void textIsAvailableBeforeAudioAndRetriesAndCursorAreStable() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example");
        String id = create(patient, "").get("id").asText(), operation = op();
        var first = send(patient, id, operation, "TEXT", "Necesito ayuda por escrito", 200);
        assertThat(send(patient, id, operation, "TEXT", "Necesito ayuda por escrito", 200).get("id")).isEqualTo(first.get("id"));
        send(patient, id, operation, "TEXT", "Cambiado", 409);
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        var second = send(caregiver, id, op(), "TEXT", "Estoy aquí. ¿Cómo te ayudo?", 200);
        var page = read(patient, BASE + "/" + id + "/events?after=" + first.get("id").asLong(), 200);
        assertThat(page.get("events")).hasSize(1);
        assertThat(page.get("events").get(0).get("id")).isEqualTo(second.get("id"));
    }

    @Test void signalRequiresAcceptanceCorrectParticipantAndValidEnvelope() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example");
        String id = create(patient, "").get("id").asText();
        String offer = json.writeValueAsString(Map.of("type", "offer", "sdp", "v=0\r\n"));
        String answer = json.writeValueAsString(Map.of("type", "answer", "sdp", "v=0\r\n"));
        send(patient, id, op(), "OFFER", offer, 409);
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        send(caregiver, id, op(), "OFFER", offer, 403);
        send(patient, id, op(), "ANSWER", answer, 403);
        send(patient, id, op(), "OFFER", "not-json", 422);
        send(patient, id, op(), "OFFER", answer, 422);
        send(patient, id, op(), "OFFER", offer, 200);
        send(caregiver, id, op(), "ANSWER", answer, 200);
        send(patient, id, op(), "ICE", "{\"candidate\":\"candidate:test\",\"sdpMid\":\"0\"}", 200);
        send(patient, id, op(), "ICE", "{\"callId\":\"call-1\",\"candidate\":{\"candidate\":\"candidate:test\",\"sdpMid\":\"0\",\"sdpMLineIndex\":0}}", 200);
        send(patient, id, op(), "ICE", "{\"callId\":\"call-1\",\"candidate\":{\"candidate\":55}}", 422);
    }

    @Test void limitsTextControlCharactersAndSignalSizeWithoutPartialWrites() throws Exception {
        String patient = login("dacio@contigo.example");
        long count = alerts.count();
        request(patient, BASE, Map.of("operationId", op(), "message", "x".repeat(241)), 422);
        request(patient, BASE, Map.of("operationId", op(), "message", "invalid\u0000"), 422);
        assertThat(alerts.count()).isEqualTo(count);
        String id = create(patient, "").get("id").asText();
        send(patient, id, op(), "TEXT", "a".repeat(1000), 200);
        send(patient, id, op(), "TEXT", "a".repeat(1001), 422);
        send(patient, id, op(), "TEXT", "\u0000", 422);
        send(patient, id, op(), "TEXT", "  ", 422);
        send(patient, id, op(), "ICE", "x".repeat(32769), 422);
        assertThat(events.countBySessionId(id)).isEqualTo(1);
    }

    @Test void revokedCaregiverCannotContinueReadingSendingOrClosingEvenAfterAccepting() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example");
        String id = create(patient, "").get("id").asText();
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        var link = links.findByPatientIdAndCaregiverId("pat_001", "caregiver_demo").orElseThrow();
        link.setActive(false); links.saveAndFlush(link);
        read(caregiver, BASE + "/" + id + "/events", 403);
        send(caregiver, id, op(), "TEXT", "No autorizado", 403);
        request(caregiver, BASE + "/" + id + "/end", null, 403);
        request(caregiver, BASE + "/" + id + "/extend", Map.of("operationId", op()), 403);
        read(patient, BASE + "/" + id + "/events", 200);
    }

    @Test void participantsCanExtendAtLeastTenTimesAndRetriesDoNotAddTimeTwice() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example");
        var created = create(patient, "Texto conservado");
        String id = created.get("id").asText();
        Instant expected = Instant.parse(created.get("expiresAt").asText());
        request(caregiver, BASE + "/" + id + "/extend", Map.of("operationId", op()), 403);
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        for (int index = 0; index < 10; index++) {
            String operation = op(), actor = index % 2 == 0 ? patient : caregiver;
            expected = expected.plusSeconds(1800);
            var extended = request(actor, BASE + "/" + id + "/extend", Map.of("operationId", operation), 200);
            assertThat(Instant.parse(extended.get("expiresAt").asText())).isEqualTo(expected);
            var retried = request(actor, BASE + "/" + id + "/extend", Map.of("operationId", operation), 200);
            assertThat(retried.get("expiresAt")).isEqualTo(extended.get("expiresAt"));
        }
        assertThat(events.countBySessionId(id)).isEqualTo(1);
        assertThat(read(patient, BASE + "/" + id, 200).get("status").asText()).isEqualTo("ACCEPTED");
    }

    @Test void extensionRejectsEndedExpiredAndUnauthorizedSessions() throws Exception {
        String patient = login("dacio@contigo.example"), otherPatient = login("rosa@contigo.example");
        String id = create(patient, "").get("id").asText();
        request(otherPatient, BASE + "/" + id + "/extend", Map.of("operationId", op()), 403);
        request(patient, BASE + "/" + id + "/extend", Map.of("operationId", ""), 422);
        var session = sessions.findById(id).orElseThrow();
        session.expiresAt = Instant.now().minusSeconds(1); sessions.saveAndFlush(session);
        request(patient, BASE + "/" + id + "/extend", Map.of("operationId", op()), 409);
        read(patient, BASE + "/" + id + "/events", 200);
        assertThat(session.status).isEqualTo("ENDED");
        request(patient, BASE + "/" + id + "/extend", Map.of("operationId", op()), 409);
    }

    @Test void expiryEndsSessionAndDeletesSignalButRetainsTextAndRejectsFurtherMessages() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example");
        String id = create(patient, "Texto conservado").get("id").asText();
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        send(patient, id, op(), "OFFER", "{\"type\":\"offer\",\"sdp\":\"v=0\"}", 200);
        var session = sessions.findById(id).orElseThrow(); session.expiresAt = Instant.now().minusSeconds(1); sessions.saveAndFlush(session);
        var page = read(patient, BASE + "/" + id + "/events", 200);
        assertThat(page.get("session").get("status").asText()).isEqualTo("ENDED");
        assertThat(page.get("session").get("endedReason").asText()).isEqualTo("EXPIRED");
        assertThat(page.get("events")).hasSize(1);
        assertThat(page.get("events").get(0).get("kind").asText()).isEqualTo("TEXT");
        send(patient, id, op(), "TEXT", "Tarde", 409);
        request(caregiver, BASE + "/" + id + "/accept", null, 409);
    }

    @Test void closingIsIdempotentAndDoesNotFalselyResolveTheMedicalAlert() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example");
        var session = create(patient, "Ayuda"); String id = session.get("id").asText();
        request(caregiver, BASE + "/" + id + "/accept", null, 200);
        request(patient, BASE + "/" + id + "/end", null, 200);
        assertThat(request(patient, BASE + "/" + id + "/end", null, 200).get("status").asText()).isEqualTo("ENDED");
        var alert = alerts.findById(session.get("alertId").asText()).orElseThrow();
        assertThat(alert.isResolved()).isFalse();
        assertThat(alert.getNotificationStatus()).isEqualTo("ACKNOWLEDGED");
        send(patient, id, op(), "TEXT", "Tarde", 409);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void concurrentCreateAndAcceptHaveExactlyOneSessionAndOneResponder() throws Exception {
        String patient = login("dacio@contigo.example"), caregiver = login("cuidador@contigo.example"), admin = login("admin@contigo.example");
        String operation = op();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            Callable<JsonNode> create = () -> { start.await(); return request(patient, BASE, Map.of("operationId", operation, "message", "Concurrente"), 200); };
            var one = executor.submit(create); var two = executor.submit(create); start.countDown();
            var first = one.get(10, TimeUnit.SECONDS); var second = two.get(10, TimeUnit.SECONDS);
            assertThat(first.get("id")).isEqualTo(second.get("id"));
            String id = first.get("id").asText();
            var claim = new CountDownLatch(1);
            Callable<Integer> caregiverClaim = () -> { claim.await(); return mvc.perform(post(BASE + "/" + id + "/accept").header("Authorization", "Bearer " + caregiver)).andReturn().getResponse().getStatus(); };
            Callable<Integer> adminClaim = () -> { claim.await(); return mvc.perform(post(BASE + "/" + id + "/accept").header("Authorization", "Bearer " + admin)).andReturn().getResponse().getStatus(); };
            var a = executor.submit(caregiverClaim); var b = executor.submit(adminClaim); claim.countDown();
            assertThat(List.of(a.get(10, TimeUnit.SECONDS), b.get(10, TimeUnit.SECONDS))).containsExactlyInAnyOrder(200, 409);
            Instant expiry = Instant.parse(read(patient, BASE + "/" + id, 200).get("expiresAt").asText()).plusSeconds(1800);
            var extendStart = new CountDownLatch(1);
            String extensionOperation = op();
            Callable<JsonNode> extend = () -> { extendStart.await(); return request(patient, BASE + "/" + id + "/extend", Map.of("operationId", extensionOperation), 200); };
            var extensionOne = executor.submit(extend); var extensionTwo = executor.submit(extend); extendStart.countDown();
            assertThat(Instant.parse(extensionOne.get(10, TimeUnit.SECONDS).get("expiresAt").asText())).isEqualTo(expiry);
            assertThat(Instant.parse(extensionTwo.get(10, TimeUnit.SECONDS).get("expiresAt").asText())).isEqualTo(expiry);
            request(patient, BASE + "/" + id + "/end", null, 200);
        }
    }
}
