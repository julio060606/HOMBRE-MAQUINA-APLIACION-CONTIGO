package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.auth.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {
    Optional<RevokedToken> findByTokenHash(String tokenHash);
}
