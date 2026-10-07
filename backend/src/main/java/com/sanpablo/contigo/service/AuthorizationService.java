package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.auth.UserRole;
import com.sanpablo.contigo.domain.clinical.Patient;
import com.sanpablo.contigo.repository.PatientCaregiverLinkRepository;
import com.sanpablo.contigo.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthorizationService {

    private final PatientRepository patientRepository;
    private final PatientCaregiverLinkRepository linkRepository;

    public AuthorizationService(PatientRepository patientRepository, PatientCaregiverLinkRepository linkRepository) {
        this.patientRepository = patientRepository;
        this.linkRepository = linkRepository;
    }

    public Patient authorizePatientAccess(User actor, String patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));

        if (actor.getRole() == UserRole.ROLE_SUPER_ADMIN) {
            return patient;
        }

        // Multi-tenant check: Actor and patient must belong to the same organization
        if (!actor.getOrganizationId().equals(patient.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: fuera de la organización permitida");
        }

        if (actor.getRole() == UserRole.ROLE_CLINIC_ADMIN) {
            return patient;
        }

        if (actor.getRole() == UserRole.ROLE_PATIENT) {
            if (actor.getPatientId() != null && actor.getPatientId().equals(patientId)) {
                return patient;
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado a datos de otro paciente");
        }

        if (actor.getRole() == UserRole.ROLE_CAREGIVER) {
            boolean isLinked = linkRepository.existsByPatientIdAndCaregiverIdAndActiveTrue(patientId, actor.getId());
            if (isLinked) {
                return patient;
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado: no existe vínculo activo con este paciente");
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rol no autorizado");
    }

    public Patient authorizePatientWrite(User actor, String patientId) {
        Patient patient = authorizePatientAccess(actor, patientId);

        if (actor.getRole() != UserRole.ROLE_PATIENT || !patientId.equals(actor.getPatientId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Operación restringida: Solo el paciente puede registrar sus tomas, mediciones y alertas SOS");
        }

        return patient;
    }

    public Patient authorizeCaregiverRestock(User actor, String patientId) {
        Patient patient = authorizePatientAccess(actor, patientId);

        if (actor.getRole() != UserRole.ROLE_CAREGIVER && actor.getRole() != UserRole.ROLE_CLINIC_ADMIN && actor.getRole() != UserRole.ROLE_SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Operación restringida: Solo el cuidador vinculado o personal administrativo puede registrar existencias");
        }

        return patient;
    }
}
