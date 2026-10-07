package com.sanpablo.contigo.domain.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "pairing_pin_requests", schema = "auth")
public class PairingPinRequest {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 6)
    private String pin;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "claimed_by", length = 36)
    private String claimedBy;

    @Column(name = "claimed_at")
    private Instant claimedAt;

    public PairingPinRequest() {}

    public PairingPinRequest(String id, String pin, String patientId, Instant expiresAt) {
        this.id = id;
        this.pin = pin;
        this.patientId = patientId;
        this.expiresAt = expiresAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public String getClaimedBy() { return claimedBy; }
    public void setClaimedBy(String claimedBy) { this.claimedBy = claimedBy; }
    public Instant getClaimedAt() { return claimedAt; }
    public void setClaimedAt(Instant claimedAt) { this.claimedAt = claimedAt; }
}
