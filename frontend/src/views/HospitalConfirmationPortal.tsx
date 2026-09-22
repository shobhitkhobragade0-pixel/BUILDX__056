import React, { useState, useEffect } from 'react';
import { 
  Building2, CheckCircle2, XCircle, AlertTriangle, 
  Activity, Stethoscope, Bed, RefreshCw, Radio
} from 'lucide-react';
import { 
  getHospitals, confirmHospitalDispatch, updateHospitalCapacityAPI, 
  updateSpecialistAPI, updateHospitalStatusAPI 
} from '../services/api';
import { socket } from '../services/socket';
import { Hospital } from '../types';

export const HospitalConfirmationPortal: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-aiims');
  const [incomingAlert, setIncomingAlert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch hospital data
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for incoming hospital alerts
    const handleIncoming = (data: any) => {
      console.log('Incoming dispatch request received:', data);
      setIncomingAlert(data);
    };

    socket.on(`hospital:${selectedHospitalId}:incoming`, handleIncoming);
    socket.on('control_room:hospital_request', (data) => {
      if (data.hospital?.id === selectedHospitalId) {
        setIncomingAlert(data);
      }
    });

    return () => {
      socket.off(`hospital:${selectedHospitalId}:incoming`, handleIncoming);
      socket.off('control_room:hospital_request');
    };
  }, [selectedHospitalId]);

  const currentHospital = hospitals.find(h => h.id === selectedHospitalId);

  // Hospital decision actions
  const handleConfirmDecision = async (status: 'ACCEPTED' | 'REJECTED', rejectionReason?: string) => {
    if (!incomingAlert) return;
    const incidentId = incomingAlert.incident?.id || 'rohan-accident-khapri-2026';
    try {
      await confirmHospitalDispatch(selectedHospitalId, incidentId, status, rejectionReason);
      setActionSuccess(status === 'ACCEPTED' ? 'Admission Confirmed: Trauma Bay reserved.' : `Admission Rejected: ${rejectionReason}`);
      setIncomingAlert(null);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Decision submission error: ${err.message}`);
    }
  };

  // Capacity Adjuster
  const handleAdjustCapacity = async (type: 'icu' | 'er', delta: number) => {
    if (!currentHospital?.capacity) return;
    const newIcu = type === 'icu' 
      ? Math.max(0, currentHospital.capacity.icu_beds_available + delta) 
      : currentHospital.capacity.icu_beds_available;
    const newEr = type === 'er' 
      ? Math.max(0, currentHospital.capacity.er_beds_available + delta) 
      : currentHospital.capacity.er_beds_available;

    try {
      await updateHospitalCapacityAPI(selectedHospitalId, {
        icu_beds_available: newIcu,
        er_beds_available: newEr
      });
      loadData();
    } catch (e: any) {
      console.error('Capacity update failed:', e);
    }
  };

  // Specialist Status updater
  const handleSpecialistStatus = async (specialistId: string, status: 'AVAILABLE' | 'ON CALL' | 'UNAVAILABLE') => {
    try {
      await updateSpecialistAPI(selectedHospitalId, specialistId, status);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Hospital Intake status
  const handleEmergencyStatus = async (status: 'ACCEPTING' | 'LIMITED' | 'NOT ACCEPTING') => {
    try {
      await updateHospitalStatusAPI(selectedHospitalId, status);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Hospital Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-500" />
            Hospital Admission & Capacity Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time emergency pre-alert response, bed management, and specialist roster.
          </p>
        </div>

        {/* Hospital Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-300">Hospital Terminal:</label>
          <select
            value={selectedHospitalId}
            onChange={(e) => {
              setSelectedHospitalId(e.target.value);
              setIncomingAlert(null);
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {actionSuccess}
        </div>
      )}

      {/* Live Incoming Emergency Request Alert Banner */}
      {incomingAlert ? (
        <div className="rounded-2xl border-2 border-red-500 bg-red-950/40 p-5 shadow-2xl shadow-red-950/50 relative overflow-hidden animate-pulse">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-xl bg-red-600 text-white font-black text-lg">
                🚨
              </span>
              <div>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                  INCOMING EMERGENCY PRE-ALERT
                </span>
                <h2 className="text-lg font-black text-white mt-1">
                  {incomingAlert.incident?.patient_name} ({incomingAlert.incident?.patient_age}y {incomingAlert.incident?.patient_gender})
                </h2>
                <p className="text-xs text-red-200 font-semibold mt-0.5">
                  Type: {incomingAlert.incident?.emergency_type} — Priority: {incomingAlert.incident?.priority}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">ESTIMATED ARRIVAL</span>
              <span className="text-xl font-black text-white font-mono">
                {incomingAlert.confirmation?.estimated_arrival_min || 8} MINS
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-red-800/40 text-xs space-y-2">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Symptoms & Vitals:</span>
              <span className="font-semibold text-slate-200">
                {incomingAlert.incident?.symptoms?.join(', ')} — {incomingAlert.incident?.symptom_notes}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-slate-300">Conscious: <strong>{incomingAlert.incident?.conscious_status}</strong></span>
              <span className="text-slate-300">Blood Requested: <strong>{incomingAlert.incident?.blood_group_needed || 'O- Universal'}</strong></span>
            </div>
          </div>

          {/* Action Buttons: Accept / Reject with explicit reasons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleConfirmDecision('ACCEPTED')}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ACCEPT & RESERVE TRAUMA BAY</span>
            </button>

            <button
              onClick={() => handleConfirmDecision('REJECTED', 'NO_CAPACITY')}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/40 font-bold text-xs transition-all"
            >
              REJECT — NO CAPACITY
            </button>

            <button
              onClick={() => handleConfirmDecision('REJECTED', 'SPECIALIST_UNAVAILABLE')}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/40 font-bold text-xs transition-all"
            >
              REJECT — SPECIALIST UNAVAILABLE
            </button>

            <button
              onClick={() => handleConfirmDecision('REJECTED', 'RESOURCE_UNAVAILABLE')}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/40 font-bold text-xs transition-all"
            >
              REJECT — RESOURCE UNAVAILABLE
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Standing by for incoming emergency coordination alerts...</span>
          </div>
          <button
            onClick={() => setIncomingAlert({
              incident: {
                id: 'rohan-accident-khapri-2026',
                patient_name: 'Rohan (Accident Victim)',
                patient_age: 27,
                patient_gender: 'Male',
                emergency_type: 'Road Accident',
                conscious_status: 'Unconscious',
                symptoms: ['Head Injury', 'Femur Fracture', 'Severe Bleeding'],
                symptom_notes: 'Accident at Wardha Road near Khapri. Severe arterial hemorrhage.',
                blood_group_needed: 'O-',
                priority: 'CRITICAL'
              },
              confirmation: { estimated_arrival_min: 8 }
            })}
            className="text-[11px] font-bold text-red-400 hover:text-red-300 underline"
          >
            Simulate Incoming Rohan Dispatch Request
          </button>
        </div>
      )}

      {/* Hospital Real-Time Capacity & Specialist Management */}
      {currentHospital && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bed Capacity Controls */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Bed className="w-4 h-4 text-emerald-400" />
              Live Bed Availability (Writes to PostgreSQL)
            </h3>

            <div className="space-y-3 text-xs">
              {/* ICU Beds */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">ICU Beds Available</span>
                  <span className="text-slate-400 text-[11px]">
                    Total Registered: {currentHospital.capacity?.icu_beds_total || 20}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAdjustCapacity('icu', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 text-base"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-xl text-emerald-400 w-8 text-center">
                    {currentHospital.capacity?.icu_beds_available ?? 0}
                  </span>
                  <button
                    onClick={() => handleAdjustCapacity('icu', 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ER Resuscitation Beds */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">ER Resuscitation Beds</span>
                  <span className="text-slate-400 text-[11px]">
                    Total Registered: {currentHospital.capacity?.er_beds_total || 15}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAdjustCapacity('er', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 text-base"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-xl text-blue-400 w-8 text-center">
                    {currentHospital.capacity?.er_beds_available ?? 0}
                  </span>
                  <button
                    onClick={() => handleAdjustCapacity('er', 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Emergency Intake Status */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <span className="font-bold text-white text-sm block">Emergency Intake Mode</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['ACCEPTING', 'LIMITED', 'NOT ACCEPTING'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleEmergencyStatus(st)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                        currentHospital.emergency_status === st
                          ? st === 'ACCEPTING' 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : st === 'LIMITED' 
                            ? 'bg-amber-600 text-white border-amber-500' 
                            : 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Specialists Roster Controls */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              Specialist On-Call Roster
            </h3>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 text-xs">
              {currentHospital.specialists?.map((spec) => (
                <div key={spec.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{spec.specialty}</span>
                      <p className="text-[11px] text-slate-400">{spec.doctor_name}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{spec.contact}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(['AVAILABLE', 'ON CALL', 'UNAVAILABLE'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleSpecialistStatus(spec.id, st)}
                        className={`py-1 rounded text-[10px] font-bold border transition-all ${
                          spec.status === st
                            ? st === 'AVAILABLE' 
                              ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500' 
                              : st === 'ON CALL' 
                              ? 'bg-amber-900/80 text-amber-200 border-amber-500' 
                              : 'bg-rose-900/80 text-rose-200 border-rose-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
