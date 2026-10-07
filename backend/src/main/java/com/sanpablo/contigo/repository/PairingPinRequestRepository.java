package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.auth.PairingPinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PairingPinRequestRepository extends JpaRepository<PairingPinRequest, String> {
    Optional<PairingPinRequest> findByPinAndClaimedByIsNullAndExpiresAtAfter(String pin, Instant now);
    List<PairingPinRequest> findByPatientIdAndClaimedByIsNull(String patientId);
}
