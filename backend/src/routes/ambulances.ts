import { Router } from 'express';
import { db } from '../config/database.js';

export function createAmbulancesRouter(io: any) {
  const router = Router();

  // Get all ambulances
  router.get('/', async (req, res) => {
    try {
      const ambulances = await db.getAllAmbulances();
      res.json(ambulances);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get ambulance by ID
  router.get('/:id', async (req, res) => {
    try {
      const amb = await db.getAmbulanceById(req.params.id);
      if (!amb) return res.status(404).json({ error: 'Ambulance not found' });
      res.json(amb);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Ambulance Status
  // (REQUESTED -> ASSIGNED -> ON_THE_WAY -> ARRIVED_AT_SCENE -> PATIENT_PICKED_UP -> EN_ROUTE_HOSPITAL -> ARRIVED_AT_HOSPITAL)
  router.post('/:id/status', async (req, res) => {
    try {
      const ambulanceId = req.params.id;
      const { status, incidentId } = req.body;

      const ambulance = await db.updateAmbulanceStatus(ambulanceId, status, incidentId);
      if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });

      // If tied to an incident, update incident status and timeline
      if (incidentId) {
        let incidentStatus = 'ON_THE_WAY';
        let stepTitle = 'Ambulance On Route to Scene';
        let badge = 'DISPATCHED';

        if (status === 'ARRIVED_AT_SCENE') {
          incidentStatus = 'ARRIVED';
          stepTitle = 'Ambulance Arrived at Emergency Location';
          badge = 'ON SCENE';
        } else if (status === 'PATIENT_PICKED_UP') {
          incidentStatus = 'PATIENT_PICKED_UP';
          stepTitle = 'Patient Stabilized & Picked Up';
          badge = 'PATIENT ONBOARD';
        } else if (status === 'EN_ROUTE_HOSPITAL') {
          incidentStatus = 'EN_ROUTE_HOSPITAL';
          stepTitle = 'Ambulance En Route to Destination Hospital';
          badge = 'EN ROUTE';
        } else if (status === 'ARRIVED_AT_HOSPITAL') {
          incidentStatus = 'ARRIVED_AT_HOSPITAL';
          stepTitle = 'Ambulance Arrived at Hospital Emergency Bay';
          badge = 'ARRIVED HOSPITAL';
        }

        await db.updateIncident(incidentId, { status: incidentStatus as any });
        const currentTimeline = await db.getTimeline(incidentId);

        await db.addTimelineStep({
          incident_id: incidentId,
          step_number: currentTimeline.length + 1,
          title: stepTitle,
          description: `Vehicle ${ambulance.vehicle_number} status updated to ${status}. Paramedic: ${ambulance.driver_name}`,
          badge,
          status: 'completed',
          timestamp: new Date().toISOString()
        });

        const updatedIncident = await db.getIncidentById(incidentId);
        io.emit(`emergency:${incidentId}`, { type: 'AMBULANCE_STATUS', ambulance, incident: updatedIncident });
        io.emit('emergency:updated', updatedIncident);
      }

      io.emit('ambulance:status_updated', ambulance);

      res.json({ success: true, ambulance });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Ambulance GPS Telemetry (Live Location)
  router.post('/:id/telemetry', async (req, res) => {
    try {
      const ambulanceId = req.params.id;
      const { latitude, longitude, speed_kmh } = req.body;

      const updated = await db.updateAmbulanceLocation(ambulanceId, Number(latitude), Number(longitude));
      if (!updated) return res.status(404).json({ error: 'Ambulance not found' });

      io.emit('ambulance:telemetry', {
        ambulanceId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed_kmh: speed_kmh || 45,
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, ambulance: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
