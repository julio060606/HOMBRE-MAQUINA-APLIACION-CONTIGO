package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.auth.PatientCaregiverLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientCaregiverLinkRepository extends JpaRepository<PatientCaregiverLink, String> {
    List<PatientCaregiverLink> findByCaregiverIdAndActiveTrue(String caregiverId);
    List<PatientCaregiverLink> findByPatientIdAndActiveTrue(String patientId);
    Optional<PatientCaregiverLink> findByPatientIdAndCaregiverId(String patientId, String caregiverId);
    boolean existsByPatientIdAndCaregiverIdAndActiveTrue(String patientId, String caregiverId);
}
