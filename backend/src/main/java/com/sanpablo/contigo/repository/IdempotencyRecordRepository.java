package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, String> {
    Optional<IdempotencyRecord> findByOperationKey(String operationKey);
}
