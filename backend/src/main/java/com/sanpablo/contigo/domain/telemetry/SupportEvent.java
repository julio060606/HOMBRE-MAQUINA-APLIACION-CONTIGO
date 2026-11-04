package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "support_events", schema = "telemetry")
public class SupportEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(name = "session_id", nullable = false, length = 36) public String sessionId;
    @Column(name = "sender_id", nullable = false, length = 36) public String senderId;
    @Column(name = "sender_name", nullable = false) public String senderName;
    @Column(nullable = false, length = 16) public String kind;
    @Column(nullable = false, columnDefinition = "TEXT") public String payload;
    @Column(name = "created_at", nullable = false) public Instant createdAt;
    @Column(name = "operation_id", nullable = false, length = 100) public String operationId;
}
