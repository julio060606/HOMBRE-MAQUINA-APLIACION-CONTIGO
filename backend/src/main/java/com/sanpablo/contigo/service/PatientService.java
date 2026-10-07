package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.PatientCaregiverLink;
import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.auth.UserRole;
import com.sanpablo.contigo.domain.clinical.*;
import com.sanpablo.contigo.dto.clinical.*;
import com.sanpablo.contigo.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final ClinicalProfileRepository profileRepository;
    private final ClinicalSettingsRepository settingsRepository;
    private final ClinicalThresholdRepository thresholdRepository;
    private final MedicationRepository medicationRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicalSyncStateRepository syncStateRepository;
    private final AuthorizationService authorizationService;

    public PatientService(PatientRepository patientRepository,
                          PatientCaregiverLinkRepository linkRepository,
                          ClinicalProfileRepository profileRepository,
                          ClinicalSettingsRepository settingsRepository,
                          ClinicalThresholdRepository thresholdRepository,
                          MedicationRepository medicationRepository,
                          AppointmentRepository appointmentRepository,
                          ClinicalSyncStateRepository syncStateRepository,
                          AuthorizationService authorizationService) {
        this.patientRepository = patientRepository;
        this.linkRepository = linkRepository;
        this.profileRepository = profileRepository;
        this.settingsRepository = settingsRepository;
        this.thresholdRepository = thresholdRepository;
        this.medicationRepository = medicationRepository;
        this.appointmentRepository = appointmentRepository;
        this.syncStateRepository = syncStateRepository;
        this.authorizationService = authorizationService;
    }

    public List<PatientDto> getAccessiblePatients(User actor) {
        if (actor.getRole() == UserRole.ROLE_PATIENT) {
            if (actor.getPatientId() == null) return Collections.emptyList();
            return patientRepository.findById(actor.getPatientId())
                    .map(p -> List.of(new PatientDto(p)))
                    .orElse(Collections.emptyList());
        }

        if (actor.getRole() == UserRole.ROLE_CAREGIVER) {
            List<PatientCaregiverLink> links = linkRepository.findByCaregiverIdAndActiveTrue(actor.getId());
            List<PatientDto> result = new ArrayList<>();
            for (PatientCaregiverLink link : links) {
                patientRepository.findById(link.getPatientId()).ifPresent(p -> {
                    if (p.getOrganizationId().equals(actor.getOrganizationId())) {
                        PatientDto dto = new PatientDto(p);
                        dto.setRelationship(link.getRelationship());
                        result.add(dto);
                    }
                });
            }
            return result;
        }

        if (actor.getRole() == UserRole.ROLE_CLINIC_ADMIN) {
            return patientRepository.findByOrganizationId(actor.getOrganizationId()).stream()
                    .map(PatientDto::new)
                    .collect(Collectors.toList());
        }

        if (actor.getRole() == UserRole.ROLE_SUPER_ADMIN) {
            return patientRepository.findAll().stream()
                    .map(PatientDto::new)
                    .collect(Collectors.toList());
        }

        return Collections.emptyList();
    }

    public PatientDto getPatient(User actor, String patientId) {
        Patient p = authorizationService.authorizePatientAccess(actor, patientId);
        return new PatientDto(p);
    }

    public ClinicalProfileDto getClinicalProfile(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return profileRepository.findByPatientId(patientId)
                .map(ClinicalProfileDto::new)
                .orElse(null);
    }

    public List<MedicationDto> getPrescriptions(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return medicationRepository.findByPatientId(patientId).stream()
                .map(MedicationDto::new)
                .collect(Collectors.toList());
    }

    public List<AppointmentDto> getAppointments(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return appointmentRepository.findByPatientIdOrderByStartsAtAsc(patientId).stream()
                .map(AppointmentDto::new)
                .collect(Collectors.toList());
    }

    public ClinicalSettingsDto getSettings(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return settingsRepository.findByPatientId(patientId)
                .map(ClinicalSettingsDto::new)
                .orElseGet(() -> {
                    ClinicalSettings s = new ClinicalSettings();
                    s.setPatientId(patientId);
                    s.setOrganizationId(actor.getOrganizationId());
                    return new ClinicalSettingsDto(s);
                });
    }

    @Transactional
    public ClinicalSettingsDto updateSettings(User actor, String patientId, ClinicalSettingsDto dto) {
        Patient patient = authorizationService.authorizePatientAccess(actor, patientId);

        ClinicalSettings settings = settingsRepository.findByPatientId(patientId)
                .orElseGet(() -> {
                    ClinicalSettings s = new ClinicalSettings();
                    s.setPatientId(patientId);
                    s.setOrganizationId(patient.getOrganizationId());
                    return s;
                });

        settings.setNotifyMissedDoseMinutes(dto.getNotifyMissedDoseMinutes());
        settings.setVoiceVolumeLevel(dto.getVoiceVolumeLevel());
        settings.setRepeatAlarmCount(dto.getRepeatAlarmCount());
        settings.setVoiceGuideEnabled(dto.isVoiceGuideEnabled());
        settings.setEasyModeEnabled(dto.isEasyModeEnabled());
        settings.setHighContrast(dto.isHighContrast());
        settings.setLargeText(dto.isLargeText());
        settings.setUpdatedAt(Instant.now());

        settings = settingsRepository.save(settings);
        return new ClinicalSettingsDto(settings);
    }

    public List<ClinicalThresholdDto> getThresholds(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return thresholdRepository.findByPatientId(patientId).stream()
                .map(ClinicalThresholdDto::new)
                .collect(Collectors.toList());
    }

    public ClinicalSyncStateDto getSyncState(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return syncStateRepository.findByPatientId(patientId)
                .map(ClinicalSyncStateDto::new)
                .orElse(null);
    }
}
