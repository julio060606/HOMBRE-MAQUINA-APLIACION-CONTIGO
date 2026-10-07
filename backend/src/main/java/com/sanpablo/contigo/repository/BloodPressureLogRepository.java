package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.BloodPressureLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface BloodPressureLogRepository extends JpaRepository<BloodPressureLog, String> {
    List<BloodPressureLog> findByPatientIdOrderByRecordedAtDesc(String patientId);
    List<BloodPressureLog> findByPatientIdAndRecordedAtBetweenOrderByRecordedAtDesc(String patientId, Instant start, Instant end);
}
