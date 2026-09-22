import React, { useState, useEffect } from 'react';
import { 
  Building2, CheckCircle2, XCircle, Clock, MapPin, 
  Stethoscope, ShieldAlert, HeartPulse, Send, AlertTriangle, Filter, Check
} from 'lucide-react';
import { matchHospitalsAPI, requestHospitalConfirmation } from '../services/api';
import { HospitalMatchResult, EmergencyIncident } from '../types';

interface HospitalMatchingViewProps {
  activeIncident?: EmergencyIncident | null;
  onHospitalConfirmed?: (hospitalId: string) => void;
}

export const HospitalMatchingView: React.FC<HospitalMatchingViewProps> = ({
  activeIncident,
  onHospitalConfirmed
}) => {
  const [matches, setMatches] = useState<HospitalMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [selectedHospitalDetails, setSelectedHospitalDetails] = useState<HospitalMatchResult | null>(null);
  const [confirmedHospId, setConfirmedHospId] = useState<string | null>(null);

  // Criteria controls
  const [requireICU, setRequireICU] = useState(true);
  const [requireTrauma, setRequireTrauma] = useState(true);
  const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>(['Neurosurgeon', 'Orthopedic']);
  const [bloodGroup, setBloodGroup] = useState(activeIncident?.blood_group_needed || 'O-');

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await matchHospitalsAPI({
        patientLatitude: activeIncident?.latitude || 21.0505,
        patientLongitude: activeIncident?.longitude || 79.0531,
        emergencyType: activeIncident?.emergency_type || 'Road Accident',
        requiredSpecialists: selectedSpecialists,
        requireICU,
        requireTraumaCenter: requireTrauma,
        bloodGroupNeeded: bloodGroup
      });
      setMatches(res.matches);
    } catch (err) {
      console.error('Matching API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [activeIncident, requireICU, requireTrauma, selectedSpecialists, bloodGroup]);

  const handleToggleSpecialist = (spec: string) => {
    if (selectedSpecialists.includes(spec)) {
      setSelectedSpecialists(selectedSpecialists.filter(s => s !== spec));
    } else {
      setSelectedSpecialists([...selectedSpecialists, spec]);
    }
  };

  const handleRequestConfirmation = async (hospResult: HospitalMatchResult) => {
    setRequestingId(hospResult.hospital.id);
    try {
      const incidentId = activeIncident?.id || 'rohan-accident-khapri-2026';
      await requestHospitalConfirmation(
        hospResult.hospital.id,
        incidentId,
        hospResult.criteria_checks.eta_minutes
      );
      setConfirmedHospId(hospResult.hospital.id);
      if (onHospitalConfirmed) onHospitalConfirmed(hospResult.hospital.id);
      alert(`Pre-admission confirmation requested from ${hospResult.hospital.name}. Emergency team notified.`);
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-red-500" />
              Resource-Aware Hospital Matching
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Matching based on multi-dimensional clinical capability: ICU beds, on-call specialists, trauma rating & blood stock.
          </p>
        </div>

        {/* Active Incident Badge if available */}
        {activeIncident && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-xs max-w-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-300">ACTIVE EMERGENCY TARGET</span>
              <span className="font-mono text-slate-400">{activeIncident.tracking_code}</span>
            </div>
            <div className="text-slate-200 mt-1 font-medium">
              {activeIncident.patient_name} ({activeIncident.patient_age}y) — {activeIncident.emergency_type}
            </div>
            <div className="text-slate-400 text-[11px] truncate mt-0.5">
              {activeIncident.location_address}
            </div>
          </div>
        )}
      </div>

      {/* Filter / Requirement Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          <Filter className="w-4 h-4 text-red-400" />
          Filter Clinical Constraints
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* ICU toggle */}
          <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/70">
            <span className="font-medium text-slate-300">Require Available ICU Bed</span>
            <input
              type="checkbox"
              checked={requireICU}
              onChange={(e) => setRequireICU(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
            />
          </div>

          {/* Trauma Center toggle */}
          <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/70">
            <span className="font-medium text-slate-300">Designated Trauma Facility</span>
            <input
              type="checkbox"
              checked={requireTrauma}
              onChange={(e) => setRequireTrauma(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
            />
          </div>

          {/* Blood group needed */}
          <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/70">
            <span className="font-medium text-slate-300">Blood Support</span>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs font-mono"
            >
              <option value="O-">O- (Universal)</option>
              <option value="O+">O+</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          {/* Specialists multi-select */}
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/70">
            <span className="font-medium text-slate-300 block mb-1.5">Required Specialists:</span>
            <div className="flex flex-wrap gap-1">
              {['Neurosurgeon', 'Orthopedic', 'Cardiologist', 'Trauma Specialist'].map((sp) => {
                const selected = selectedSpecialists.includes(sp);
                return (
                  <button
                    key={sp}
                    onClick={() => handleToggleSpecialist(sp)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                      selected 
                        ? 'bg-red-600/30 text-red-200 border-red-500' 
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {sp}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>HOSPITALS EVALUATED ({matches.length})</span>
          <span className="font-mono text-emerald-400">
            {matches.filter(m => m.is_suitable).length} SUITABLE | {matches.filter(m => !m.is_suitable).length} INSUFFICIENT CAPACITY
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
            Evaluating Nagpur hospital network capacities...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((res) => {
              const { hospital, capacity, criteria_checks, reasons, rejection_reasons, is_suitable } = res;
              const isConfirmed = confirmedHospId === hospital.id;

              return (
                <div
                  key={hospital.id}
                  className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                    is_suitable
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-xl shadow-emerald-950/20 hover:border-emerald-500/70'
                      : 'bg-slate-900/50 border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-800/80">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase mb-1.5 ${
                          is_suitable
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {is_suitable ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              SUITABLE MATCH
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              INSUFFICIENT RESOURCES
                            </>
                          )}
                        </span>
                        <h3 className="font-extrabold text-white text-base leading-snug">
                          {hospital.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{hospital.type}</p>
                      </div>

                      {/* Distance & ETA Badge */}
                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-white text-base">
                          {criteria_checks.eta_minutes} min
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {criteria_checks.distance_km} km
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bed & Specialist Capacity Grid */}
                  <div className="p-4 space-y-3 text-xs flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2 rounded-lg border ${
                        criteria_checks.icu_available 
                          ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' 
                          : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                      }`}>
                        <span className="block text-[10px] text-slate-400">ICU BEDS FREE</span>
                        <span className="font-bold text-sm">
                          {capacity.icu_beds_available} / {capacity.icu_beds_total}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg border bg-slate-800/50 border-slate-700/60 text-slate-300">
                        <span className="block text-[10px] text-slate-400">ER RESUSCITATION</span>
                        <span className="font-bold text-sm text-white">
                          {capacity.er_beds_available} / {capacity.er_beds_total} Beds
                        </span>
                      </div>
                    </div>

                    {/* Criteria Evaluation List (Explainable Rationale) */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Matching Evaluation:
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {is_suitable ? (
                          reasons.map((r, i) => (
                            <div key={i} className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{r}</span>
                            </div>
                          ))
                        ) : (
                          rejection_reasons.map((rej, i) => (
                            <div key={i} className="text-[11px] text-rose-400 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{rej}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Metadata & Data Transparency */}
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                      <span>Source: {hospital.source.split('/')[0]}</span>
                      <span className="px-1 rounded bg-slate-800 text-slate-400">
                        {hospital.data_status}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedHospitalDetails(res)}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      VIEW DETAILS
                    </button>

                    {is_suitable && (
                      <button
                        onClick={() => handleRequestConfirmation(res)}
                        disabled={requestingId === hospital.id || isConfirmed}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md ${
                          isConfirmed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isConfirmed ? 'CONFIRMED' : requestingId === hospital.id ? 'SENDING...' : 'REQUEST CONFIRMATION'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hospital Detail Inspection Drawer / Modal */}
      {selectedHospitalDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{selectedHospitalDetails.hospital.name}</h3>
                <p className="text-xs text-slate-400">{selectedHospitalDetails.hospital.address}</p>
              </div>
              <button 
                onClick={() => setSelectedHospitalDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800 p-3 rounded-xl space-y-1">
                <div className="font-bold text-slate-200">Trauma Level: {selectedHospitalDetails.hospital.trauma_level}</div>
                <div className="text-slate-400">Emergency Status: {selectedHospitalDetails.hospital.emergency_status}</div>
                <div className="text-slate-400">Phone: {selectedHospitalDetails.hospital.phone}</div>
              </div>

              <div>
                <div className="font-bold text-slate-300 mb-1">On-Duty Specialists:</div>
                <div className="space-y-1">
                  {selectedHospitalDetails.specialists?.map((s) => (
                    <div key={s.id} className="p-2 rounded bg-slate-800/70 flex items-center justify-between">
                      <span className="font-medium text-white">{s.specialty}: {s.doctor_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'AVAILABLE' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedHospitalDetails(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
