package com.sanpablo.contigo.dto.auth;

public class LoginResponse {
    private String token;
    private String refreshToken;
    private UserMeResponse user;

    public LoginResponse() {}
    public LoginResponse(String token, String refreshToken, UserMeResponse user) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = user;
    }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public UserMeResponse getUser() { return user; }
    public void setUser(UserMeResponse user) { this.user = user; }
}
