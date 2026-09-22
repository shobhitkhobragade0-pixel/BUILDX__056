export type UserRole = 'CITIZEN' | 'FAMILY' | 'AMBULANCE' | 'HOSPITAL' | 'CONTROL_ROOM' | 'ADMIN';

export type DataStatus = 'LIVE' | 'VERIFIED' | 'DEMO / SIMULATED DATA' | 'DATA UNAVAILABLE' | 'LAST UPDATED';

export type VerificationStatus = 'VERIFIED' | 'SELF_REPORTED' | 'UNVERIFIED' | 'PENDING';

export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type HospitalEmergencyStatus = 'ACCEPTING' | 'LIMITED' | 'NOT ACCEPTING';

export type SpecialistStatus = 'AVAILABLE' | 'ON CALL' | 'UNAVAILABLE';

export type BloodStatus = 'AVAILABLE' | 'LOW' | 'UNAVAILABLE' | 'UNKNOWN';

export type AmbulanceStatus = 
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'ARRIVED_AT_SCENE'
  | 'PATIENT_PICKED_UP'
  | 'EN_ROUTE_HOSPITAL'
  | 'ARRIVED_AT_HOSPITAL'
  | 'MAINTENANCE';

export type EmergencyIncidentStatus =
  | 'REQUESTED'
  | 'AMBULANCE_ASSIGNED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'PATIENT_PICKED_UP'
  | 'HOSPITAL_CONFIRMED'
  | 'EN_ROUTE_HOSPITAL'
  | 'ARRIVED_AT_HOSPITAL'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Hospital {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  trauma_level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'NONE';
  emergency_status: HospitalEmergencyStatus;
  distance_km?: number;
  eta_minutes?: number;
  source: string;
  verification_status: VerificationStatus;
  data_status: DataStatus;
  updated_at: string;
  capacity?: HospitalCapacity;
  specialists?: HospitalSpecialist[];
}

export interface HospitalCapacity {
  id: string;
  hospital_id: string;
  icu_beds_total: number;
  icu_beds_available: number;
  er_beds_total: number;
  er_beds_available: number;
  ventilator_available: number;
  updated_at: string;
  source: string;
  verification_status: VerificationStatus;
}

export interface HospitalSpecialist {
  id: string;
  hospital_id: string;
  specialty: string;
  doctor_name: string;
  status: SpecialistStatus;
  contact?: string;
  updated_at: string;
}

export interface BloodInventoryItem {
  id: string;
  blood_bank_id: string;
  blood_group: string;
  units_available: number;
  status: BloodStatus;
  last_verified_at: string;
}

export interface BloodBank {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  source: string;
  verification_status: VerificationStatus;
  data_status: DataStatus;
  updated_at: string;
  distance_km?: number;
  inventory?: BloodInventoryItem[];
}

export interface Ambulance {
  id: string;
  vehicle_number: string;
  type: 'ALS' | 'BLS' | 'PATIENT_TRANSPORT';
  base_station: string;
  latitude: number;
  longitude: number;
  status: AmbulanceStatus;
  driver_name: string;
  driver_phone: string;
  current_incident_id?: string | null;
  updated_at: string;
  source: string;
  data_status: DataStatus;
}

export interface EmergencyIncident {
  id: string;
  tracking_code: string;
  patient_name: string;
  patient_age: number;
  patient_gender: 'Male' | 'Female' | 'Other';
  emergency_type: string;
  conscious_status: 'Conscious' | 'Unconscious' | 'Fluctuating';
  symptoms: string[];
  symptom_notes?: string;
  blood_group_needed?: string;
  latitude: number;
  longitude: number;
  location_address: string;
  priority: EmergencyPriority;
  status: EmergencyIncidentStatus;
  assigned_ambulance_id?: string | null;
  destination_hospital_id?: string | null;
  created_at: string;
  updated_at: string;
  source: string;
  data_status: DataStatus;
}

export interface HospitalConfirmation {
  id: string;
  incident_id: string;
  hospital_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejection_reason?: 'NO_CAPACITY' | 'SPECIALIST_UNAVAILABLE' | 'RESOURCE_UNAVAILABLE' | 'DIVERSION' | null;
  estimated_arrival_min?: number;
  responded_at?: string;
}

export interface EmergencyTimelineStep {
  _id?: string;
  incident_id: string;
  step_number: number;
  title: string;
  description: string;
  badge: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp: string;
}

export interface HospitalMatchResult {
  hospital: Hospital;
  capacity: HospitalCapacity;
  specialists: HospitalSpecialist[];
  blood_inventory: BloodInventoryItem[];
  is_suitable: boolean;
  score: number;
  criteria_checks: {
    icu_available: boolean;
    icu_count: number;
    er_beds_available: boolean;
    er_count: number;
    required_specialists_available: boolean;
    matched_specialists: string[];
    missing_specialists: string[];
    trauma_capable: boolean;
    blood_available: boolean;
    blood_status_text: string;
    emergency_accepting: boolean;
    distance_km: number;
    eta_minutes: number;
  };
  reasons: string[];
  rejection_reasons: string[];
}
