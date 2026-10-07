package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.clinical.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {
    List<Patient> findByOrganizationId(String organizationId);
    Optional<Patient> findByIdAndOrganizationId(String id, String organizationId);
}
