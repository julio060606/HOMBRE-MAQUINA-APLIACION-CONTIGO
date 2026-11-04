package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.SupportSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
import java.time.Instant;

public interface SupportSessionRepository extends JpaRepository<SupportSession, String> {
    List<SupportSession> findTop20ByPatientIdOrderByCreatedAtDesc(String patientId);
    List<SupportSession> findByPatientIdAndStatusNotOrderByCreatedAtDesc(String patientId, String status);
    Optional<SupportSession> findByCallerIdAndOperationId(String callerId, String operationId);
    List<SupportSession> findTop100ByStatusNotAndExpiresAtBeforeOrderByExpiresAtAsc(String status, Instant before);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SupportSession s where s.id = :id")
    Optional<SupportSession> lockById(@Param("id") String id);
}
