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

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Patient p WHERE p.id = :id")
    Optional<Patient> findByIdWithLock(@org.springframework.data.repository.query.Param("id") String id);
}
