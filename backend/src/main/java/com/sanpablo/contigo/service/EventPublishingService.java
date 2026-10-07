package com.sanpablo.contigo.service;

import com.sanpablo.contigo.dto.events.DomainEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class EventPublishingService {

    private static final Logger log = LoggerFactory.getLogger(EventPublishingService.class);

    // Map: patientId -> list of registered SseEmitter wrappers
    private final Map<String, CopyOnWriteArrayList<EmitterSubscription>> subscriptions = new ConcurrentHashMap<>();

    public static class EmitterSubscription {
        private final String userId;
        private final String patientId;
        private final SseEmitter emitter;

        public EmitterSubscription(String userId, String patientId, SseEmitter emitter) {
            this.userId = userId;
            this.patientId = patientId;
            this.emitter = emitter;
        }

        public String getUserId() { return userId; }
        public String getPatientId() { return patientId; }
        public SseEmitter getEmitter() { return emitter; }
    }

    public SseEmitter subscribe(String userId, String patientId) {
        // 30 minute timeout
        SseEmitter emitter = new SseEmitter(1800000L);
        EmitterSubscription sub = new EmitterSubscription(userId, patientId, emitter);

        subscriptions.computeIfAbsent(patientId, k -> new CopyOnWriteArrayList<>()).add(sub);

        emitter.onCompletion(() -> removeSubscription(patientId, sub));
        emitter.onTimeout(() -> removeSubscription(patientId, sub));
        emitter.onError(e -> removeSubscription(patientId, sub));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Suscripción activa para paciente", "patientId", patientId)));
        } catch (IOException e) {
            log.warn("Error al enviar evento de bienvenida SSE: {}", e.getMessage());
        }

        return emitter;
    }

    public void publish(DomainEventDto event) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            broadcast(event);
                        }
                    }
            );
        } else {
            broadcast(event);
        }
    }

    private void broadcast(DomainEventDto event) {
        CopyOnWriteArrayList<EmitterSubscription> subs = subscriptions.get(event.getPatientId());
        if (subs == null || subs.isEmpty()) return;

        for (EmitterSubscription sub : subs) {
            try {
                sub.getEmitter().send(SseEmitter.event()
                        .id(event.getEventId())
                        .name(event.getType())
                        .data(event));
            } catch (IOException e) {
                log.warn("Fallo al entregar evento SSE a usuario {}: {}", sub.getUserId(), e.getMessage());
                removeSubscription(event.getPatientId(), sub);
            }
        }
    }

    public void disconnectUser(String userId, String patientId) {
        CopyOnWriteArrayList<EmitterSubscription> subs = subscriptions.get(patientId);
        if (subs != null) {
            for (EmitterSubscription sub : subs) {
                if (sub.getUserId().equals(userId)) {
                    try {
                        sub.getEmitter().send(SseEmitter.event()
                                .name("REVOKED")
                                .data(Map.of("message", "Acceso revocado para este paciente")));
                        sub.getEmitter().complete();
                    } catch (Exception ignored) {}
                    subs.remove(sub);
                }
            }
        }
    }

    private void removeSubscription(String patientId, EmitterSubscription sub) {
        CopyOnWriteArrayList<EmitterSubscription> subs = subscriptions.get(patientId);
        if (subs != null) {
            subs.remove(sub);
        }
    }
}
