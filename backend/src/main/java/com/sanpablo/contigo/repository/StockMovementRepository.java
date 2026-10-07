package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, String> {
    List<StockMovement> findByPatientId(String patientId);
    List<StockMovement> findByPatientIdAndMedicationId(String patientId, String medicationId);
    List<StockMovement> findByIntakeId(String intakeId);
}
