package com.sanpablo.contigo.dto.clinical;

import com.sanpablo.contigo.domain.clinical.ClinicalSyncState;
import java.time.Instant;

public class ClinicalSyncStateDto {
    private String patientId;
    private String organizationId;
    private Instant lastSuccessfulSyncAt;
    private Instant lastAttemptAt;
    private String status;
    private String details;

    public ClinicalSyncStateDto() {}

    public ClinicalSyncStateDto(ClinicalSyncState state) {
        if (state != null) {
            this.patientId = state.getPatientId();
            this.organizationId = state.getOrganizationId();
            this.lastSuccessfulSyncAt = state.getLastSuccessfulSyncAt();
            this.lastAttemptAt = state.getLastAttemptAt();
            this.status = state.getStatus();
            this.details = state.getDetails();
        }
    }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public Instant getLastSuccessfulSyncAt() { return lastSuccessfulSyncAt; }
    public void setLastSuccessfulSyncAt(Instant lastSuccessfulSyncAt) { this.lastSuccessfulSyncAt = lastSuccessfulSyncAt; }
    public Instant getLastAttemptAt() { return lastAttemptAt; }
    public void setLastAttemptAt(Instant lastAttemptAt) { this.lastAttemptAt = lastAttemptAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
