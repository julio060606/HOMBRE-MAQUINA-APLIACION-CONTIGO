package com.sanpablo.contigo.dto.events;

import java.time.Instant;

public class DomainEventDto {
    private String eventId;
    private String type;
    private String organizationId;
    private String patientId;
    private String resourceId;
    private int version = 1;
    private Instant occurredAt;
    private Object payload;

    public DomainEventDto() {}

    public DomainEventDto(String eventId, String type, String organizationId, String patientId, String resourceId, Object payload) {
        this.eventId = eventId;
        this.type = type;
        this.organizationId = organizationId;
        this.patientId = patientId;
        this.resourceId = resourceId;
        this.version = 1;
        this.occurredAt = Instant.now();
        this.payload = payload;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
