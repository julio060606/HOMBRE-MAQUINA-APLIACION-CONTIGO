package com.sanpablo.contigo.dto.telemetry;

import com.sanpablo.contigo.domain.telemetry.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class SupportDtos {
    private SupportDtos() {}
    public record CreateInput(@NotBlank @Size(max = 100) String operationId, @Size(max = 240) String message) {}
    public record EventInput(@NotBlank @Size(max = 100) String operationId,
            @NotBlank @Pattern(regexp = "TEXT|OFFER|ANSWER|ICE") String kind,
            @NotBlank @Size(max = 32768) String payload) {}
    public record EndInput(@Size(max = 120) String reason) {}
    public record ExtendInput(@NotBlank @Size(max = 100) String operationId) {}
    public record SessionDto(String id, String patientId, String patientName, String callerId, String responderId,
            String responderName, String status, Instant createdAt, Instant expiresAt, String endedReason, String alertId) {
        public SessionDto(SupportSession s) {
            this(s.id, s.patientId, s.patientName, s.callerId, s.responderId, s.responderName,
                    s.status, s.createdAt, s.expiresAt, s.endedReason, s.alertId);
        }
    }
    public record EventDto(long id, String senderId, String senderName, String kind, String payload, Instant createdAt) {
        public EventDto(SupportEvent e) { this(e.id, e.senderId, e.senderName, e.kind, e.payload, e.createdAt); }
    }
    public record EventPage(SessionDto session, List<EventDto> events) {}
}
