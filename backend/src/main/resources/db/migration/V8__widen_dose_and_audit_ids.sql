-- V8__widen_dose_and_audit_ids.sql
ALTER TABLE telemetry.pill_intakes ALTER COLUMN id TYPE VARCHAR(100);
ALTER TABLE telemetry.intake_corrections ALTER COLUMN intake_id TYPE VARCHAR(100);
ALTER TABLE telemetry.stock_movements ALTER COLUMN intake_id TYPE VARCHAR(100);
ALTER TABLE reports_audit.idempotency_records ALTER COLUMN resource_id TYPE VARCHAR(100);

CREATE TABLE IF NOT EXISTS auth.revoked_tokens (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
