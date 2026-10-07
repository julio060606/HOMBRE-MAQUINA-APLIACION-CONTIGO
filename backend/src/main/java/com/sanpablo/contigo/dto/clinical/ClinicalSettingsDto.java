package com.sanpablo.contigo.dto.clinical;

import com.sanpablo.contigo.domain.clinical.ClinicalSettings;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;

public class ClinicalSettingsDto {
    private String patientId;

    @Min(value = 5, message = "Mínimo 5 minutos de aviso")
    @Max(value = 180, message = "Máximo 180 minutos de aviso")
    private int notifyMissedDoseMinutes = 30;

    @Min(value = 0, message = "Volumen mínimo 0")
    @Max(value = 100, message = "Volumen máximo 100")
    private BigDecimal voiceVolumeLevel = BigDecimal.valueOf(80);

    @Min(value = 1, message = "Mínimo 1 repetición")
    @Max(value = 5, message = "Máximo 5 repeticiones")
    private int repeatAlarmCount = 3;

    private boolean voiceGuideEnabled;
    private boolean easyModeEnabled;
    private boolean highContrast;
    private boolean largeText;

    public ClinicalSettingsDto() {}

    public ClinicalSettingsDto(ClinicalSettings settings) {
        if (settings != null) {
            this.patientId = settings.getPatientId();
            this.notifyMissedDoseMinutes = settings.getNotifyMissedDoseMinutes();
            this.voiceVolumeLevel = settings.getVoiceVolumeLevel();
            this.repeatAlarmCount = settings.getRepeatAlarmCount();
            this.voiceGuideEnabled = settings.isVoiceGuideEnabled();
            this.easyModeEnabled = settings.isEasyModeEnabled();
            this.highContrast = settings.isHighContrast();
            this.largeText = settings.isLargeText();
        }
    }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
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
}
