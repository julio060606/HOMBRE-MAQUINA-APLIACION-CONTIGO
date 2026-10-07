package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.RevokedToken;
import com.sanpablo.contigo.repository.RevokedTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenRevocationService {

    private static final Logger log = LoggerFactory.getLogger(TokenRevocationService.class);
    private final RevokedTokenRepository revokedTokenRepository;
    private final Set<String> fastRevokedCache = ConcurrentHashMap.newKeySet();

    public TokenRevocationService(RevokedTokenRepository revokedTokenRepository) {
        this.revokedTokenRepository = revokedTokenRepository;
    }

    public static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedHash.length);
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    @Transactional
    public void revokeToken(String token, String userId, Instant expiresAt) {
        if (token == null || token.isBlank()) return;
        String hash = hashToken(token);
        fastRevokedCache.add(hash);
        try {
            revokedTokenRepository.save(new RevokedToken(hash, userId, expiresAt != null ? expiresAt : Instant.now().plusSeconds(86400)));
        } catch (Exception e) {
            log.warn("Error saving revoked token to database: {}", e.getMessage());
        }
    }

    public boolean isRevoked(String token) {
        if (token == null || token.isBlank()) return false;
        String hash = hashToken(token);
        if (fastRevokedCache.contains(hash)) return true;
        boolean inDb = revokedTokenRepository.findByTokenHash(hash).isPresent();
        if (inDb) fastRevokedCache.add(hash);
        return inDb;
    }
}
