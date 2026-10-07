package com.sanpablo.contigo.service.clinical;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface ClinicalProvider {

    record PrescriptionData(
            String externalPrescriptionId,
            int version,
            String name,
            String dosage,
            String formFactor,
            List<String> times,
            String frequencyType,
            String startDate,
            String endDate,
            String instructions,
            boolean isActive,
            BigDecimal unitsPerDose,
            String stockUnit
    ) {}

    record AppointmentData(
            String externalId,
            Instant startsAt,
            String specialty,
            String doctor,
            String location,
            String status,
            String instructions
    ) {}

    record ProfileData(
            BigDecimal heightCm,
            BigDecimal weightKg,
            Instant measuredAt,
            String notes
    ) {}

    List<PrescriptionData> fetchPrescriptions(String externalPatientId);
    List<AppointmentData> fetchAppointments(String externalPatientId);
    ProfileData fetchProfile(String externalPatientId);
    boolean isLiveConnection();
}
