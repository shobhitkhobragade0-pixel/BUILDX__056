import {
  EmergencyIncident, Hospital, Ambulance, BloodBank,
  HospitalMatchResult, EmergencyTimelineStep
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

// Emergency APIs
export async function createEmergency(data: Partial<EmergencyIncident>) {
  const res = await fetch(`${API_BASE}/api/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create emergency request');
  return res.json();
}

export async function getEmergency(id: string) {
  const res = await fetch(`${API_BASE}/api/emergency/${id}`);
  if (!res.ok) throw new Error('Failed to fetch emergency details');
  return res.json();
}

export async function trackEmergency(code: string) {
  const res = await fetch(`${API_BASE}/api/emergency/track/${encodeURIComponent(code)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Emergency record not found' }));
    throw new Error(err.error || 'Emergency not found');
  }
  return res.json();
}

export async function getAllEmergencies(): Promise<EmergencyIncident[]> {
  const res = await fetch(`${API_BASE}/api/emergency`);
  return res.json();
}

export async function assignAmbulance(incidentId: string, ambulanceId: string) {
  const res = await fetch(`${API_BASE}/api/emergency/${incidentId}/ambulance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ambulanceId })
  });
  return res.json();
}

export async function updateIncidentStatus(incidentId: string, status: string, note?: string) {
  const res = await fetch(`${API_BASE}/api/emergency/${incidentId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note })
  });
  return res.json();
}

export async function requestAITriage(symptoms: string, emergencyType?: string, consciousStatus?: string) {
  const res = await fetch(`${API_BASE}/api/emergency/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms, emergencyType, consciousStatus })
  });
  return res.json();
}

// Hospital APIs
export async function getHospitals(): Promise<Hospital[]> {
  const res = await fetch(`${API_BASE}/api/hospitals`);
  return res.json();
}

export async function matchHospitalsAPI(params: {
  patientLatitude: number;
  patientLongitude: number;
  emergencyType: string;
  requiredSpecialists?: string[];
  requireICU?: boolean;
  requireTraumaCenter?: boolean;
  bloodGroupNeeded?: string;
}): Promise<{ totalEvaluated: number; suitableCount: number; unsuitableCount: number; matches: HospitalMatchResult[] }> {
  const res = await fetch(`${API_BASE}/api/hospitals/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function requestHospitalConfirmation(hospitalId: string, incidentId: string, estimatedArrivalMin: number) {
  const res = await fetch(`${API_BASE}/api/hospitals/${hospitalId}/request-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidentId, estimatedArrivalMin })
  });
  return res.json();
}

export async function confirmHospitalDispatch(hospitalId: string, incidentId: string, status: 'ACCEPTED' | 'REJECTED', rejectionReason?: string) {
  const res = await fetch(`${API_BASE}/api/hospitals/${hospitalId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidentId, status, rejectionReason })
  });
  return res.json();
}

export async function updateHospitalCapacityAPI(hospitalId: string, data: { icu_beds_available: number; er_beds_available: number }) {
  const res = await fetch(`${API_BASE}/api/hospitals/${hospitalId}/capacity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateSpecialistAPI(hospitalId: string, specialistId: string, status: 'AVAILABLE' | 'ON CALL' | 'UNAVAILABLE') {
  const res = await fetch(`${API_BASE}/api/hospitals/${hospitalId}/specialist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ specialistId, status })
  });
  return res.json();
}

export async function updateHospitalStatusAPI(hospitalId: string, status: 'ACCEPTING' | 'LIMITED' | 'NOT ACCEPTING') {
  const res = await fetch(`${API_BASE}/api/hospitals/${hospitalId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

// Ambulance APIs
export async function getAmbulances(): Promise<Ambulance[]> {
  const res = await fetch(`${API_BASE}/api/ambulances`);
  return res.json();
}

export async function updateAmbulanceStatusAPI(ambulanceId: string, status: string, incidentId?: string) {
  const res = await fetch(`${API_BASE}/api/ambulances/${ambulanceId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, incidentId })
  });
  return res.json();
}

// Blood Bank APIs
export async function getBloodBanks(group?: string, lat?: number, lng?: number): Promise<BloodBank[]> {
  const params = new URLSearchParams();
  if (group) params.append('blood_group', group);
  if (lat) params.append('latitude', String(lat));
  if (lng) params.append('longitude', String(lng));
  const res = await fetch(`${API_BASE}/api/blood-banks?${params.toString()}`);
  return res.json();
}

export async function reserveBloodUnits(bloodBankId: string, bloodGroup: string, units: number, incidentId?: string) {
  const res = await fetch(`${API_BASE}/api/blood-banks/${bloodBankId}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bloodGroup, units, incidentId })
  });
  return res.json();
}

// Rohan Demo APIs
export async function initRohanDemo() {
  const res = await fetch(`${API_BASE}/api/demo/rohan/init`, { method: 'POST' });
  return res.json();
}

export async function triggerRohanStep(step: number) {
  const res = await fetch(`${API_BASE}/api/demo/rohan/step/${step}`, { method: 'POST' });
  return res.json();
}
