import React from 'react';
import { Shield, AlertCircle, Ambulance, Activity, HeartPulse, Building2, Radio, Users } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenSOS: () => void;
  onOpenRohanDemo: () => void;
  activeEmergencyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeView,
  onViewChange,
  onOpenSOS,
  onOpenRohanDemo,
  activeEmergencyCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Banner: Official Emergency Notice & Data Transparency */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            DEMO / SIMULATED DATA
          </span>
          <span>Nagpur Emergency Healthcare Coordination Network</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">Challenge Scenario: Wardha Road / Khapri Corridor</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-red-400 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Official 24/7 Helpline: 108 / 112
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div 
          onClick={() => onViewChange('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-900/30 border border-red-400/30 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white flex items-center">
                LIFELINK <span className="text-red-500 ml-1">NAGPUR</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide">
              Right Hospital. Right Resources. Right Now.
            </p>
          </div>
        </div>

        {/* View Shortcuts for Large Screens */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => onViewChange('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeView === 'home' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onViewChange('matching')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeView === 'matching' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
          >
            Hospital Matching
          </button>
          <button
            onClick={() => onViewChange('blood')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeView === 'blood' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
          >
            Blood Network
          </button>
          <button
            onClick={() => onViewChange('family')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeView === 'family' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
          >
            Family Tracking
          </button>
          <button
            onClick={() => onViewChange('control_room')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeView === 'control_room' ? 'bg-red-950/50 text-red-300 border border-red-800/40' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
          >
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            Control Room
          </button>
        </nav>

        {/* Actions & Role Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Rohan Emergency Demo Trigger */}
          <button
            onClick={onOpenRohanDemo}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-md shadow-amber-950/20 active:scale-95"
            title="Launch the 11:20 PM Wardha Road accident simulation"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            RUN ROHAN DEMO
          </button>

          {/* EMERGENCY AMBULANCE BUTTON */}
          <button
            onClick={onOpenSOS}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-black rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/40 border border-red-400/40 active:scale-95 transition-all"
          >
            <Ambulance className="w-4 h-4 animate-bounce" />
            <span>EMERGENCY SOS</span>
          </button>

          {/* Role Switcher */}
          <div className="relative group">
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-2 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer"
            >
              <option value="CITIZEN">Role: Citizen</option>
              <option value="FAMILY">Role: Family</option>
              <option value="AMBULANCE">Role: Ambulance Driver</option>
              <option value="HOSPITAL">Role: Hospital Admin</option>
              <option value="CONTROL_ROOM">Role: Control Room</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
