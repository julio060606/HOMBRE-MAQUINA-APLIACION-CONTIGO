package com.sanpablo.contigo.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class RefreshRequest {
    @NotBlank(message = "El refresh token es obligatorio")
    private String refreshToken;

    public RefreshRequest() {}
    public RefreshRequest(String refreshToken) { this.refreshToken = refreshToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}
