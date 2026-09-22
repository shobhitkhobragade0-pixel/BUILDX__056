import { Router } from 'express';
import { db } from '../config/database.js';
import { EmergencyIncident } from '../types/index.js';

export function createDemoRouter(io: any) {
  const router = Router();

  // Reset or Initialize Rohan Emergency Incident
  router.post('/init', async (req, res) => {
    try {
      const rohanId = 'rohan-accident-khapri-2026';
      const trackingCode = 'ROHAN-NAG-2026';

      // Clean up previous run if any
      const existing = await db.getIncidentById(rohanId);
      if (existing) {
        // Reset ambulance location
        await db.updateAmbulanceLocation('amb-als-101', 21.0530, 79.0510);
        await db.updateAmbulanceStatus('amb-als-101', 'AVAILABLE', null);
      }

      const rohanIncident: EmergencyIncident = {
        id: rohanId,
        tracking_code: trackingCode,
        patient_name: 'Rohan (Accident Victim)',
        patient_age: 27,
        patient_gender: 'Male',
        emergency_type: 'Road Accident',
        conscious_status: 'Unconscious',
        symptoms: ['Severe Head Injury', 'Compound Fractured Femur', 'Heavy Arterial Bleeding'],
        symptom_notes: '11:20 PM - High-speed collision on Wardha Road near Khapri Flyover. Patient unconscious, unresponsive, bleeding heavily from head and left thigh.',
        blood_group_needed: 'O-',
        latitude: 21.0505,
        longitude: 79.0531,
        location_address: 'Wardha Road near Khapri Toll / Metro Pillar 38, Nagpur',
        priority: 'CRITICAL',
        status: 'REQUESTED',
        assigned_ambulance_id: null,
        destination_hospital_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'Automated Crash SOS / 108 Emergency Sensor',
        data_status: 'DEMO / SIMULATED DATA'
      };

      await db.createIncident(rohanIncident);

      // Pre-seed the initial timeline
      await db.addTimelineStep({
        incident_id: rohanId,
        step_number: 1,
        title: 'Crash Detected: Wardha Road / Khapri (11:20 PM)',
        description: 'Severe accident detected. Rohan (27M) unconscious with head trauma, fractured femur, and arterial hemorrhage.',
        badge: 'CRITICAL ALERT',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      io.emit('demo:rohan:step', { step: 1, incident: rohanIncident });
      io.emit('emergency:new', rohanIncident);

      res.json({
        success: true,
        incident: rohanIncident,
        trackingCode,
        message: 'Rohan Emergency Demo initialized.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Execute a specific step in the 12-step scenario
  router.post('/step/:stepNumber', async (req, res) => {
    try {
      const step = Number(req.params.stepNumber);
      const incidentId = 'rohan-accident-khapri-2026';
      let incident = await db.getIncidentById(incidentId);

      if (!incident) {
        return res.status(404).json({ error: 'Rohan demo incident not initialized. Please call /api/demo/rohan/init first.' });
      }

      const ambulanceId = 'amb-als-101'; // ALS ambulance stationed at Khapri Toll Plaza

      switch (step) {
        case 2: // Ambulance requested
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 2,
            title: 'Nearest Advanced Life Support (ALS) Ambulance Requested',
            description: 'Khapri base station alerted for immediate ALS dispatch with ventilator and spine board.',
            badge: 'AMBULANCE REQUESTED',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          incident = await db.updateIncident(incidentId, { status: 'REQUESTED' });
          break;

        case 3: // Ambulance assigned
          await db.updateIncident(incidentId, { assigned_ambulance_id: ambulanceId, status: 'AMBULANCE_ASSIGNED' });
          await db.updateAmbulanceStatus(ambulanceId, 'ASSIGNED', incidentId);
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 3,
            title: 'ALS Ambulance MH-31-EM-1081 Assigned',
            description: 'Driver Sachin Patil dispatched from Khapri Toll Post. GPS ETA: 3 minutes to crash site.',
            badge: 'AMBULANCE ASSIGNED',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 4: // Hospitals evaluated
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 4,
            title: 'Resource-Aware Hospital Matching Engine Triggered',
            description: 'Scanning 7 Nagpur hospitals for: Level 1 Trauma + ICU bed + Neurosurgeon on-duty + Orthopedic surgeon + O-negative blood reserves.',
            badge: 'SCANNING RESOURCES',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 5: // Hospital without required resources rejected
          // Wardha Road Clinic (closest, 7 km) rejected because ICU is 0 and no neurosurgeon!
          // CARE Hospital (10.8 km) rejected because Neurosurgeon is unavailable tonight!
          await db.updateConfirmation(incidentId, 'hosp-criticare-wardha', 'REJECTED', 'NO_CAPACITY');
          await db.updateConfirmation(incidentId, 'hosp-care', 'REJECTED', 'SPECIALIST_UNAVAILABLE');
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 5,
            title: 'Nearest Clinic Rejected: Zero ICU & No Night Neurosurgeon',
            description: 'Criticare Wardha Rd rejected (ICU Full 0/6, No Neurosurgeon). CARE Hospital rejected (No Neurosurgeon on duty tonight). Transfer delay prevented!',
            badge: 'TRANSFER DELAY AVOIDED',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 6: // Suitable hospital identified (AIIMS Nagpur MIHAN)
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 6,
            title: 'Optimal Match Identified: AIIMS Nagpur (MIHAN)',
            description: 'Match Confirmed: Level 1 Trauma Center, 8 ICU beds free, Neurosurgeon Dr. Milind Rao AVAILABLE, Ortho Dr. Sunil Patil AVAILABLE, O-negative 8 units ready (ETA 8 mins).',
            badge: 'SUITABLE MATCH',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 7: // Hospital confirmation requested
          await db.createConfirmation({
            id: `conf-rohan-aiims-${Date.now()}`,
            incident_id: incidentId,
            hospital_id: 'hosp-aiims',
            status: 'PENDING',
            estimated_arrival_min: 8
          });
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 7,
            title: 'Pre-Admission Confirmation Sent to AIIMS Trauma Bay',
            description: 'Digital pre-arrival alert transmitted to AIIMS Nagpur Emergency Registrar with patient vitals and CT requirements.',
            badge: 'CONFIRMATION PENDING',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 8: // Hospital accepts
          await db.updateConfirmation(incidentId, 'hosp-aiims', 'ACCEPTED');
          incident = await db.updateIncident(incidentId, {
            destination_hospital_id: 'hosp-aiims',
            status: 'HOSPITAL_CONFIRMED'
          });
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 8,
            title: 'AIIMS Nagpur ACCEPTS — Red Trauma Bay Prepared',
            description: 'Registrar accepted. Trauma Team activated, CT scanner prepped, 2 units O-negative blood reserved at AIIMS Blood Bank.',
            badge: 'CONFIRMED BY HOSPITAL',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 9: // Ambulance destination updated
          await db.updateIncident(incidentId, { status: 'EN_ROUTE_HOSPITAL' });
          await db.updateAmbulanceStatus(ambulanceId, 'EN_ROUTE_HOSPITAL', incidentId);
          await db.updateAmbulanceLocation(ambulanceId, 21.0560, 79.0400); // moving toward MIHAN
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 9,
            title: 'Ambulance HUD & Navigation Locked to AIIMS Nagpur',
            description: 'Driver route updated via MIHAN flyover. Real-time green corridor traffic signal coordination activated.',
            badge: 'DESTINATION LOCKED',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 10: // Family tracking activated
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 10,
            title: 'Family Tracking Portal Online (Code: ROHAN-NAG-2026)',
            description: 'Rohan’s family received encrypted tracking link with live ambulance GPS, destination hospital, and specialist readiness.',
            badge: 'FAMILY NOTIFIED',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 11: // Hospital pre-alert generated
          await db.updateAmbulanceLocation(ambulanceId, 21.0590, 79.0310);
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 11,
            title: 'Hospital Pre-Alert: Ambulance 2 Minutes Away',
            description: 'Siren telemetry indicates vehicle crossing MIHAN Gate 1. Trauma resuscitation team scrubbing in.',
            badge: 'PRE-ALERT ACTIVE',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;

        case 12: // Patient arrives
          await db.updateIncident(incidentId, { status: 'ARRIVED_AT_HOSPITAL' });
          await db.updateAmbulanceStatus(ambulanceId, 'ARRIVED_AT_HOSPITAL', incidentId);
          await db.updateAmbulanceLocation(ambulanceId, 21.0601, 79.0275); // AIIMS coordinates
          await db.addTimelineStep({
            incident_id: incidentId,
            step_number: 12,
            title: 'Patient Handed Over at AIIMS Trauma Center (Zero Delay)',
            description: 'Rohan admitted directly to Resuscitation Bay 1. Neurosurgeon & Orthopedic teams standing by. Total transit: 11 minutes.',
            badge: 'SUCCESSFUL HANDOVER',
            status: 'completed',
            timestamp: new Date().toISOString()
          });
          break;
      }

      const updatedIncident = await db.getIncidentById(incidentId);
      const timeline = await db.getTimeline(incidentId);

      io.emit('demo:rohan:step', { step, incident: updatedIncident, timeline });
      io.emit('emergency:updated', updatedIncident);

      res.json({
        success: true,
        step,
        incident: updatedIncident,
        timeline
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
