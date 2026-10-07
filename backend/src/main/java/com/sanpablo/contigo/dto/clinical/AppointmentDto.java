package com.sanpablo.contigo.dto.clinical;

import com.sanpablo.contigo.domain.clinical.Appointment;
import java.time.Instant;

public class AppointmentDto {
    private String id;
    private String patientId;
    private String organizationId;
    private String externalId;
    private Instant startsAt;
    private String specialty;
    private String doctor;
    private String location;
    private String status;
    private String instructions;
    private String source;

    public AppointmentDto() {}

    public AppointmentDto(Appointment appointment) {
        this.id = appointment.getId();
        this.patientId = appointment.getPatientId();
        this.organizationId = appointment.getOrganizationId();
        this.externalId = appointment.getExternalId();
        this.startsAt = appointment.getStartsAt();
        this.specialty = appointment.getSpecialty();
        this.doctor = appointment.getDoctor();
        this.location = appointment.getLocation();
        this.status = appointment.getStatus();
        this.instructions = appointment.getInstructions();
        this.source = appointment.getSource();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getDoctor() { return doctor; }
    public void setDoctor(String doctor) { this.doctor = doctor; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
