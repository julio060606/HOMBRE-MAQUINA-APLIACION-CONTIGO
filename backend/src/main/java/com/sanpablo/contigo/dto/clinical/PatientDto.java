package com.sanpablo.contigo.dto.clinical;

import com.sanpablo.contigo.domain.clinical.Patient;
import java.time.Instant;

public class PatientDto {
    private String id;
    private String organizationId;
    private String externalPatientId;
    private String fullName;
    private int age;
    private String emergencyPhone;
    private String medicalNotes;
    private String relationship;
    private boolean isOnline;
    private Instant lastSyncAt;
    private boolean easyModeEnabled;
    private boolean voiceGuideEnabled;

    public PatientDto() {}

    public PatientDto(Patient patient) {
        this.id = patient.getId();
        this.organizationId = patient.getOrganizationId();
        this.externalPatientId = patient.getExternalPatientId();
        this.fullName = patient.getFullName();
        this.age = patient.getAge();
        this.emergencyPhone = patient.getEmergencyPhone();
        this.medicalNotes = patient.getMedicalNotes();
        this.relationship = patient.getRelationship();
        this.isOnline = patient.isOnline();
        this.lastSyncAt = patient.getLastSyncAt();
        this.easyModeEnabled = patient.isEasyModeEnabled();
        this.voiceGuideEnabled = patient.isVoiceGuideEnabled();
    }

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
    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean online) { isOnline = online; }
    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    public boolean isEasyModeEnabled() { return easyModeEnabled; }
    public void setEasyModeEnabled(boolean easyModeEnabled) { this.easyModeEnabled = easyModeEnabled; }
    public boolean isVoiceGuideEnabled() { return voiceGuideEnabled; }
    public void setVoiceGuideEnabled(boolean voiceGuideEnabled) { this.voiceGuideEnabled = voiceGuideEnabled; }
}
