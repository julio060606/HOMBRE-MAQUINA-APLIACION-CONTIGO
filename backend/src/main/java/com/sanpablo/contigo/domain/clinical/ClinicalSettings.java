package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "clinical_settings", schema = "clinical")
public class ClinicalSettings {

    @Id
    @Column(name = "patient_id", length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "notify_missed_dose_minutes", nullable = false)
    private int notifyMissedDoseMinutes = 30;

    @Column(name = "voice_volume_level", precision = 5, scale = 2, nullable = false)
    private BigDecimal voiceVolumeLevel = BigDecimal.valueOf(80);

    @Column(name = "repeat_alarm_count", nullable = false)
    private int repeatAlarmCount = 3;

    @Column(name = "voice_guide_enabled", nullable = false)
    private boolean voiceGuideEnabled = false;

    @Column(name = "easy_mode_enabled", nullable = false)
    private boolean easyModeEnabled = true;

    @Column(name = "high_contrast", nullable = false)
    private boolean highContrast = false;

    @Column(name = "large_text", nullable = false)
    private boolean largeText = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ClinicalSettings() {}

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public int getNotifyMissedDoseMinutes() { return notifyMissedDoseMinutes; }
    public void setNotifyMissedDoseMinutes(int notifyMissedDoseMinutes) { this.notifyMissedDoseMinutes = notifyMissedDoseMinutes; }
    public BigDecimal getVoiceVolumeLevel() { return voiceVolumeLevel; }
    public void setVoiceVolumeLevel(BigDecimal voiceVolumeLevel) { this.voiceVolumeLevel = voiceVolumeLevel; }
    public int getRepeatAlarmCount() { return repeatAlarmCount; }
    public void setRepeatAlarmCount(int repeatAlarmCount) { this.repeatAlarmCount = repeatAlarmCount; }
    public boolean isVoiceGuideEnabled() { return voiceGuideEnabled; }
    public void setVoiceGuideEnabled(boolean voiceGuideEnabled) { this.voiceGuideEnabled = voiceGuideEnabled; }
    public boolean isEasyModeEnabled() { return easyModeEnabled; }
    public void setEasyModeEnabled(boolean easyModeEnabled) { this.easyModeEnabled = easyModeEnabled; }
    public boolean isHighContrast() { return highContrast; }
    public void setHighContrast(boolean highContrast) { this.highContrast = highContrast; }
    public boolean isLargeText() { return largeText; }
    public void setLargeText(boolean largeText) { this.largeText = largeText; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
