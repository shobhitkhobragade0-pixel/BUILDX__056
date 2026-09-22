import { Router } from 'express';
import { db } from '../config/database.js';
import { calculateDistanceKm } from '../services/matchingEngine.js';

export function createBloodBanksRouter(io: any) {
  const router = Router();

  // Get all blood banks with optional group and location filtering
  router.get('/', async (req, res) => {
    try {
      const { blood_group, latitude, longitude } = req.query;
      let banks = await db.getAllBloodBanks();

      // If coordinates supplied, calculate distance from user
      if (latitude && longitude) {
        const userLat = Number(latitude);
        const userLng = Number(longitude);
        banks = banks.map(b => ({
          ...b,
          distance_km: calculateDistanceKm(userLat, userLng, b.latitude, b.longitude)
        })).sort((a: any, b: any) => a.distance_km - b.distance_km);
      }

      // Filter by blood group if requested
      if (blood_group) {
        const groupStr = String(blood_group).toUpperCase();
        banks = banks.filter(b => 
          b.inventory?.some(inv => inv.blood_group.toUpperCase() === groupStr && inv.units_available > 0)
        );
      }

      res.json(banks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get specific blood bank inventory
  router.get('/:id/inventory', async (req, res) => {
    try {
      const inventory = await db.getBloodInventory(req.params.id);
      res.json(inventory);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Blood Inventory Units (Reserve units for emergency)
  router.post('/:id/reserve', async (req, res) => {
    try {
      const bloodBankId = req.params.id;
      const { bloodGroup, units, incidentId } = req.body;

      const updated = await db.updateBloodUnits(bloodBankId, bloodGroup, -Math.abs(Number(units) || 1));
      if (!updated) return res.status(404).json({ error: 'Blood record not found' });

      io.emit('blood:updated', { bloodBankId, bloodGroup, updated });

      if (incidentId) {
        await db.addTimelineStep({
          incident_id: incidentId,
          step_number: 5,
          title: `Blood Reserved: ${units} Units of ${bloodGroup}`,
          description: `Emergency blood dispatched from blood bank to trauma bay.`,
          badge: 'BLOOD RESERVED',
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }

      res.json({ success: true, updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
