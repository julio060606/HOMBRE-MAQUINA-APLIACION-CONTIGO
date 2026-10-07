package com.sanpablo.contigo.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ClaimPinDto {
    @NotBlank(message = "El PIN es obligatorio")
    @Pattern(regexp = "^\\d{6}$", message = "El PIN debe tener exactamente 6 dígitos")
    private String pin;

    @NotBlank(message = "El parentesco es obligatorio")
    private String relationship;

    public ClaimPinDto() {}
    public ClaimPinDto(String pin, String relationship) { this.pin = pin; this.relationship = relationship; }
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
}
