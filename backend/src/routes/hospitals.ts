import { Router } from 'express';
import { db } from '../config/database.js';
import { matchHospitals } from '../services/matchingEngine.js';

export function createHospitalsRouter(io: any) {
  const router = Router();

  // Get all hospitals with capacities and specialists
  router.get('/', async (req, res) => {
    try {
      const hospitals = await db.getAllHospitals();
      const enriched = await Promise.all(
        hospitals.map(async h => {
          const capacity = await db.getHospitalCapacity(h.id);
          const specialists = await db.getHospitalSpecialists(h.id);
          return {
            ...h,
            capacity,
            specialists
          };
        })
      );
      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resource-Aware Hospital Matching Engine
  router.post('/match', async (req, res) => {
    try {
      const {
        patientLatitude,
        patientLongitude,
        emergencyType,
        requiredSpecialists,
        requireICU,
        requireTraumaCenter,
        bloodGroupNeeded
      } = req.body;

      const results = await matchHospitals({
        patientLatitude: Number(patientLatitude) || 21.0505,
        patientLongitude: Number(patientLongitude) || 79.0531,
        emergencyType: emergencyType || 'Road Accident',
        requiredSpecialists: Array.isArray(requiredSpecialists) ? requiredSpecialists : ['Neurosurgeon', 'Orthopedic'],
        requireICU: requireICU !== undefined ? Boolean(requireICU) : true,
        requireTraumaCenter: requireTraumaCenter !== undefined ? Boolean(requireTraumaCenter) : true,
        bloodGroupNeeded: bloodGroupNeeded || 'O-'
      });

      res.json({
        totalEvaluated: results.length,
        suitableCount: results.filter(r => r.is_suitable).length,
        unsuitableCount: results.filter(r => !r.is_suitable).length,
        matches: results
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single hospital by ID
  router.get('/:id', async (req, res) => {
    try {
      const hospital = await db.getHospitalById(req.params.id);
      if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

      const capacity = await db.getHospitalCapacity(hospital.id);
      const specialists = await db.getHospitalSpecialists(hospital.id);

      res.json({
        ...hospital,
        capacity,
        specialists
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Request Confirmation from Hospital (Citizen / Dispatcher initiates)
  router.post('/:id/request-confirmation', async (req, res) => {
    try {
      const hospitalId = req.params.id;
      const { incidentId, estimatedArrivalMin } = req.body;

      const hospital = await db.getHospitalById(hospitalId);
      const incident = await db.getIncidentById(incidentId);

      if (!hospital || !incident) {
        return res.status(404).json({ error: 'Hospital or incident not found' });
      }

      const conf = await db.createConfirmation({
        id: `conf-${Date.now()}`,
        incident_id: incidentId,
        hospital_id: hospitalId,
        status: 'PENDING',
        estimated_arrival_min: estimatedArrivalMin || 15
      });

      // Broadcast alert directly to Hospital portal & control room
      io.emit(`hospital:${hospitalId}:incoming`, {
        confirmation: conf,
        incident,
        hospital
      });
      io.emit('control_room:hospital_request', { conf, incident, hospital });

      res.json({ success: true, confirmation: conf });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Hospital responds: ACCEPT or REJECT
  router.post('/:id/confirm', async (req, res) => {
    try {
      const hospitalId = req.params.id;
      const { incidentId, status, rejectionReason, note } = req.body;

      if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
      }

      const conf = await db.updateConfirmation(incidentId, hospitalId, status, rejectionReason);
      const hospital = await db.getHospitalById(hospitalId);
      const incident = await db.getIncidentById(incidentId);

      if (status === 'ACCEPTED') {
        // Confirm hospital as the official emergency destination
        await db.updateIncident(incidentId, {
          destination_hospital_id: hospitalId,
          status: 'HOSPITAL_CONFIRMED'
        });

        // Add timeline step
        await db.addTimelineStep({
          incident_id: incidentId,
          step_number: 4,
          title: 'Hospital Confirmed & Trauma Bay Reserved',
          description: `${hospital?.name} confirmed capacity. Trauma team & ICU bed reserved.`,
          badge: 'HOSPITAL ACCEPTED',
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      } else {
        // Add rejection step to timeline
        await db.addTimelineStep({
          incident_id: incidentId,
          step_number: 3,
          title: `Admission Diverted by ${hospital?.name}`,
          description: `Reason: ${rejectionReason || 'No capacity'}. Auto-rerouting to next suitable facility.`,
          badge: 'REROUTED',
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }

      const updatedIncident = await db.getIncidentById(incidentId);

      // Broadcast to all channels
      io.emit(`emergency:${incidentId}`, {
        type: status === 'ACCEPTED' ? 'HOSPITAL_ACCEPTED' : 'HOSPITAL_REJECTED',
        confirmation: conf,
        hospital,
        incident: updatedIncident
      });
      io.emit('emergency:updated', updatedIncident);

      res.json({ success: true, confirmation: conf, incident: updatedIncident });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Capacity (ICU Beds, ER Beds) - Live from Hospital Dashboard
  router.post('/:id/capacity', async (req, res) => {
    try {
      const hospitalId = req.params.id;
      const { icu_beds_available, er_beds_available, ventilator_available } = req.body;

      const updated = await db.updateHospitalCapacity(hospitalId, {
        icu_beds_available: Number(icu_beds_available),
        er_beds_available: Number(er_beds_available),
        ventilator_available: ventilator_available !== undefined ? Number(ventilator_available) : undefined
      });

      // Broadcast real-time capacity change to control room & matching engine
      io.emit('hospital:capacity_updated', { hospitalId, capacity: updated });

      res.json({ success: true, capacity: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Specialist Status (AVAILABLE, ON CALL, UNAVAILABLE)
  router.post('/:id/specialist', async (req, res) => {
    try {
      const { specialistId, status } = req.body;
      const updated = await db.updateSpecialistStatus(specialistId, status);
      io.emit('hospital:specialist_updated', { hospitalId: req.params.id, specialist: updated });
      res.json({ success: true, specialist: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Emergency Department Intake Status
  router.post('/:id/status', async (req, res) => {
    try {
      const hospitalId = req.params.id;
      const { status } = req.body;
      const updated = await db.updateHospitalEmergencyStatus(hospitalId, status);
      io.emit('hospital:status_updated', { hospitalId, hospital: updated });
      res.json({ success: true, hospital: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
