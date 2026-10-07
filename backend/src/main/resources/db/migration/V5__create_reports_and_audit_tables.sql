-- V5__create_reports_and_audit_tables.sql

CREATE TABLE IF NOT EXISTS reports_audit.audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36),
    actor_id VARCHAR(36) NOT NULL,
    kind VARCHAR(100) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detail TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports_audit.idempotency_records (
    id VARCHAR(36) PRIMARY KEY,
    operation_key VARCHAR(255) NOT NULL UNIQUE,
    fingerprint VARCHAR(500) NOT NULL,
    resource_id VARCHAR(36) NOT NULL,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
