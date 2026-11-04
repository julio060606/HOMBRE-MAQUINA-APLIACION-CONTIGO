package com.sanpablo.contigo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.auth.UserRole;
import com.sanpablo.contigo.domain.telemetry.*;
import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.dto.telemetry.SupportDtos.*;
import com.sanpablo.contigo.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Persists text and short-lived WebRTC signaling, never audio. Every request rechecks the current patient link. */
@Service
@Transactional
public class SupportSessionService {
    private final SupportSessionRepository sessions;
    private final SupportEventRepository events;
    private final PatientRepository patients;
    private final AlertEventRepository alerts;
    private final AuthorizationService authorization;
    private final TelemetryService telemetry;
    private final EventPublishingService publisher;
    private final ObjectMapper json;
    private final IdempotencyRecordRepository operations;

    public SupportSessionService(SupportSessionRepository sessions, SupportEventRepository events,
            PatientRepository patients, AlertEventRepository alerts, AuthorizationService authorization,
            TelemetryService telemetry, EventPublishingService publisher, ObjectMapper json, IdempotencyRecordRepository operations) {
        this.sessions = sessions; this.events = events; this.patients = patients; this.alerts = alerts;
        this.authorization = authorization; this.telemetry = telemetry; this.publisher = publisher; this.json = json; this.operations = operations;
    }

    public SessionDto create(User actor, String patientId, CreateInput input) {
        var patient = authorization.authorizePatientWrite(actor, patientId);
        // A patient row lock serializes all create requests, including across server instances.
        patients.findByIdWithLock(patientId).orElseThrow();
        String message = input.message() == null ? "" : input.message().strip();
        checkText(message, 240, true);
        String fingerprint = hash(patientId + "\n" + message);
        String operationKey = actor.getId() + ":support:" + input.operationId();
        var previous = operations.findByOperationKey(operationKey);
        if (previous.isPresent()) {
            if (!previous.get().getFingerprint().equals(fingerprint)) throw conflict("La operación ya se registró con otro mensaje");
            var original = sessions.findById(previous.get().getResourceId()).orElseThrow();
            expire(original);
            return new SessionDto(original);
        }
        for (var active : sessions.findByPatientIdAndStatusNotOrderByCreatedAtDesc(patientId, "ENDED")) {
            expire(active);
            if (!active.status.equals("ENDED")) {
                // Reusing an open request must not silently discard a newly supplied written message.
                if (!message.isEmpty()) {
                    if (events.countBySessionId(active.id) >= 1000) throw conflict("Se alcanzó el límite de esta conversación");
                    persistEvent(actor, active, "request:" + hash(input.operationId()), "TEXT", message);
                }
                operations.save(new IdempotencyRecord(UUID.randomUUID().toString(), operationKey, fingerprint, active.id, "SAVED"));
                return new SessionDto(active);
            }
        }

        var alert = telemetry.triggerSos(actor, patientId, "support:" + input.operationId(), message);
        // Keep the existing /alerts/sos compatibility contract while making this new flow's purpose explicit.
        var persistedAlert = alerts.findById(alert.getId()).orElseThrow();
        persistedAlert.setTitle("SOS · Solicitud de comunicación");
        persistedAlert.setDescription("El paciente solicita hablar o escribir con el equipo de apoyo en CONTIGO."
                + (message.isEmpty() ? "" : " Mensaje del paciente: " + message)
                + " No se contactó a servicios de emergencia.");
        var session = new SupportSession();
        session.id = UUID.randomUUID().toString(); session.patientId = patientId; session.patientName = patient.getFullName();
        session.callerId = actor.getId(); session.status = "WAITING"; session.createdAt = Instant.now();
        session.expiresAt = session.createdAt.plus(30, ChronoUnit.MINUTES); session.alertId = alert.getId();
        session.operationId = input.operationId(); session.fingerprint = fingerprint;
        sessions.saveAndFlush(session);
        operations.save(new IdempotencyRecord(UUID.randomUUID().toString(), operationKey, fingerprint, session.id, "SAVED"));
        if (!message.isEmpty()) persistEvent(actor, session, "initial", "TEXT", message);
        publish(session);
        return new SessionDto(session);
    }

    public List<SessionDto> list(User actor, String patientId) {
        authorization.authorizePatientAccess(actor, patientId);
        return sessions.findTop20ByPatientIdOrderByCreatedAtDesc(patientId).stream().map(s -> {
            expire(s); return new SessionDto(s);
        }).toList();
    }

    public SessionDto get(User actor, String patientId, String id) {
        var session = load(actor, patientId, id); expire(session); return new SessionDto(session);
    }

    public EventPage readEvents(User actor, String patientId, String id, long after) {
        var session = load(actor, patientId, id);
        participant(actor, session);
        expire(session);
        return new EventPage(new SessionDto(session), events.findTop100BySessionIdAndIdGreaterThanOrderByIdAsc(id, Math.max(0, after))
                .stream().map(EventDto::new).toList());
    }

    public SessionDto accept(User actor, String patientId, String id) {
        var session = load(actor, patientId, id);
        if (actor.getRole() == UserRole.ROLE_PATIENT) throw forbidden("Solo una cuenta de apoyo autorizada puede atender");
        active(session);
        if (session.responderId != null && !session.responderId.equals(actor.getId())) {
            throw conflict("Otra persona ya está atendiendo esta solicitud");
        }
        if (session.responderId == null) {
            session.responderId = actor.getId(); session.responderName = actor.getName(); session.status = "ACCEPTED";
            var alert = alerts.findById(session.alertId).orElseThrow();
            alert.setNotificationStatus("ACKNOWLEDGED"); alert.setAcknowledgedAt(Instant.now()); alert.setAcknowledgedBy(actor.getId());
            publish(session);
        }
        return new SessionDto(session);
    }

    public EventDto send(User actor, String patientId, String id, EventInput input) {
        var session = load(actor, patientId, id); participant(actor, session); active(session);
        String payload = input.kind().equals("TEXT") ? input.payload().strip() : input.payload();
        if (input.kind().equals("TEXT")) checkText(payload, 1000, false);
        else {
            if (!session.status.equals("ACCEPTED")) throw conflict("Espera a que una persona atienda antes de activar la voz");
            if (input.kind().equals("OFFER") && !actor.getId().equals(session.callerId)) throw forbidden("Solo el paciente inicia el audio");
            if (input.kind().equals("ANSWER") && !actor.getId().equals(session.responderId)) throw forbidden("Solo quien atiende responde al audio");
            checkSignal(input.kind(), payload);
        }
        var previous = events.findBySessionIdAndSenderIdAndOperationId(id, actor.getId(), input.operationId());
        if (previous.isPresent()) {
            if (!previous.get().kind.equals(input.kind()) || !previous.get().payload.equals(payload)) throw conflict("La operación ya tiene otros datos");
            return new EventDto(previous.get());
        }
        if (events.countBySessionId(id) >= 1000) throw conflict("Se alcanzó el límite de esta conversación. Finaliza y abre una nueva solicitud");
        return new EventDto(persistEvent(actor, session, input.operationId(), input.kind(), payload));
    }

    public SessionDto end(User actor, String patientId, String id, EndInput input) {
        var session = load(actor, patientId, id); participant(actor, session);
        expire(session);
        if (!session.status.equals("ENDED")) {
            session.status = "ENDED";
            session.endedReason = actor.getId().equals(session.callerId) ? "PATIENT_ENDED" : "SUPPORT_ENDED";
            // EndInput is accepted for forwards compatibility. The server owns the public reason; no arbitrary text broadcast.
            events.deleteBySessionIdAndKindNot(id, "TEXT");
            publish(session);
        }
        // Closing a call does not silently mark the SOS as medically resolved.
        return new SessionDto(session);
    }

    public SessionDto extend(User actor, String patientId, String id, ExtendInput input) {
        var session = load(actor, patientId, id);
        participant(actor, session);
        String operationKey = actor.getId() + ":support-extend:" + hash(id + "\n" + input.operationId());
        // The session lock serializes extensions and their retries across server instances.
        if (operations.findByOperationKey(operationKey).isPresent()) {
            expire(session);
            return new SessionDto(session);
        }
        active(session);
        session.expiresAt = session.expiresAt.plus(30, ChronoUnit.MINUTES);
        operations.save(new IdempotencyRecord(UUID.randomUUID().toString(), operationKey, hash(id), id, "SAVED"));
        publish(session);
        return new SessionDto(session);
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    public void expireAbandonedSessions() {
        // Also expires unvisited sessions after a browser closes. Locks coordinate with a simultaneous accept/end.
        for (var candidate : sessions.findTop100ByStatusNotAndExpiresAtBeforeOrderByExpiresAtAsc("ENDED", Instant.now())) {
            sessions.lockById(candidate.id).ifPresent(this::expire);
        }
    }

    private SupportSession load(User actor, String patientId, String id) {
        authorization.authorizePatientAccess(actor, patientId);
        var session = sessions.lockById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada"));
        if (!session.patientId.equals(patientId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversación no encontrada");
        return session;
    }
    private void participant(User actor, SupportSession session) {
        if (!actor.getId().equals(session.callerId) && !actor.getId().equals(session.responderId)) {
            throw forbidden("Primero debes atender la solicitud. Solo sus participantes pueden leer o escribir la conversación");
        }
    }
    private void expire(SupportSession session) {
        if (!session.status.equals("ENDED") && !Instant.now().isBefore(session.expiresAt)) {
            session.status = "ENDED"; session.endedReason = "EXPIRED";
            events.deleteBySessionIdAndKindNot(session.id, "TEXT"); publish(session);
        }
    }
    private void active(SupportSession session) {
        expire(session);
        if (session.status.equals("ENDED")) throw conflict("La conversación ha finalizado. Abre una nueva solicitud si necesitas ayuda");
    }
    private SupportEvent persistEvent(User actor, SupportSession session, String operationId, String kind, String payload) {
        var event = new SupportEvent(); event.sessionId = session.id; event.senderId = actor.getId();
        event.senderName = actor.getName(); event.operationId = operationId; event.kind = kind;
        event.payload = payload; event.createdAt = Instant.now();
        return events.saveAndFlush(event);
    }
    private void checkText(String text, int max, boolean emptyAllowed) {
        if ((!emptyAllowed && text.isBlank()) || text.length() > max || text.codePoints().anyMatch(c -> Character.isISOControl(c) && c != '\n' && c != '\r' && c != '\t')) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Texto vacío, demasiado largo o con caracteres de control");
        }
    }
    private void checkSignal(String kind, String payload) {
        try {
            var signal = json.readTree(payload);
            if (!signal.isObject() || payload.length() > 32768) throw new IllegalArgumentException();
            if (kind.equals("ICE")) {
                var candidate = signal.path("candidate");
                if (!candidate.isTextual() && !(candidate.isObject() && candidate.path("candidate").isTextual())) throw new IllegalArgumentException();
            } else if (!signal.path("type").asText().equals(kind.toLowerCase(Locale.ROOT)) || !signal.path("sdp").isTextual()) {
                throw new IllegalArgumentException();
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Señal de audio no válida");
        }
    }
    private void publish(SupportSession session) {
        var patient = patients.findById(session.patientId).orElseThrow();
        // Only state metadata goes over patient-level SSE; never text, SDP or ICE candidates.
        publisher.publish(new DomainEventDto(UUID.randomUUID().toString(), "SUPPORT_SESSION", patient.getOrganizationId(),
                session.patientId, session.id, new SessionDto(session)));
    }
    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception impossible) { throw new IllegalStateException(impossible); }
    }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }
    private ResponseStatusException forbidden(String message) { return new ResponseStatusException(HttpStatus.FORBIDDEN, message); }
}
