package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.clinical.ClinicalThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalThresholdRepository extends JpaRepository<ClinicalThreshold, String> {
    List<ClinicalThreshold> findByPatientId(String patientId);
}
