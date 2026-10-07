-- V4__create_telemetry_tables.sql

CREATE TABLE IF NOT EXISTS telemetry.pill_intakes (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    medication_id VARCHAR(36) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    image_url TEXT,
    scheduled_time VARCHAR(10) NOT NULL,
    scheduled_date VARCHAR(20) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL,
    instructions TEXT,
    version INT NOT NULL DEFAULT 1,
    prescription_version INT,
    units_per_dose NUMERIC(6,2),
    stock_unit VARCHAR(50),
    actor_id VARCHAR(36),
    recorded_via VARCHAR(50),
    reason TEXT
);

CREATE TABLE IF NOT EXISTS telemetry.intake_corrections (
    id VARCHAR(36) PRIMARY KEY,
    intake_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    corrected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry.stock_movements (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    medication_id VARCHAR(36) NOT NULL,
    quantity NUMERIC(8,2) NOT NULL,
    kind VARCHAR(50) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    intake_id VARCHAR(36)
);

CREATE TABLE IF NOT EXISTS telemetry.blood_pressure_logs (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    systolic INT NOT NULL,
    diastolic INT NOT NULL,
    pulse INT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(36) NOT NULL,
    recorded_via VARCHAR(50) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'HOME',
    status VARCHAR(50) NOT NULL DEFAULT 'UNCLASSIFIED',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS telemetry.weight_logs (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'HOME'
);

CREATE TABLE IF NOT EXISTS telemetry.alert_events (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    severity VARCHAR(50) NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    notification_status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(36)
);
