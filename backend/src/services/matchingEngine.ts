import { db } from '../config/database.js';
import { HospitalMatchResult } from '../types/index.js';

interface MatchCriteria {
  patientLatitude: number;
  patientLongitude: number;
  emergencyType: string;
  requiredSpecialists?: string[]; // e.g. ['Neurosurgeon', 'Orthopedic']
  requireICU?: boolean;
  requireTraumaCenter?: boolean;
  bloodGroupNeeded?: string;
  maxDistanceKm?: number;
}

// Haversine formula to compute great-circle distance between two points in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Estimate city ambulance ETA in minutes
export function calculateEtaMinutes(distanceKm: number): number {
  // Emergency vehicle speed average in Nagpur urban corridor ~ 38 km/h + 2 min buffer
  const minutes = Math.round((distanceKm / 38) * 60 + 2);
  return Math.max(3, minutes);
}

export async function matchHospitals(criteria: MatchCriteria): Promise<HospitalMatchResult[]> {
  const allHospitals = await db.getAllHospitals();
  const allBloodBanks = await db.getAllBloodBanks();

  const results: HospitalMatchResult[] = [];

  for (const hospital of allHospitals) {
    const capacity = await db.getHospitalCapacity(hospital.id) || {
      id: `cap-${hospital.id}`,
      hospital_id: hospital.id,
      icu_beds_total: 0,
      icu_beds_available: 0,
      er_beds_total: 0,
      er_beds_available: 0,
      ventilator_available: 0,
      updated_at: new Date().toISOString(),
      source: 'Default',
      verification_status: 'UNVERIFIED'
    };

    const specialists = await db.getHospitalSpecialists(hospital.id);
    const distanceKm = calculateDistanceKm(
      criteria.patientLatitude,
      criteria.patientLongitude,
      hospital.latitude,
      hospital.longitude
    );
    const etaMinutes = calculateEtaMinutes(distanceKm);

    // Check ICU
    const icuAvailable = capacity.icu_beds_available > 0;
    const erBedsAvailable = capacity.er_beds_available > 0;

    // Check Specialists
    const reqSpecialists = criteria.requiredSpecialists || [];
    const matchedSpecialists: string[] = [];
    const missingSpecialists: string[] = [];

    for (const reqSpec of reqSpecialists) {
      const found = specialists.find(
        s => s.specialty.toLowerCase() === reqSpec.toLowerCase() &&
             (s.status === 'AVAILABLE' || s.status === 'ON CALL')
      );
      if (found) {
        matchedSpecialists.push(`${found.specialty} (${found.doctor_name}, ${found.status})`);
      } else {
        missingSpecialists.push(reqSpec);
      }
    }

    const specialistsMatch = missingSpecialists.length === 0;

    // Check Trauma Capability
    let traumaCapable = true;
    if (criteria.requireTraumaCenter) {
      traumaCapable = hospital.trauma_level === 'LEVEL_1' || hospital.trauma_level === 'LEVEL_2';
    }

    // Check Blood requirement
    let bloodAvailable = true;
    let bloodStatusText = 'Not required';
    if (criteria.bloodGroupNeeded && criteria.bloodGroupNeeded !== 'UNKNOWN') {
      // Find matching units in nearby blood banks (within 8km) or hospital's own inventory
      let totalUnits = 0;
      for (const bank of allBloodBanks) {
        const bDist = calculateDistanceKm(hospital.latitude, hospital.longitude, bank.latitude, bank.longitude);
        if (bDist <= 8 && bank.inventory) {
          const inv = bank.inventory.find(i => i.blood_group.toUpperCase() === criteria.bloodGroupNeeded?.toUpperCase());
          if (inv) totalUnits += inv.units_available;
        }
      }
      bloodAvailable = totalUnits > 0;
      bloodStatusText = bloodAvailable ? `${totalUnits} units in local network` : 'Critical Shortage';
    }

    // Emergency Status
    const emergencyAccepting = hospital.emergency_status !== 'NOT ACCEPTING';

    // Suitability Evaluation
    const reasons: string[] = [];
    const rejectionReasons: string[] = [];

    // Evaluate reasons
    if (icuAvailable) {
      reasons.push(`ICU Available (${capacity.icu_beds_available} beds free)`);
    } else if (criteria.requireICU) {
      rejectionReasons.push(`No ICU beds available (0/${capacity.icu_beds_total} free)`);
    }

    if (erBedsAvailable) {
      reasons.push(`Emergency department beds ready (${capacity.er_beds_available} beds free)`);
    } else {
      rejectionReasons.push(`Emergency trauma beds fully occupied`);
    }

    if (matchedSpecialists.length > 0) {
      matchedSpecialists.forEach(spec => reasons.push(`Specialist on duty: ${spec}`));
    }
    if (missingSpecialists.length > 0) {
      missingSpecialists.forEach(spec => rejectionReasons.push(`Critical specialist unavailable: ${spec}`));
    }

    if (traumaCapable && criteria.requireTraumaCenter) {
      reasons.push(`Designated ${hospital.trauma_level.replace('_', ' ')} Trauma Facility`);
    } else if (!traumaCapable && criteria.requireTraumaCenter) {
      rejectionReasons.push(`No recognized Trauma Center capability (${hospital.trauma_level})`);
    }

    if (criteria.bloodGroupNeeded && criteria.bloodGroupNeeded !== 'UNKNOWN') {
      if (bloodAvailable) {
        reasons.push(`${criteria.bloodGroupNeeded} blood support verified (${bloodStatusText})`);
      } else {
        rejectionReasons.push(`No immediate ${criteria.bloodGroupNeeded} blood reserve available`);
      }
    }

    if (emergencyAccepting) {
      reasons.push(`Hospital status: ${hospital.emergency_status}`);
    } else {
      rejectionReasons.push(`Hospital emergency department is NOT ACCEPTING incoming ambulances`);
    }

    reasons.push(`ETA: ${etaMinutes} mins (${distanceKm} km away)`);

    // Strict suitability decision
    const isSuitable = 
      (!criteria.requireICU || icuAvailable) &&
      erBedsAvailable &&
      specialistsMatch &&
      traumaCapable &&
      bloodAvailable &&
      emergencyAccepting;

    // Scoring for ranking: Lower score is better (ETA prioritized among fully suitable)
    let score = etaMinutes;
    if (!isSuitable) score += 1000;
    if (hospital.trauma_level === 'LEVEL_1') score -= 2;
    if (capacity.icu_beds_available > 5) score -= 1;

    results.push({
      hospital: {
        ...hospital,
        distance_km: distanceKm,
        eta_minutes: etaMinutes
      },
      capacity,
      specialists,
      blood_inventory: [],
      is_suitable: isSuitable,
      score,
      criteria_checks: {
        icu_available: icuAvailable,
        icu_count: capacity.icu_beds_available,
        er_beds_available: erBedsAvailable,
        er_count: capacity.er_beds_available,
        required_specialists_available: specialistsMatch,
        matched_specialists: matchedSpecialists,
        missing_specialists: missingSpecialists,
        trauma_capable: traumaCapable,
        blood_available: bloodAvailable,
        blood_status_text: bloodStatusText,
        emergency_accepting: emergencyAccepting,
        distance_km: distanceKm,
        eta_minutes: etaMinutes
      },
      reasons,
      rejection_reasons: rejectionReasons
    });
  }

  // Sort: Suitable first, then by lowest score (lowest ETA & best capabilities)
  return results.sort((a, b) => a.score - b.score);
}
