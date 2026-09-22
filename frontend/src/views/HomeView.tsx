import React from 'react';
import { 
  Ambulance, Building2, Droplet, Search, ShieldAlert, 
  ArrowRight, CheckCircle2, XCircle, HeartPulse, Clock, 
  Radio, Sparkles, AlertTriangle, Activity
} from 'lucide-react';
import { EmergencyIncident } from '../types';

interface HomeViewProps {
  onOpenSOS: () => void;
  onOpenRohanDemo: () => void;
  onNavigate: (view: string) => void;
  activeEmergenciesCount: number;
  availableAmbulancesCount: number;
  freeIcuBedsCount: number;
  activeIncident: EmergencyIncident | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenSOS,
  onOpenRohanDemo,
  onNavigate,
  activeEmergenciesCount,
  availableAmbulancesCount,
  freeIcuBedsCount,
  activeIncident
}) => {
  return (
    <div className="space-y-10 pb-12">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-10 sm:pt-10 sm:pb-16 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border-b border-slate-800">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          
          {/* Track Tag & Data Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-xs font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>Healthcare & Emergency Services Track</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-mono">DEMO / SIMULATED DATA</span>
          </div>

          {/* Main Title & Tagline */}
          <div className="space-y-3 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Emergency Healthcare Coordination <br className="hidden sm:inline" />
              for <span className="text-red-500 underline decoration-red-600/60 underline-offset-8">Nagpur</span>
            </h1>
            
            <p className="text-lg sm:text-xl font-extrabold text-amber-400 tracking-wide font-mono">
              "Right Hospital. Right Resources. Right Now."
            </p>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium">
              Connect ambulances, hospitals, specialists and blood resources through one coordinated emergency network — eliminating fatal inter-hospital transfer delays.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            
            {/* Immediate SOS CTA */}
            <button
              onClick={onOpenSOS}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base tracking-wide shadow-2xl shadow-red-900/50 border border-red-400/40 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] group"
            >
              <Ambulance className="w-6 h-6 animate-bounce" />
              <span>EMERGENCY AMBULANCE</span>
            </button>

            {/* Rohan Demo CTA */}
            <button
              onClick={onOpenRohanDemo}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-sm tracking-wide border border-amber-500/40 shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>RUN ROHAN EMERGENCY DEMO</span>
            </button>
          </div>

          {/* Secondary Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <button
              onClick={() => onNavigate('matching')}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Find Hospital</span>
            </button>
            <button
              onClick={() => onNavigate('blood')}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Droplet className="w-3.5 h-3.5 text-rose-400" />
              <span>Check Blood</span>
            </button>
            <button
              onClick={() => onNavigate('family')}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Track Emergency</span>
            </button>
            <button
              onClick={() => onNavigate('control_room')}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>Control Room</span>
            </button>
          </div>

        </div>
      </section>

      {/* Real-time Status Metric Counters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>ACTIVE EMERGENCIES</span>
              <Activity className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-black text-white mt-2 font-mono">
              {activeEmergenciesCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Live incidents monitored across Nagpur</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>AVAILABLE AMBULANCES</span>
              <Ambulance className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-400 mt-2 font-mono">
              {availableAmbulancesCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Khapri, MIHAN, Sitabuldi & GMCH posts</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>AVAILABLE ICU BEDS</span>
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
              {freeIcuBedsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across tertiary trauma hospitals</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>BLOOD NETWORK ALERT</span>
              <Droplet className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-400 mt-2 font-mono">
              O- / B- Ready
            </div>
            <p className="text-[11px] text-slate-400 mt-1">AIIMS & Jeevan Jyoti reserve active</p>
          </div>
        </div>
      </section>

      {/* The Challenge Solution: How LIFELINK Solves the Rohan Accident */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Solving Nagpur’s Emergency Coordination Crisis
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                The official challenge: The Rohan accident near Wardha Road / Khapri (11:20 PM)
              </p>
            </div>
          </div>

          {/* Contrast Grid: Without LIFELINK vs With LIFELINK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            
            {/* The Old / Broken Reality */}
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Without LIFELINK (Blind Proximity)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 font-bold">
                  DELAY: 50+ MINS
                </span>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">1.</span>
                  <span>Ambulance blindly rushes Rohan to the nearest nursing home on Wardha Road.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">2.</span>
                  <span>On arrival, the clinic has <strong>zero ICU beds</strong> and <strong>no neurosurgeon</strong> at midnight.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">3.</span>
                  <span>Paramedics scramble on phone calls while Rohan suffers acute cerebral edema.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">4.</span>
                  <span>Second ambulance journey loses the golden hour.</span>
                </li>
              </ul>
            </div>

            {/* With LIFELINK NAGPUR */}
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-5 space-y-3 ring-1 ring-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  With LIFELINK (Resource-Aware)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 font-bold">
                  TRANSIT: 8 MINS
                </span>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>AI triage detects head injury, femur fracture, arterial bleeding &rarr; flags Level 1 Trauma + ICU + Neurosurgeon.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>Matching engine instantly filters out inadequate clinics; selects <strong>AIIMS Nagpur (MIHAN)</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>AIIMS registrar receives pre-alert, reserves ICU Bed & prepares Red Resuscitation Bay.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">4.</span>
                  <span>Rohan arrives directly in surgical suite — zero transfer delay.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Interactive Demo Callout */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 text-xs">
            <div className="text-slate-400">
              Experience the step-by-step resolution of this exact scenario:
            </div>
            <button
              onClick={onOpenRohanDemo}
              className="py-2.5 px-5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Watch 12-Step Rohan Simulation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Safety Notice Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2 pt-6">
        <p>
          ⚠️ <strong>EMERGENCY NOTICE:</strong> For immediate life-threatening emergencies, contact official emergency services (108 / 112).
          LIFELINK NAGPUR prototype is simulated unless integrated with an authorized ambulance dispatch service.
        </p>
        <p className="font-mono text-[11px]">
          DATA LABELS: All records marked <span className="text-amber-400">DEMO / SIMULATED DATA</span>. No simulated information is represented as LIVE.
        </p>
      </footer>

    </div>
  );
};
