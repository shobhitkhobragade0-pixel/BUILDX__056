-- LIFELINK NAGPUR PostgreSQL Relational Schema
-- Coordinates, Capacities, Specialists, Fleets & Incidents

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL, -- CITIZEN, FAMILY, AMBULANCE, HOSPITAL, CONTROL_ROOM, ADMIN
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(80) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    trauma_level VARCHAR(20) NOT NULL, -- LEVEL_1, LEVEL_2, LEVEL_3, NONE
    emergency_status VARCHAR(30) NOT NULL DEFAULT 'ACCEPTING', -- ACCEPTING, LIMITED, NOT ACCEPTING
    source VARCHAR(100) NOT NULL DEFAULT 'NHM Nagpur Health Registry',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    data_status VARCHAR(50) NOT NULL DEFAULT 'DEMO / SIMULATED DATA',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospital_capacity (
    id VARCHAR(50) PRIMARY KEY,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    icu_beds_total INT NOT NULL DEFAULT 0,
    icu_beds_available INT NOT NULL DEFAULT 0,
    er_beds_total INT NOT NULL DEFAULT 0,
    er_beds_available INT NOT NULL DEFAULT 0,
    ventilator_available INT NOT NULL DEFAULT 0,
    source VARCHAR(100) NOT NULL DEFAULT 'Hospital Live Bed Management System',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospital_specialists (
    id VARCHAR(50) PRIMARY KEY,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    specialty VARCHAR(80) NOT NULL, -- Neurosurgeon, Orthopedic, Cardiologist, Trauma Specialist, General Surgeon, Anesthetist
    doctor_name VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, ON CALL, UNAVAILABLE
    contact VARCHAR(20),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ambulances (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_number VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'ALS', -- ALS, BLS, PATIENT_TRANSPORT
    base_station VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED, ON_THE_WAY, ARRIVED_AT_SCENE, PATIENT_PICKED_UP, EN_ROUTE_HOSPITAL, ARRIVED_AT_HOSPITAL, MAINTENANCE
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20) NOT NULL,
    current_incident_id VARCHAR(50),
    source VARCHAR(100) NOT NULL DEFAULT 'Nagpur 108 Emergency Dispatch CAD',
    data_status VARCHAR(50) NOT NULL DEFAULT 'DEMO / SIMULATED DATA',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_incidents (
    id VARCHAR(50) PRIMARY KEY,
    tracking_code VARCHAR(30) UNIQUE NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    patient_age INT NOT NULL,
    patient_gender VARCHAR(20) NOT NULL,
    emergency_type VARCHAR(60) NOT NULL,
    conscious_status VARCHAR(30) NOT NULL,
    symptoms TEXT[] NOT NULL DEFAULT '{}',
    symptom_notes TEXT,
    blood_group_needed VARCHAR(10),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    location_address TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'CRITICAL',
    status VARCHAR(40) NOT NULL DEFAULT 'REQUESTED',
    assigned_ambulance_id VARCHAR(50) REFERENCES ambulances(id),
    destination_hospital_id VARCHAR(50) REFERENCES hospitals(id),
    source VARCHAR(100) NOT NULL DEFAULT 'Citizen Emergency App SOS',
    data_status VARCHAR(50) NOT NULL DEFAULT 'DEMO / SIMULATED DATA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospital_confirmations (
    id VARCHAR(50) PRIMARY KEY,
    incident_id VARCHAR(50) REFERENCES emergency_incidents(id) ON DELETE CASCADE,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
    rejection_reason VARCHAR(60), -- NO_CAPACITY, SPECIALIST_UNAVAILABLE, RESOURCE_UNAVAILABLE, DIVERSION
    estimated_arrival_min INT,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS blood_banks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'e-Raktkosh Nagpur Registry',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    data_status VARCHAR(50) NOT NULL DEFAULT 'DEMO / SIMULATED DATA',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_inventory (
    id VARCHAR(50) PRIMARY KEY,
    blood_bank_id VARCHAR(50) REFERENCES blood_banks(id) ON DELETE CASCADE,
    blood_group VARCHAR(10) NOT NULL, -- A+, A-, B+, B-, AB+, AB-, O+, O-
    units_available INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, LOW, UNAVAILABLE, UNKNOWN
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
