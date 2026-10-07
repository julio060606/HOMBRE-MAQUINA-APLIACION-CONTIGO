package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.PairingPinRequest;
import com.sanpablo.contigo.domain.auth.PatientCaregiverLink;
import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.auth.UserRole;
import com.sanpablo.contigo.domain.clinical.Patient;
import com.sanpablo.contigo.domain.telemetry.AuditLog;
import com.sanpablo.contigo.dto.auth.CaregiverLinkDto;
import com.sanpablo.contigo.dto.auth.ClaimPinDto;
import com.sanpablo.contigo.dto.auth.PairingResponseDto;
import com.sanpablo.contigo.dto.clinical.PatientDto;
import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.repository.AuditLogRepository;
import com.sanpablo.contigo.repository.PairingPinRequestRepository;
import com.sanpablo.contigo.repository.PatientCaregiverLinkRepository;
import com.sanpablo.contigo.repository.PatientRepository;
import com.sanpablo.contigo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PairingService {

    private final PairingPinRequestRepository pinRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditRepository;
    private final AuthorizationService authorizationService;
    private final EventPublishingService eventPublishingService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PairingService(PairingPinRequestRepository pinRepository,
                          PatientCaregiverLinkRepository linkRepository,
                          PatientRepository patientRepository,
                          UserRepository userRepository,
                          AuditLogRepository auditRepository,
                          AuthorizationService authorizationService,
                          EventPublishingService eventPublishingService) {
        this.pinRepository = pinRepository;
        this.linkRepository = linkRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.auditRepository = auditRepository;
        this.authorizationService = authorizationService;
        this.eventPublishingService = eventPublishingService;
    }

    @Transactional
    public PairingResponseDto generatePin(User actor, String patientId) {
        authorizationService.authorizePatientWrite(actor, patientId);

        // Delete earlier unclaimed requests for this patient
        List<PairingPinRequest> old = pinRepository.findByPatientIdAndClaimedByIsNull(patientId);
        pinRepository.deleteAll(old);

        String pin = String.format("%06d", secureRandom.nextInt(1000000));
        Instant expiresAt = Instant.now().plusSeconds(600); // 10 minutes

        PairingPinRequest request = new PairingPinRequest(
                UUID.randomUUID().toString(),
                pin,
                patientId,
                expiresAt
        );
        pinRepository.save(request);

        return new PairingResponseDto(pin, expiresAt);
    }

    @Transactional
    public PatientDto claimPin(User actor, ClaimPinDto dto) {
        if (actor.getRole() != UserRole.ROLE_CAREGIVER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el cuidador puede vincularse con un PIN");
        }

        PairingPinRequest request = pinRepository.findByPinAndClaimedByIsNullAndExpiresAtAfter(dto.getPin(), Instant.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN inválido, utilizado o expirado"));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));

        if (!patient.getOrganizationId().equals(actor.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El paciente pertenece a otra organización");
        }

        request.setClaimedBy(actor.getId());
        request.setClaimedAt(Instant.now());
        pinRepository.save(request);

        Optional<PatientCaregiverLink> existingLink = linkRepository.findByPatientIdAndCaregiverId(patient.getId(), actor.getId());
        PatientCaregiverLink link;
        if (existingLink.isPresent()) {
            link = existingLink.get();
            link.setActive(true);
            link.setRelationship(dto.getRelationship());
            link.setRevokedAt(null);
        } else {
            link = new PatientCaregiverLink(
                    UUID.randomUUID().toString(),
                    patient.getId(),
                    actor.getId(),
                    dto.getRelationship()
            );
        }
        linkRepository.save(link);

        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patient.getId(),
                actor.getId(),
                "CAREGIVER_LINKED",
                "Cuidador vinculado con parentesco: " + dto.getRelationship()
        );
        auditRepository.save(audit);

        PatientDto patientDto = new PatientDto(patient);
        patientDto.setRelationship(dto.getRelationship());

        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "LINK_CREATED",
                patient.getOrganizationId(),
                patient.getId(),
                link.getId(),
                patientDto
        ));

        return patientDto;
    }

    public List<CaregiverLinkDto> getCaregivers(User actor, String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        List<PatientCaregiverLink> links = linkRepository.findByPatientIdAndActiveTrue(patientId);

        return links.stream().map(l -> {
            String name = userRepository.findById(l.getCaregiverId())
                    .map(User::getName)
                    .orElse("Cuidador vinculado");
            return new CaregiverLinkDto(l.getCaregiverId(), name, l.getRelationship(), l.isActive());
        }).collect(Collectors.toList());
    }

    @Transactional
    public void revokeLink(User actor, String patientId, String caregiverId) {
        authorizationService.authorizePatientAccess(actor, patientId);

        if (actor.getRole() == com.sanpablo.contigo.domain.auth.UserRole.ROLE_CAREGIVER) {
            if (!caregiverId.equals(actor.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Un cuidador no puede revocar a otros cuidadores vinculados");
            }
        } else if (actor.getRole() != com.sanpablo.contigo.domain.auth.UserRole.ROLE_PATIENT &&
                   actor.getRole() != com.sanpablo.contigo.domain.auth.UserRole.ROLE_CLINIC_ADMIN &&
                   actor.getRole() != com.sanpablo.contigo.domain.auth.UserRole.ROLE_SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rol no autorizado para revocar vínculos");
        }

        PatientCaregiverLink link = linkRepository.findByPatientIdAndCaregiverId(patientId, caregiverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vínculo no encontrado"));

        if (!link.isActive()) {
            return;
        }

        link.setActive(false);
        link.setRevokedAt(Instant.now());
        linkRepository.save(link);

        // Immediately terminate real-time event streaming for caregiver on this patient
        eventPublishingService.disconnectUser(caregiverId, patientId);

        AuditLog audit = new AuditLog(
                UUID.randomUUID().toString(),
                patientId,
                actor.getId(),
                "LINK_REVOKED",
                "Vínculo revocado para el cuidador " + caregiverId
        );
        auditRepository.save(audit);

        eventPublishingService.publish(new DomainEventDto(
                UUID.randomUUID().toString(),
                "LINK_REVOKED",
                actor.getOrganizationId(),
                patientId,
                caregiverId,
                null
        ));
    }
}
