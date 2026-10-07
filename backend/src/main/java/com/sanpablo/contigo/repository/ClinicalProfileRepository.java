package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.clinical.ClinicalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicalProfileRepository extends JpaRepository<ClinicalProfile, String> {
    Optional<ClinicalProfile> findByPatientId(String patientId);
}
