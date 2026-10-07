-- V3__create_clinical_tables.sql

CREATE TABLE IF NOT EXISTS clinical.organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    time_zone VARCHAR(50) NOT NULL DEFAULT 'America/Lima',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical.patients (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    external_patient_id VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    emergency_phone VARCHAR(50) NOT NULL,
    medical_notes TEXT,
    relationship VARCHAR(100) NOT NULL DEFAULT 'Titular',
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    easy_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    voice_guide_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical.clinical_profiles (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL UNIQUE,
    organization_id VARCHAR(36) NOT NULL,
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'CLINIC',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS clinical.clinical_settings (
    patient_id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    notify_missed_dose_minutes INT NOT NULL DEFAULT 30,
    voice_volume_level NUMERIC(5,2) NOT NULL DEFAULT 80,
    repeat_alarm_count INT NOT NULL DEFAULT 3,
    voice_guide_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    easy_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    large_text BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical.clinical_thresholds (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    min_value NUMERIC(6,2),
    max_value NUMERIC(6,2),
    unit VARCHAR(20),
    source VARCHAR(50) DEFAULT 'CLINIC',
    version INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS clinical.medications (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    external_prescription_id VARCHAR(100) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    form_factor VARCHAR(50) NOT NULL,
    image_url TEXT,
    times VARCHAR(500) NOT NULL,
    frequency_type VARCHAR(50) NOT NULL,
    specific_days VARCHAR(100),
    duration_days INT,
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50),
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(50) NOT NULL DEFAULT 'CLINIC',
    synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    units_per_dose NUMERIC(6,2),
    stock_unit VARCHAR(50),
    effective_from VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS clinical.appointments (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    external_id VARCHAR(100) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    doctor VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    instructions TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'CLINIC'
);

CREATE TABLE IF NOT EXISTS clinical.clinical_sync_state (
    patient_id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    last_successful_sync_at TIMESTAMP WITH TIME ZONE,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'SYNCED',
    details TEXT
);
