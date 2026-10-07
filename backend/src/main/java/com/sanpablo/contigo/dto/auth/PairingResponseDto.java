package com.sanpablo.contigo.dto.auth;

import java.time.Instant;

public class PairingResponseDto {
    private String pin;
    private Instant expiresAt;

    public PairingResponseDto() {}
    public PairingResponseDto(String pin, Instant expiresAt) { this.pin = pin; this.expiresAt = expiresAt; }
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
