package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "support_sessions", schema = "telemetry")
public class SupportSession {
    @Id @Column(length = 36) public String id;
    @Column(name = "patient_id", nullable = false, length = 36) public String patientId;
    @Column(name = "patient_name", nullable = false) public String patientName;
    @Column(name = "caller_id", nullable = false, length = 36) public String callerId;
    @Column(name = "responder_id", length = 36) public String responderId;
    @Column(name = "responder_name") public String responderName;
    @Column(nullable = false, length = 16) public String status;
    @Column(name = "created_at", nullable = false) public Instant createdAt;
    @Column(name = "expires_at", nullable = false) public Instant expiresAt;
    @Column(name = "ended_reason", length = 120) public String endedReason;
    @Column(name = "alert_id", nullable = false, length = 36) public String alertId;
    @Column(name = "operation_id", nullable = false, length = 100) public String operationId;
    @Column(nullable = false, length = 64) public String fingerprint;
}
