package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.clinical.ClinicalSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicalSettingsRepository extends JpaRepository<ClinicalSettings, String> {
    Optional<ClinicalSettings> findByPatientId(String patientId);
}
