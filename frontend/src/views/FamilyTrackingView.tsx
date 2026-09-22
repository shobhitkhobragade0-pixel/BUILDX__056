import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldCheck, Clock, MapPin, Ambulance as AmbulanceIcon, 
  Building2, Phone, CheckCircle2, AlertCircle, HeartPulse, RefreshCw
} from 'lucide-react';
import { trackEmergency } from '../services/api';
import { socket } from '../services/socket';
import { NagpurEmergencyMap } from '../components/Map/NagpurEmergencyMap';
import { EmergencyIncident, EmergencyTimelineStep, Ambulance, Hospital } from '../types';

interface FamilyTrackingViewProps {
  initialCode?: string;
}

export const FamilyTrackingView: React.FC<FamilyTrackingViewProps> = ({
  initialCode = 'ROHAN-NAG-2026'
}) => {
  const [trackingCode, setTrackingCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [incident, setIncident] = useState<EmergencyIncident | null>(null);
  const [timeline, setTimeline] = useState<EmergencyTimelineStep[]>([]);
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);

  const fetchTracking = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const data = await trackEmergency(code);
      setIncident(data.incident);
      setTimeline(data.timeline || []);
      setAmbulance(data.ambulance);
      setHospital(data.hospital);
    } catch (err: any) {
      setError(err.message || 'Tracking record not found');
      setIncident(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking(trackingCode);
  }, []);

  // Socket.IO real-time updates for the tracked emergency
  useEffect(() => {
    if (!incident) return;

    const handleUpdate = (data: any) => {
      console.log('Realtime tracking update:', data);
      if (data.incident) setIncident(data.incident);
      if (data.ambulance) setAmbulance(data.ambulance);
      if (data.hospital) setHospital(data.hospital);
      // Re-fetch timeline
      trackEmergency(incident.tracking_code).then(d => {
        if (d.timeline) setTimeline(d.timeline);
      });
    };

    socket.on(`emergency:${incident.id}`, handleUpdate);
    socket.on('demo:rohan:step', (d) => {
      if (d.incident?.tracking_code === trackingCode) {
        setIncident(d.incident);
        if (d.timeline) setTimeline(d.timeline);
      }
    });

    return () => {
      socket.off(`emergency:${incident.id}`, handleUpdate);
      socket.off('demo:rohan:step');
    };
  }, [incident, trackingCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(trackingCode);
  };

  const routePoints: [number, number][] = [];
  if (ambulance) routePoints.push([ambulance.latitude, ambulance.longitude]);
  if (incident) routePoints.push([incident.latitude, incident.longitude]);
  if (hospital) routePoints.push([hospital.latitude, hospital.longitude]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-red-500" />
            Family Emergency Tracking Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time ambulance telemetry, clinical status, and destination hospital preparation.
          </p>
        </div>

        {/* Tracking Code Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="e.g. ROHAN-NAG-2026"
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 w-56"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Track</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setTrackingCode('ROHAN-NAG-2026');
              fetchTracking('ROHAN-NAG-2026');
            }}
            className="font-bold underline text-white"
          >
            Load Rohan Demo Incident
          </button>
        </div>
      )}

      {incident && (
        <div className="space-y-6">
          
          {/* Top Vitals & Status Summary Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">PATIENT IDENTIFIER</span>
                <span className="font-extrabold text-white text-base">
                  {incident.patient_name} ({incident.patient_age}y)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Priority: <strong className="text-red-400">{incident.priority}</strong>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-mono">EMERGENCY STATUS</span>
                <span className="inline-block mt-0.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {incident.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-mono">ASSIGNED AMBULANCE</span>
                <span className="font-bold text-white text-sm block mt-0.5">
                  {ambulance ? ambulance.vehicle_number : 'Dispatched'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Driver: {ambulance?.driver_name} ({ambulance?.driver_phone})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-mono">DESTINATION HOSPITAL</span>
                <span className="font-bold text-emerald-400 text-sm block mt-0.5">
                  {hospital ? hospital.name : 'AIIMS Nagpur (MIHAN)'}
                </span>
                <span className="text-[11px] text-emerald-300">
                  ✓ Trauma Center pre-notified
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid: Live Map & Live Event Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live GPS Telemetry Map */}
            <div className="lg:col-span-7">
              <NagpurEmergencyMap
                center={[incident.latitude, incident.longitude]}
                zoom={12}
                incident={incident}
                ambulances={ambulance ? [ambulance] : []}
                hospitals={hospital ? [hospital] : []}
                routeCoordinates={routePoints}
                heightClass="h-[460px]"
              />
            </div>

            {/* Real-time Timeline from MongoDB */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-red-500" />
                    Live Event Stream (MongoDB)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    SOCKET.IO LIVE
                  </span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{step.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Direct Support Helpline:</span>
                <a href="tel:108" className="font-bold text-red-400 hover:underline flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Dial 108
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
