package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.telemetry.IntakeCorrection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntakeCorrectionRepository extends JpaRepository<IntakeCorrection, String> {
    List<IntakeCorrection> findByIntakeId(String intakeId);
}
