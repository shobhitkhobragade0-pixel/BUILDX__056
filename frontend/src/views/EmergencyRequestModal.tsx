import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, X, MapPin, Navigation, User, HeartPulse, 
  Activity, Sparkles, ShieldCheck, Check, Info
} from 'lucide-react';
import { createEmergency, requestAITriage } from '../services/api';
import { EmergencyIncident } from '../types';

interface EmergencyRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyCreated: (incident: EmergencyIncident) => void;
}

const NAGPUR_LOCATIONS = [
  { name: 'Wardha Road near Khapri Flyover (Accident Hotspot)', lat: 21.0505, lng: 79.0531 },
  { name: 'MIHAN SEZ Gate 1 / Wardha Road', lat: 21.0580, lng: 79.0350 },
  { name: 'Chhatrapati Square, Wardha Road', lat: 21.1082, lng: 79.0631 },
  { name: 'Khamla Square, Ring Road', lat: 21.1147, lng: 79.0688 },
  { name: 'Sitabuldi Metro Interchange, Central Nagpur', lat: 21.1450, lng: 79.0830 },
  { name: 'Medical Square / GMCH Area', lat: 21.1292, lng: 79.0964 },
  { name: 'Dharampeth Traffic Junction', lat: 21.1442, lng: 79.0620 },
];

export const EmergencyRequestModal: React.FC<EmergencyRequestModalProps> = ({
  isOpen,
  onClose,
  onEmergencyCreated
}) => {
  const [patientName, setPatientName] = useState('Rohan Sharma');
  const [patientAge, setPatientAge] = useState<number>(27);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [emergencyType, setEmergencyType] = useState('Road Accident');
  const [consciousStatus, setConsciousStatus] = useState<'Conscious' | 'Unconscious' | 'Fluctuating'>('Unconscious');
  const [symptoms, setSymptoms] = useState<string[]>(['Head Injury', 'Severe Bleeding', 'Fracture']);
  const [symptomNotes, setSymptomNotes] = useState('High-speed collision. Unconscious with head bleeding and femur fracture.');
  const [bloodGroup, setBloodGroup] = useState('O-');
  
  // Location
  const [locationAddress, setLocationAddress] = useState('Wardha Road near Khapri, Nagpur');
  const [latitude, setLatitude] = useState<number>(21.0505);
  const [longitude, setLongitude] = useState<number>(79.0531);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // AI Triage
  const [aiTriage, setAiTriage] = useState<any>(null);
  const [loadingTriage, setLoadingTriage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Trigger automated AI triage analysis when symptoms change
  useEffect(() => {
    if (!isOpen) return;
    const fetchTriage = async () => {
      setLoadingTriage(true);
      try {
        const res = await requestAITriage(
          `${symptoms.join(', ')} - ${symptomNotes}`,
          emergencyType,
          consciousStatus
        );
        setAiTriage(res);
      } catch (e) {
        console.error('Triage error:', e);
      } finally {
        setLoadingTriage(false);
      }
    };
    const debounce = setTimeout(fetchTriage, 500);
    return () => clearTimeout(debounce);
  }, [symptoms, symptomNotes, emergencyType, consciousStatus, isOpen]);

  // Geolocation trigger
  const handleDetectLocation = () => {
    setDetectingGps(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please select manual location.');
      setDetectingGps(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationAddress(`Current GPS Coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        setDetectingGps(false);
      },
      (err) => {
        setGpsError('Location permission denied or unavailable. Fallback to Nagpur landmark.');
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSelectNagpurLocation = (loc: typeof NAGPUR_LOCATIONS[0]) => {
    setLocationAddress(loc.name);
    setLatitude(loc.lat);
    setLongitude(loc.lng);
  };

  const handleToggleSymptom = (sym: string) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.filter(s => s !== sym));
    } else {
      setSymptoms([...symptoms, sym]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createEmergency({
        patient_name: patientName,
        patient_age: Number(patientAge),
        patient_gender: patientGender,
        emergency_type: emergencyType,
        conscious_status: consciousStatus,
        symptoms,
        symptom_notes: symptomNotes,
        blood_group_needed: bloodGroup !== 'Unknown' ? bloodGroup : undefined,
        latitude,
        longitude,
        location_address: locationAddress
      });

      if (res.incident) {
        onEmergencyCreated(res.incident);
        onClose();
      }
    } catch (err: any) {
      alert(`Emergency submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border-2 border-red-600/70 rounded-2xl w-full max-w-4xl shadow-2xl shadow-red-950/50 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 px-5 py-3 border-b border-red-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-900 animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                DISPATCH EMERGENCY AMBULANCE
              </h2>
              <p className="text-xs text-red-300">
                LIFELINK Rapid Intake — Instant Dispatch to Nearest ALS Fleet & Resource-Matched Hospital
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-red-950/40 border-b border-red-900/40 px-4 py-2 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>EMERGENCY NOTICE:</strong> For immediate life-threatening emergencies, contact official emergency services (108 / 112).
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-700 font-bold">
            DEMO MODE
          </span>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section 1: Patient Information */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-red-400" />
              1. Patient Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  min={1}
                  max={110}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Location Capture */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400" />
                2. Emergency Location
              </h3>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingGps}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-800/50 active:scale-95"
              >
                <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                {detectingGps ? 'Detecting GPS...' : 'Use Browser GPS'}
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Enter address or landmark in Nagpur"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              />

              {gpsError && (
                <p className="text-xs text-amber-400 font-medium">{gpsError}</p>
              )}

              {/* Quick Nagpur Landmark Selector */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Quick Select Nagpur Corridors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {NAGPUR_LOCATIONS.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectNagpurLocation(loc)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        locationAddress === loc.name
                          ? 'bg-red-900/50 text-red-200 border-red-600 font-bold'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {loc.name.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Type & Clinical Vitals */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-red-400" />
              3. Emergency Type & Clinical State
            </h3>

            {/* Emergency Type Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {[
                { type: 'Road Accident', icon: '🚗' },
                { type: 'Severe Bleeding', icon: '🩸' },
                { type: 'Cardiac Emergency', icon: '❤️' },
                { type: 'Breathing Difficulty', icon: '🫁' },
                { type: 'Trauma', icon: '⚡' },
                { type: 'Other', icon: '🏥' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setEmergencyType(item.type)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    emergencyType === item.type
                      ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-900/30 ring-2 ring-red-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.type}</span>
                </button>
              ))}
            </div>

            {/* Conscious State & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Patient Consciousness</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Conscious', 'Unconscious', 'Fluctuating'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setConsciousStatus(st)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        consciousStatus === st
                          ? 'bg-red-600 text-white border-red-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Known Blood Group (If Known)</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                >
                  <option value="O-">O- (Universal Donor)</option>
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="Unknown">Unknown (Auto-allocate Universal O-)</option>
                </select>
              </div>
            </div>

            {/* Symptoms Quick Checklist */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Symptoms Checklist</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Head Injury', 'Severe Bleeding', 'Fracture', 'Chest Pain', 
                  'Shortness of Breath', 'Seizures', 'Burns', 'Abdominal Pain'
                ].map((s) => {
                  const active = symptoms.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleToggleSymptom(s)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                        active
                          ? 'bg-red-600/30 text-red-200 border-red-500 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-red-400" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Additional On-Scene Notes</label>
              <textarea
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                placeholder="Describe scene details, vehicle type, vital signs if available..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Section 4: Real-time AI Triage Assistant */}
          <div className="bg-slate-950/70 border border-indigo-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  AI-Assisted Decision Support
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                CLINICAL TRIAGE MODEL
              </span>
            </div>

            {loadingTriage ? (
              <div className="text-xs text-slate-400 py-2">Analyzing emergency criteria...</div>
            ) : aiTriage ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Assessed Priority:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                    aiTriage.priority === 'CRITICAL' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-amber-600 text-white'
                  }`}>
                    {aiTriage.priority}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Extracted Clinical Requirements:</span>
                  <div className="flex flex-wrap gap-1">
                    {aiTriage.likely_requirements?.map((req: string, i: number) => (
                      <span key={i} className="text-[11px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 font-medium">
                        ✓ {req}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                  ⚠️ Disclaimer: AI-assisted decision support — not a medical diagnosis.
                </p>
              </div>
            ) : null}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-wide shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <AlertOctagon className="w-5 h-5" />
              <span>{submitting ? 'DISPATCHING AMBULANCE & MATCHING HOSPITALS...' : 'CONFIRM AMBULANCE REQUEST'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
