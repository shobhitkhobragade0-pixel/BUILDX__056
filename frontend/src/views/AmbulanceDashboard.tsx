import React, { useState, useEffect } from 'react';
import { 
  Ambulance as AmbulanceIcon, Navigation, CheckCircle2, 
  MapPin, Phone, Building2, User, Clock, AlertCircle, ArrowRight
} from 'lucide-react';
import { getAmbulances, updateAmbulanceStatusAPI, getEmergency } from '../services/api';
import { NagpurEmergencyMap } from '../components/Map/NagpurEmergencyMap';
import { Ambulance, EmergencyIncident, Hospital } from '../types';

export const AmbulanceDashboard: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('amb-als-101');
  const [incident, setIncident] = useState<EmergencyIncident | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const fleet = await getAmbulances();
      setAmbulances(fleet);

      // Fetch Rohan demo accident or current incident
      const currentAmb = fleet.find(a => a.id === selectedAmbulanceId);
      const incId = currentAmb?.current_incident_id || 'rohan-accident-khapri-2026';
      
      try {
        const incRes = await getEmergency(incId);
        if (incRes.incident) setIncident(incRes.incident);
        if (incRes.hospital) setHospital(incRes.hospital);
      } catch (e) {
        // quiet fallback
      }
    } catch (err) {
      console.error('Failed to load ambulance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAmbulanceId]);

  const currentAmbulance = ambulances.find(a => a.id === selectedAmbulanceId);

  // Status transitions
  const handleStatusTransition = async (status: string) => {
    if (!currentAmbulance) return;
    try {
      await updateAmbulanceStatusAPI(
        currentAmbulance.id,
        status,
        incident?.id || 'rohan-accident-khapri-2026'
      );
      loadData();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Route between ambulance, scene, and hospital for Leaflet
  const routePoints: [number, number][] = [];
  if (currentAmbulance) {
    routePoints.push([currentAmbulance.latitude, currentAmbulance.longitude]);
  }
  if (incident) {
    routePoints.push([incident.latitude, incident.longitude]);
  }
  if (hospital) {
    routePoints.push([hospital.latitude, hospital.longitude]);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <AmbulanceIcon className="w-7 h-7 text-amber-500" />
            Ambulance Crew CAD Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Onboard Mobile Dispatch & Turn-by-Turn Navigation Console.
          </p>
        </div>

        {/* Vehicle Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-300">Vehicle Unit:</label>
          <select
            value={selectedAmbulanceId}
            onChange={(e) => setSelectedAmbulanceId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white font-mono font-bold text-xs rounded-lg px-3 py-2"
          >
            {ambulances.map(a => (
              <option key={a.id} value={a.id}>{a.vehicle_number} ({a.type}) - {a.base_station.split('/')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {currentAmbulance && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Mission Controls & Status Stepper */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Active Dispatch Overview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    VEHICLE: {currentAmbulance.vehicle_number} ({currentAmbulance.type})
                  </span>
                  <h2 className="text-lg font-black text-white mt-1">
                    {incident ? incident.patient_name : 'No Active Dispatch'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Base: {currentAmbulance.base_station}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 block">CURRENT STATUS</span>
                  <span className="text-xs font-black px-2 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {currentAmbulance.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Patient Condition Details */}
              {incident && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-300 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      {incident.patient_name}, {incident.patient_age}y ({incident.conscious_status})
                    </span>
                    <span className="text-red-400 font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-800/50">
                      {incident.emergency_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {incident.symptom_notes || incident.symptoms?.join(', ')}
                  </p>
                </div>
              )}

              {/* Pickup and Destination Corridor */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Pickup Location</span>
                    <span className="text-white font-medium">
                      {incident ? incident.location_address : 'Khapri / Wardha Road'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-bold uppercase">Destination Hospital</span>
                    <span className="text-emerald-100 font-bold">
                      {hospital ? hospital.name : 'AIIMS Nagpur Super Speciality (MIHAN)'}
                    </span>
                    <span className="block text-[11px] text-emerald-300 mt-0.5">
                      ✓ Trauma Resuscitation Bay Confirmed & Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Driver One-Click Action Buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Dispatch Lifecycle Controls:
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusTransition('ASSIGNED')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
                  >
                    1. ACCEPT DISPATCH
                  </button>

                  <button
                    onClick={() => handleStatusTransition('ARRIVED_AT_SCENE')}
                    className="py-2.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-colors"
                  >
                    2. ARRIVED AT SCENE
                  </button>

                  <button
                    onClick={() => handleStatusTransition('PATIENT_PICKED_UP')}
                    className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs transition-colors"
                  >
                    3. PATIENT PICKED UP
                  </button>

                  <button
                    onClick={() => handleStatusTransition('EN_ROUTE_HOSPITAL')}
                    className="py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition-colors"
                  >
                    4. START TRANSPORT
                  </button>

                  <button
                    onClick={() => handleStatusTransition('ARRIVED_AT_HOSPITAL')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-colors"
                  >
                    5. ARRIVED HOSPITAL
                  </button>

                  <button
                    onClick={() => handleStatusTransition('AVAILABLE')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-colors"
                  >
                    6. HANDOVER COMPLETED
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live GPS Route Map */}
          <div className="lg:col-span-6">
            <NagpurEmergencyMap
              center={[currentAmbulance.latitude, currentAmbulance.longitude]}
              zoom={13}
              ambulances={[currentAmbulance]}
              incident={incident}
              hospitals={hospital ? [hospital] : []}
              routeCoordinates={routePoints}
              heightClass="h-[520px]"
            />
          </div>

        </div>
      )}

    </div>
  );
};
