package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.clinical.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findByPatientIdOrderByStartsAtAsc(String patientId);
    Optional<Appointment> findByPatientIdAndExternalId(String patientId, String externalId);
}
