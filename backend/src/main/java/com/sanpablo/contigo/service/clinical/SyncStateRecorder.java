package com.sanpablo.contigo.service.clinical;

import com.sanpablo.contigo.domain.clinical.ClinicalSyncState;
import com.sanpablo.contigo.repository.ClinicalSyncStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class SyncStateRecorder {

    private final ClinicalSyncStateRepository syncStateRepository;

    public SyncStateRecorder(ClinicalSyncStateRepository syncStateRepository) {
        this.syncStateRepository = syncStateRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(String patientId, String organizationId, String errorDetails) {
        ClinicalSyncState state = syncStateRepository.findByPatientId(patientId).orElseGet(ClinicalSyncState::new);
        state.setPatientId(patientId);
        state.setOrganizationId(organizationId);
        state.setStatus("FAILED");
        state.setLastAttemptAt(Instant.now());
        state.setDetails(errorDetails);
        syncStateRepository.save(state);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(String patientId, String organizationId, String details) {
        ClinicalSyncState state = syncStateRepository.findByPatientId(patientId).orElseGet(ClinicalSyncState::new);
        state.setPatientId(patientId);
        state.setOrganizationId(organizationId);
        state.setStatus("SYNCED");
        state.setLastAttemptAt(Instant.now());
        state.setLastSuccessfulSyncAt(Instant.now());
        state.setDetails(details);
        syncStateRepository.save(state);
    }
}
