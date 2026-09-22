import React, { useState, useEffect } from 'react';
import { 
  Radio, ShieldAlert, Ambulance as AmbulanceIcon, 
  Building2, Droplet, Users, Clock, MapPin, RefreshCw, AlertOctagon
} from 'lucide-react';
import { getAllEmergencies, getHospitals, getAmbulances, getBloodBanks } from '../services/api';
import { socket } from '../services/socket';
import { NagpurEmergencyMap } from '../components/Map/NagpurEmergencyMap';
import { EmergencyIncident, Hospital, Ambulance, BloodBank } from '../types';

export const ControlRoomDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [incRes, hospRes, ambRes, bbRes] = await Promise.all([
        getAllEmergencies(),
        getHospitals(),
        getAmbulances(),
        getBloodBanks()
      ]);
      setIncidents(incRes);
      setHospitals(hospRes);
      setAmbulances(ambRes);
      setBloodBanks(bbRes);
    } catch (err) {
      console.error('Failed to load control room data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    // Listen to real-time events on control room channel
    socket.on('emergency:new', (inc) => {
      setIncidents(prev => [inc, ...prev]);
    });

    socket.on('emergency:updated', (inc) => {
      setIncidents(prev => prev.map(item => item.id === inc.id ? inc : item));
    });

    socket.on('ambulance:status_updated', (amb) => {
      setAmbulances(prev => prev.map(item => item.id === amb.id ? amb : item));
    });

    socket.on('hospital:capacity_updated', ({ hospitalId, capacity }) => {
      setHospitals(prev => prev.map(h => h.id === hospitalId ? { ...h, capacity } : h));
    });

    return () => {
      socket.off('emergency:new');
      socket.off('emergency:updated');
      socket.off('ambulance:status_updated');
      socket.off('hospital:capacity_updated');
    };
  }, []);

  // Compute metrics
  const activeEmergencies = incidents.filter(i => i.status !== 'COMPLETED' && i.status !== 'CANCELLED');
  const availableAmbulances = ambulances.filter(a => a.status === 'AVAILABLE');
  const totalIcuFree = hospitals.reduce((acc, h) => acc + (h.capacity?.icu_beds_available || 0), 0);
  
  // Blood alerts
  const lowBloodAlerts: { bankName: string; group: string; units: number }[] = [];
  bloodBanks.forEach(b => {
    b.inventory?.forEach(inv => {
      if (inv.units_available <= 2) {
        lowBloodAlerts.push({ bankName: b.name, group: inv.blood_group, units: inv.units_available });
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Radio className="w-7 h-7 text-red-500 animate-pulse" />
              Nagpur Emergency Command & Control Room
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
              EOC LIVE CAD
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized coordination of ambulances, hospital beds, on-call surgeons, and blood banks across Nagpur district.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Grid</span>
        </button>
      </div>

      {/* High-Level Status Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ACTIVE EMERGENCIES</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {activeEmergencies.length}
          </div>
          <span className="text-[11px] text-red-400 font-semibold mt-1 block">
            {incidents.filter(i => i.priority === 'CRITICAL').length} Critical Priority
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AVAILABLE AMBULANCES</span>
            <AmbulanceIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {availableAmbulances.length} / {ambulances.length}
          </div>
          <span className="text-[11px] text-amber-400 font-semibold mt-1 block">
            {ambulances.filter(a => a.type === 'ALS').length} ALS Units Ready
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>DISTRICT ICU BEDS FREE</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {totalIcuFree} Beds
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {hospitals.length} Super-Speciality Centers
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CRITICAL BLOOD ALERTS</span>
            <Droplet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
            {lowBloodAlerts.length} Shortages
          </div>
          <span className="text-[11px] text-rose-300 font-semibold mt-1 block">
            Immediate O- / B- restocking needed
          </span>
        </div>
      </div>

      {/* Unified Nagpur Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            Nagpur Emergency Spatial Map (Ambulance Telemetry & Hospital Beds)
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Wardha Road / MIHAN / Central Nagpur Corridor
          </span>
        </div>
        <NagpurEmergencyMap
          center={[21.0950, 79.0600]}
          zoom={12}
          hospitals={hospitals}
          ambulances={ambulances}
          incident={incidents[0] || null}
          bloodBanks={bloodBanks}
          heightClass="h-[460px]"
        />
      </div>

      {/* Active Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Active Emergency Incidents Cad Ledger
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {incidents.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Tracking ID</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Type & Vitals</th>
                <th className="p-3">Location</th>
                <th className="p-3">Ambulance</th>
                <th className="p-3">Destination Hospital</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {incidents.map((inc) => {
                const assignedAmb = ambulances.find(a => a.id === inc.assigned_ambulance_id);
                const destHosp = hospitals.find(h => h.id === inc.destination_hospital_id);

                return (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-red-400">
                      {inc.tracking_code}
                    </td>
                    <td className="p-3 font-medium text-white">
                      {inc.patient_name} ({inc.patient_age}y {inc.patient_gender})
                    </td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        inc.priority === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {inc.emergency_type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 truncate max-w-xs">
                      {inc.location_address}
                    </td>
                    <td className="p-3 font-mono">
                      {assignedAmb ? (
                        <span className="text-amber-400">{assignedAmb.vehicle_number}</span>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-emerald-400">
                      {destHosp ? destHosp.name.split('(')[0] : 'Scanning...'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        {inc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hospital Capacity Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">
          Nagpur Hospital Capacity & Trauma Status Grid
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {hospitals.map((hosp) => (
            <div key={hosp.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{hosp.name}</h4>
                  <p className="text-[11px] text-slate-400">{hosp.address.split(',')[1] || hosp.address}</p>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  hosp.emergency_status === 'ACCEPTING' 
                    ? 'bg-emerald-900/60 text-emerald-300' 
                    : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {hosp.emergency_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-900 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">ICU Free:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {hosp.capacity?.icu_beds_available ?? 0} / {hosp.capacity?.icu_beds_total ?? 0}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">ER Beds:</span>
                  <span className="font-bold text-blue-400 text-sm">
                    {hosp.capacity?.er_beds_available ?? 0} / {hosp.capacity?.er_beds_total ?? 0}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
                <span>Trauma: {hosp.trauma_level}</span>
                <span>Source: {hosp.source.split('/')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
