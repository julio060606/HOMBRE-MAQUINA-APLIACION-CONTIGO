package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patients", schema = "clinical")
public class Patient {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "external_patient_id", length = 100)
    private String externalPatientId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private int age;

    @Column(name = "emergency_phone", nullable = false, length = 50)
    private String emergencyPhone;

    @Column(name = "medical_notes", columnDefinition = "TEXT")
    private String medicalNotes;

    @Column(nullable = false, length = 100)
    private String relationship = "Titular";

    @Column(name = "is_online", nullable = false)
    private boolean online = true;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "easy_mode_enabled", nullable = false)
    private boolean easyModeEnabled = true;

    @Column(name = "voice_guide_enabled", nullable = false)
    private boolean voiceGuideEnabled = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Patient() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getExternalPatientId() { return externalPatientId; }
    public void setExternalPatientId(String externalPatientId) { this.externalPatientId = externalPatientId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getEmergencyPhone() { return emergencyPhone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }
    public String getMedicalNotes() { return medicalNotes; }
    public void setMedicalNotes(String medicalNotes) { this.medicalNotes = medicalNotes; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }
    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    public boolean isEasyModeEnabled() { return easyModeEnabled; }
    public void setEasyModeEnabled(boolean easyModeEnabled) { this.easyModeEnabled = easyModeEnabled; }
    public boolean isVoiceGuideEnabled() { return voiceGuideEnabled; }
    public void setVoiceGuideEnabled(boolean voiceGuideEnabled) { this.voiceGuideEnabled = voiceGuideEnabled; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
