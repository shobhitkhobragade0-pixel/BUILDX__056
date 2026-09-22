import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, X, Play, Pause, RotateCcw, CheckCircle2, 
  XCircle, Clock, MapPin, User, Stethoscope, ShieldAlert, ArrowRight, Ambulance
} from 'lucide-react';
import { initRohanDemo, triggerRohanStep } from '../../services/api';
import { EmergencyIncident, EmergencyTimelineStep } from '../../types';

interface RohanDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrackingCode?: (code: string) => void;
}

const DEMO_STEPS = [
  { step: 1, title: 'Emergency SOS Triggered', subtitle: 'Crash detected at Wardha Road / Khapri (11:20 PM)' },
  { step: 2, title: 'Ambulance Requested', subtitle: 'Nagpur 108 Emergency Dispatch CAD receives alert' },
  { step: 3, title: 'Ambulance Assigned', subtitle: 'Khapri Toll ALS Ambulance MH-31-EM-1081 dispatched' },
  { step: 4, title: 'Hospitals Evaluated', subtitle: 'Scanning all Nagpur hospitals for ICU + Neurosurgeon + Blood' },
  { step: 5, title: 'Inadequate Hospitals Rejected', subtitle: 'Criticare Wardha Rd (0 ICU) & CARE (No Neuro) bypassed' },
  { step: 6, title: 'Optimal Hospital Matched', subtitle: 'AIIMS Nagpur matched: Level 1 Trauma + Neuro + O-ve blood' },
  { step: 7, title: 'Pre-Alert Sent to AIIMS', subtitle: 'Emergency Registrar receives incoming vitals and requirements' },
  { step: 8, title: 'AIIMS Confirms & Reserves Bed', subtitle: 'Red Trauma Bay & ICU Bed locked for Rohan' },
  { step: 9, title: 'Ambulance Locked to AIIMS', subtitle: 'Driver navigation routes directly to AIIMS via MIHAN corridor' },
  { step: 10, title: 'Family Tracking Online', subtitle: 'Live tracking portal shared with family (Code: ROHAN-NAG-2026)' },
  { step: 11, title: 'Hospital 2-Min Pre-Alert', subtitle: 'Trauma team prepped; blood units transferred to resuscitation bay' },
  { step: 12, title: 'Patient Safely Admitted', subtitle: 'Zero delay handover: Rohan admitted directly to surgical bay' }
];

export const RohanDemoModal: React.FC<RohanDemoModalProps> = ({
  isOpen,
  onClose,
  onSelectTrackingCode
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [incident, setIncident] = useState<EmergencyIncident | null>(null);
  const [timeline, setTimeline] = useState<EmergencyTimelineStep[]>([]);

  // Initialize demo on open
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStep < 12) {
      timer = setTimeout(() => {
        handleStepChange(currentStep + 1);
      }, 3000);
    } else if (currentStep >= 12) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const handleReset = async () => {
    setLoading(true);
    setIsPlaying(false);
    setCurrentStep(1);
    try {
      const res = await initRohanDemo();
      setIncident(res.incident);
    } catch (err) {
      console.error('Failed to init Rohan demo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStepChange = async (stepNum: number) => {
    if (stepNum < 1 || stepNum > 12) return;
    setLoading(true);
    setCurrentStep(stepNum);
    try {
      const res = await triggerRohanStep(stepNum);
      if (res.incident) setIncident(res.incident);
      if (res.timeline) setTimeline(res.timeline);
    } catch (err) {
      console.error(`Failed to trigger step ${stepNum}:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  ROHAN EMERGENCY DEMO SCENARIO
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEMO MODE — SIMULATED DATA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Hackathon Challenge: Preventing fatal transfer delays in the Wardha Road / Khapri accident
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

        {/* Victim & Incident Overview Card */}
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border-b border-slate-800 p-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">TIME OF CRASH</span>
                <span className="font-bold text-white font-mono">11:20 PM (Night)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">LOCATION</span>
                <span className="font-bold text-white">Wardha Rd, Khapri</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT</span>
                <span className="font-bold text-white">Rohan, 27M (Unconscious)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">REQUIRED RESOURCES</span>
                <span className="font-bold text-slate-200">ICU Bed + Neurosurgeon + Orthopedic + O- Blood</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body: Two Columns */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: 12-Step Visual Flow */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span>Coordination Timeline</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  Step {currentStep} of 12
                </span>
              </h3>

              {/* Player Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                    isPlaying 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30' 
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Auto Play'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(currentStep / 12) * 100}%` }}
              ></div>
            </div>

            {/* Step Items List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {DEMO_STEPS.map((item) => {
                const isCurrent = currentStep === item.step;
                const isPast = currentStep > item.step;

                return (
                  <div
                    key={item.step}
                    onClick={() => handleStepChange(item.step)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isCurrent
                        ? 'bg-slate-800/90 border-red-500/70 shadow-lg shadow-red-950/20 ring-1 ring-red-500/30'
                        : isPast
                        ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/50 text-slate-600'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-[10px] animate-pulse">
                          {item.step}
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                          {item.step}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isCurrent ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-500'}`}>
                          {item.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Key Problem Solved & Resource Intelligence */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              LIFELINK Intelligent Matching
            </h3>

            {/* Why Nearest Clinic is Bypassed */}
            <div className={`p-4 rounded-xl border transition-all ${
              currentStep >= 5 
                ? 'bg-rose-950/30 border-rose-800/60' 
                : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Bypassed: Wardha Rd Criticare (7 km)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-700">
                  REJECTED
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5">
                Blind proximity dispatch would take Rohan here:
              </p>
              <div className="mt-2 space-y-1 text-[11px]">
                <div className="text-rose-400 flex items-center gap-1 font-medium">
                  ✗ 0 ICU Beds Available (Full capacity)
                </div>
                <div className="text-rose-400 flex items-center gap-1 font-medium">
                  ✗ No Neurosurgeon on duty at midnight
                </div>
              </div>
              <div className="mt-2 p-2 rounded bg-rose-900/20 text-[10px] text-rose-300 font-semibold border border-rose-800/40">
                ⚠️ Delay Avoided: Eliminates 45-60 min secondary inter-hospital transfer!
              </div>
            </div>

            {/* Why AIIMS Nagpur is Selected */}
            <div className={`p-4 rounded-xl border transition-all flex-1 ${
              currentStep >= 6
                ? 'bg-emerald-950/30 border-emerald-800/60 ring-1 ring-emerald-500/20'
                : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Target: AIIMS Nagpur (MIHAN)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700">
                  MATCHED & CONFIRMED
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5">
                Only 8 mins away via MIHAN flyover with full trauma capabilities:
              </p>
              <div className="mt-2 space-y-1 text-[11px]">
                <div className="text-emerald-400 flex items-center gap-1 font-medium">
                  ✓ Level 1 Trauma Resuscitation Bay ready
                </div>
                <div className="text-emerald-400 flex items-center gap-1 font-medium">
                  ✓ 8 ICU Beds Free with ventilators
                </div>
                <div className="text-emerald-400 flex items-center gap-1 font-medium">
                  ✓ Dr. Milind Rao (Neurosurgeon) on duty
                </div>
                <div className="text-emerald-400 flex items-center gap-1 font-medium">
                  ✓ 8 Units O-negative blood available on site
                </div>
              </div>

              {currentStep >= 8 && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-900/30 border border-emerald-700/50 text-[11px] text-emerald-200">
                  <span className="font-bold block">Digital Pre-Admission Alert Sent:</span>
                  Trauma Bay prepped, CT scanner standby, blood cross-match pre-initiated.
                </div>
              )}
            </div>

            {/* Quick Action to Open Tracking */}
            {currentStep >= 10 && onSelectTrackingCode && (
              <button
                onClick={() => {
                  onSelectTrackingCode('ROHAN-NAG-2026');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 transition-all active:scale-95"
              >
                <span>Track Rohan Live in Family Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>Tracking Code:</span>
            <span className="font-bold text-red-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              ROHAN-NAG-2026
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepChange(currentStep - 1)}
              disabled={currentStep <= 1 || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              disabled={currentStep >= 12 || loading}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-950"
            >
              Next Step &rarr;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
