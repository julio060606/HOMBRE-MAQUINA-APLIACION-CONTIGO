package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.SupportEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface SupportEventRepository extends JpaRepository<SupportEvent, Long> {
    List<SupportEvent> findTop100BySessionIdAndIdGreaterThanOrderByIdAsc(String sessionId, long after);
    Optional<SupportEvent> findBySessionIdAndSenderIdAndOperationId(String sessionId, String senderId, String operationId);
    long countBySessionId(String sessionId);
    void deleteBySessionIdAndKindNot(String sessionId, String kind);
}
