package com.sanpablo.contigo.service;

import com.sanpablo.contigo.config.JwtTokenProvider;
import com.sanpablo.contigo.domain.auth.RefreshToken;
import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.auth.LoginRequest;
import com.sanpablo.contigo.dto.auth.LoginResponse;
import com.sanpablo.contigo.dto.auth.RefreshRequest;
import com.sanpablo.contigo.dto.auth.UserMeResponse;
import com.sanpablo.contigo.repository.RefreshTokenRepository;
import com.sanpablo.contigo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenRevocationService tokenRevocationService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       TokenRevocationService tokenRevocationService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenRevocationService = tokenRevocationService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales no válidas"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario desactivado");
        }

        // Verify password with BCrypt
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales no válidas");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        // Store refresh token
        RefreshToken tokenEntity = new RefreshToken(
                UUID.randomUUID().toString(),
                user.getId(),
                refreshToken,
                Instant.now().plusSeconds(7 * 24 * 3600)
        );
        refreshTokenRepository.save(tokenEntity);

        return new LoginResponse(accessToken, refreshToken, new UserMeResponse(user));
    }

    @Transactional
    public LoginResponse refresh(RefreshRequest request) {
        RefreshToken tokenEntity = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token no encontrado o inválido"));

        if (tokenEntity.isRevoked() || tokenEntity.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expirado o revocado");
        }

        User user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario inactivo");
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        return new LoginResponse(newAccessToken, request.getRefreshToken(), new UserMeResponse(user));
    }

    @Transactional
    public void logout(User actor) {
        logout(actor, null);
    }

    @Transactional
    public void logout(User actor, String token) {
        if (actor != null) {
            refreshTokenRepository.deleteByUserId(actor.getId());
        }
        if (token != null) {
            tokenRevocationService.revokeToken(token, actor != null ? actor.getId() : "anonymous", null);
        }
    }

    public UserMeResponse me(User actor) {
        return new UserMeResponse(actor);
    }
}
