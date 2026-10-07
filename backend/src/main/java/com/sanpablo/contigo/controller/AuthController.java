package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.auth.LoginRequest;
import com.sanpablo.contigo.dto.auth.LoginResponse;
import com.sanpablo.contigo.dto.auth.RefreshRequest;
import com.sanpablo.contigo.dto.auth.UserMeResponse;
import com.sanpablo.contigo.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Endpoints de login, renovación de token, logout e identidad de sesión")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuario", description = "Devuelve token JWT y refresh token para la sesión")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar sesión", description = "Genera un nuevo token de acceso usando el refresh token")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Revoca los tokens de refresco del usuario actual y añade el token de acceso a la lista de revocación")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal User actor,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = (authHeader != null && authHeader.startsWith("Bearer ")) ? authHeader.substring(7) : null;
        authService.logout(actor, token);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Usuario actual", description = "Devuelve el perfil y rol del usuario autenticado")
    public ResponseEntity<UserMeResponse> me(@AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(authService.me(actor));
    }
}
