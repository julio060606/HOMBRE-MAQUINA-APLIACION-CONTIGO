package com.sanpablo.contigo.domain.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_caregiver_links", schema = "auth")
public class PatientCaregiverLink {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "caregiver_id", nullable = false, length = 36)
    private String caregiverId;

    @Column(nullable = false, length = 100)
    private String relationship;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "linked_at", nullable = false)
    private Instant linkedAt = Instant.now();

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public PatientCaregiverLink() {}

    public PatientCaregiverLink(String id, String patientId, String caregiverId, String relationship) {
        this.id = id;
        this.patientId = patientId;
        this.caregiverId = caregiverId;
        this.relationship = relationship;
        this.active = true;
        this.linkedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getCaregiverId() { return caregiverId; }
    public void setCaregiverId(String caregiverId) { this.caregiverId = caregiverId; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getLinkedAt() { return linkedAt; }
    public void setLinkedAt(Instant linkedAt) { this.linkedAt = linkedAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
}
