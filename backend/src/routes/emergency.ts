import { Router } from 'express';
import { db } from '../config/database.js';
import { triageSymptoms } from '../services/aiTriage.js';
import { EmergencyIncident, EmergencyPriority } from '../types/index.js';

export function createEmergencyRouter(io: any) {
  const router = Router();

  // AI Triage helper endpoint
  router.post('/triage', async (req, res) => {
    try {
      const { symptoms, emergencyType, consciousStatus } = req.body;
      const triage = await triageSymptoms(symptoms || '', emergencyType, consciousStatus);
      res.json(triage);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create Emergency SOS Incident
  router.post('/', async (req, res) => {
    try {
      const {
        patient_name,
        patient_age,
        patient_gender,
        emergency_type,
        conscious_status,
        symptoms,
        symptom_notes,
        blood_group_needed,
        latitude,
        longitude,
        location_address
      } = req.body;

      const incidentId = `emg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const trackingCode = `EMG-NAG-${randomCode}`;

      // Run AI triage for automated priority assessment
      const triage = await triageSymptoms(
        `${symptoms?.join(', ') || ''} ${symptom_notes || ''}`,
        emergency_type,
        conscious_status
      );

      const incident: EmergencyIncident = {
        id: incidentId,
        tracking_code: trackingCode,
        patient_name: patient_name || 'Unidentified Patient',
        patient_age: Number(patient_age) || 30,
        patient_gender: patient_gender || 'Other',
        emergency_type: emergency_type || 'Road Accident',
        conscious_status: conscious_status || 'Conscious',
        symptoms: Array.isArray(symptoms) ? symptoms : [symptoms || 'General Trauma'],
        symptom_notes: symptom_notes || '',
        blood_group_needed: blood_group_needed || undefined,
        latitude: Number(latitude) || 21.0505, // Default near Khapri / Wardha Rd
        longitude: Number(longitude) || 79.0531,
        location_address: location_address || 'Wardha Road near Khapri, Nagpur',
        priority: triage.priority,
        status: 'REQUESTED',
        assigned_ambulance_id: null,
        destination_hospital_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'Citizen Emergency SOS Portal',
        data_status: 'DEMO / SIMULATED DATA'
      };

      const created = await db.createIncident(incident);

      // Notify Control Room & Ambulances via Socket.IO
      io.emit('emergency:new', created);
      io.emit('notification:new', {
        title: `CRITICAL ALERT: ${created.emergency_type}`,
        message: `${created.patient_name} at ${created.location_address}`,
        priority: created.priority,
        timestamp: created.created_at
      });

      res.status(201).json({
        incident: created,
        triage,
        tracking_code: created.tracking_code,
        message: 'Emergency request received. Dispatched to Nagpur Coordination Network.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all incidents
  router.get('/', async (req, res) => {
    try {
      const incidents = await db.getAllIncidents();
      res.json(incidents);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Track incident by tracking code (e.g. EMG-NAG-1234)
  router.get('/track/:code', async (req, res) => {
    try {
      const code = req.params.code;
      const incident = await db.getIncidentByTrackingCode(code);
      if (!incident) {
        return res.status(404).json({ error: `No emergency found with tracking code: ${code}` });
      }

      const timeline = await db.getTimeline(incident.id);
      const ambulance = incident.assigned_ambulance_id ? await db.getAmbulanceById(incident.assigned_ambulance_id) : null;
      const hospital = incident.destination_hospital_id ? await db.getHospitalById(incident.destination_hospital_id) : null;

      res.json({
        incident,
        timeline,
        ambulance,
        hospital
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get incident by ID
  router.get('/:id', async (req, res) => {
    try {
      const incident = await db.getIncidentById(req.params.id);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });

      const timeline = await db.getTimeline(incident.id);
      const confirmations = await db.getConfirmationsForIncident(incident.id);
      const ambulance = incident.assigned_ambulance_id ? await db.getAmbulanceById(incident.assigned_ambulance_id) : null;
      const hospital = incident.destination_hospital_id ? await db.getHospitalById(incident.destination_hospital_id) : null;

      res.json({
        incident,
        timeline,
        confirmations,
        ambulance,
        hospital
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Assign ambulance to incident
  router.post('/:id/ambulance', async (req, res) => {
    try {
      const { ambulanceId } = req.body;
      const incidentId = req.params.id;

      const incident = await db.getIncidentById(incidentId);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });

      const ambulance = await db.getAmbulanceById(ambulanceId);
      if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });

      await db.updateIncident(incidentId, {
        assigned_ambulance_id: ambulanceId,
        status: 'AMBULANCE_ASSIGNED'
      });

      await db.updateAmbulanceStatus(ambulanceId, 'ASSIGNED', incidentId);

      await db.addTimelineStep({
        incident_id: incidentId,
        step_number: 2,
        title: 'Ambulance Dispatched',
        description: `Ambulance ${ambulance.vehicle_number} (${ambulance.type}) dispatched from ${ambulance.base_station}. Driver: ${ambulance.driver_name}`,
        badge: 'DISPATCHED',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const updatedIncident = await db.getIncidentById(incidentId);

      // Broadcast update
      io.emit(`emergency:${incidentId}`, { type: 'AMBULANCE_ASSIGNED', incident: updatedIncident, ambulance });
      io.emit('emergency:updated', updatedIncident);

      res.json({ success: true, incident: updatedIncident, ambulance });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get incident timeline
  router.get('/:id/timeline', async (req, res) => {
    try {
      const timeline = await db.getTimeline(req.params.id);
      res.json(timeline);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update status (Requested -> Ambulance Assigned -> On The Way -> Arrived -> Patient Picked Up -> Hospital Confirmed -> En Route -> Arrived at Hospital)
  router.post('/:id/status', async (req, res) => {
    try {
      const { status, note, badge } = req.body;
      const incidentId = req.params.id;

      const incident = await db.getIncidentById(incidentId);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });

      const updated = await db.updateIncident(incidentId, { status });

      const currentTimeline = await db.getTimeline(incidentId);
      const nextStepNum = currentTimeline.length + 1;

      await db.addTimelineStep({
        incident_id: incidentId,
        step_number: nextStepNum,
        title: `Status: ${status.replace(/_/g, ' ')}`,
        description: note || `Emergency status transitioned to ${status}`,
        badge: badge || status,
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      io.emit(`emergency:${incidentId}`, { type: 'STATUS_CHANGE', incident: updated });
      io.emit('emergency:updated', updated);

      res.json({ success: true, incident: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
