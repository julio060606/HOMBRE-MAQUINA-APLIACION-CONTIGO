package com.sanpablo.contigo.domain.telemetry;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "idempotency_records", schema = "reports_audit")
public class IdempotencyRecord {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "operation_key", nullable = false, unique = true, length = 255)
    private String operationKey;

    @Column(nullable = false, length = 500)
    private String fingerprint;

    @Column(name = "resource_id", nullable = false, length = 100)
    private String resourceId;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public IdempotencyRecord() {}

    public IdempotencyRecord(String id, String operationKey, String fingerprint, String resourceId, String responseBody) {
        this.id = id;
        this.operationKey = operationKey;
        this.fingerprint = fingerprint;
        this.resourceId = resourceId;
        this.responseBody = responseBody;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOperationKey() { return operationKey; }
    public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    public String getFingerprint() { return fingerprint; }
    public void setFingerprint(String fingerprint) { this.fingerprint = fingerprint; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getResponseBody() { return responseBody; }
    public void setResponseBody(String responseBody) { this.responseBody = responseBody; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
