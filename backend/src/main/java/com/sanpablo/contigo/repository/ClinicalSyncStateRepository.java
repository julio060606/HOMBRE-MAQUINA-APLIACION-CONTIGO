package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.clinical.ClinicalSyncState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicalSyncStateRepository extends JpaRepository<ClinicalSyncState, String> {
    Optional<ClinicalSyncState> findByPatientId(String patientId);
}
