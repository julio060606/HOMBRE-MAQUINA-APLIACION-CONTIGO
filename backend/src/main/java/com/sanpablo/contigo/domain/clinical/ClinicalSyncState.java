package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "clinical_sync_state", schema = "clinical")
public class ClinicalSyncState {

    @Id
    @Column(name = "patient_id", length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "last_successful_sync_at")
    private Instant lastSuccessfulSyncAt;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @Column(nullable = false, length = 50)
    private String status = "SYNCED";

    @Column(columnDefinition = "TEXT")
    private String details;

    public ClinicalSyncState() {}

    public ClinicalSyncState(String patientId, String organizationId, String status, String details) {
        this.patientId = patientId;
        this.organizationId = organizationId;
        this.status = status;
        this.details = details;
        this.lastAttemptAt = Instant.now();
        this.lastSuccessfulSyncAt = Instant.now();
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
