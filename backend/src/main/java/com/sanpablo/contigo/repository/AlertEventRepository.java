package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.AlertEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AlertEventRepository extends JpaRepository<AlertEvent, String> {
    List<AlertEvent> findByPatientIdOrderByTimestampDesc(String patientId);
    List<AlertEvent> findByPatientIdAndTimestampBetweenOrderByTimestampDesc(String patientId, Instant start, Instant end);
}
