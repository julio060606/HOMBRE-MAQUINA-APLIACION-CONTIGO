package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.PillIntake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PillIntakeRepository extends JpaRepository<PillIntake, String> {
    List<PillIntake> findByPatientId(String patientId);
    List<PillIntake> findByPatientIdAndScheduledDate(String patientId, String scheduledDate);
    List<PillIntake> findByPatientIdAndScheduledAtBetween(String patientId, Instant start, Instant end);
    Optional<PillIntake> findByIdAndPatientId(String id, String patientId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT p FROM PillIntake p WHERE p.id = :id AND p.patientId = :patientId")
    Optional<PillIntake> findByIdAndPatientIdWithLock(@org.springframework.data.repository.query.Param("id") String id, @org.springframework.data.repository.query.Param("patientId") String patientId);

    List<PillIntake> findByMedicationIdAndStatus(String medicationId, String status);
}
