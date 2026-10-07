package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.WeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface WeightLogRepository extends JpaRepository<WeightLog, String> {
    List<WeightLog> findByPatientIdOrderByRecordedAtDesc(String patientId);
    List<WeightLog> findByPatientIdAndRecordedAtBetweenOrderByRecordedAtDesc(String patientId, Instant start, Instant end);
}
