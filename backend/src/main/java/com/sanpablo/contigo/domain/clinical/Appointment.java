package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "appointments", schema = "clinical")
public class Appointment {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 36)
    private String patientId;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "external_id", nullable = false, length = 100)
    private String externalId;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(nullable = false, length = 100)
    private String specialty;

    @Column(nullable = false)
    private String doctor;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false, length = 50)
    private String status = "SCHEDULED"; // SCHEDULED | CANCELLED | COMPLETED

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(nullable = false, length = 50)
    private String source = "CLINIC";

    public Appointment() {}

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
