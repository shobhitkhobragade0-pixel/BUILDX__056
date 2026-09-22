import React, { useState, useEffect } from 'react';
import { 
  Droplet, Phone, Search, MapPin, CheckCircle2, 
  AlertTriangle, XCircle, ShieldCheck, Clock, Send
} from 'lucide-react';
import { getBloodBanks, reserveBloodUnits } from '../services/api';
import { BloodBank } from '../types';

export const BloodBankView: React.FC = () => {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('O-');
  const [loading, setLoading] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const fetchBanks = async () => {
    setLoading(true);
    try {
      // Default location near Khapri / Wardha Road (accident corridor)
      const data = await getBloodBanks(selectedGroup, 21.0505, 79.0531);
      setBloodBanks(data);
    } catch (err) {
      console.error('Failed to load blood banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, [selectedGroup]);

  const handleReserve = async (bankId: string, bankName: string) => {
    try {
      await reserveBloodUnits(bankId, selectedGroup, 1);
      setReserveSuccess(`1 Unit of ${selectedGroup} reserved at ${bankName}. Dispatched for trauma transfusion.`);
      fetchBanks();
      setTimeout(() => setReserveSuccess(null), 4000);
    } catch (err: any) {
      alert(`Reservation error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Droplet className="w-7 h-7 text-rose-500 fill-rose-500" />
              Nagpur Emergency Blood Inventory Network
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time availability of whole blood and packed red blood cells (PRBC) across Nagpur transfusion centers.
          </p>
        </div>

        {/* Data Disclaimer */}
        <div className="text-[11px] text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Integrated: e-Raktkosh & State Blood Transfusion Council
        </div>
      </div>

      {reserveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {reserveSuccess}
        </div>
      )}

      {/* Blood Group Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Select Required Blood Group:
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {BLOOD_GROUPS.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`py-3 rounded-xl font-black text-sm tracking-wide border transition-all flex flex-col items-center justify-center gap-1 ${
                selectedGroup === grp
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950/50 scale-105 ring-2 ring-rose-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-base">{grp}</span>
              {grp === 'O-' && <span className="text-[9px] font-normal uppercase text-rose-200">Universal</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Blood Banks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>CENTERS WITH {selectedGroup} STOCK ({bloodBanks.length})</span>
          <span className="font-mono">Sorted by Distance from Wardha Rd / Khapri</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
            Querying blood inventory nodes...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bloodBanks.map((bank) => {
              const item = bank.inventory?.find(i => i.blood_group === selectedGroup);
              const units = item?.units_available ?? 0;
              const status = item?.status ?? (units > 5 ? 'AVAILABLE' : units > 0 ? 'LOW' : 'UNAVAILABLE');

              return (
                <div
                  key={bank.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-white text-base leading-snug">{bank.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          {bank.address}
                        </p>
                      </div>

                      {bank.distance_km !== undefined && (
                        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 shrink-0">
                          {bank.distance_km} km
                        </span>
                      )}
                    </div>

                    {/* Stock Status Badge */}
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Units Available</span>
                        <span className="text-2xl font-black text-white font-mono">{units}</span>
                        <span className="text-xs text-slate-400 ml-1">Units of {selectedGroup}</span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                        status === 'AVAILABLE' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : status === 'LOW'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {status}
                      </span>
                    </div>

                    {/* Transparency info */}
                    <div className="text-[10px] text-slate-500 font-mono space-y-0.5 pt-1">
                      <div>Source: {bank.source}</div>
                      <div>Status: {bank.data_status}</div>
                      <div>Last Verified: {item?.last_verified_at ? new Date(item.last_verified_at).toLocaleTimeString() : 'Recent'}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <a
                      href={`tel:${bank.phone}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CALL BLOOD BANK</span>
                    </a>

                    {units > 0 && (
                      <button
                        onClick={() => handleReserve(bank.id, bank.name)}
                        className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
                        title="Reserve for emergency trauma bay"
                      >
                        <Send className="w-3 h-3" />
                        <span>RESERVE</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
