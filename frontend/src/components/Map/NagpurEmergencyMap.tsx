import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Hospital, Ambulance, EmergencyIncident, BloodBank } from '../../types';

interface NagpurMapProps {
  center?: [number, number];
  zoom?: number;
  hospitals?: Hospital[];
  ambulances?: Ambulance[];
  incident?: EmergencyIncident | null;
  bloodBanks?: BloodBank[];
  onSelectHospital?: (hospital: Hospital) => void;
  heightClass?: string;
  routeCoordinates?: [number, number][];
}

// Custom Leaflet DivIcons with pure CSS / SVG styling
function createIncidentIcon() {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-8 h-8 rounded-full bg-red-600/40 animate-ping"></span>
        <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-xl shadow-red-900 font-bold text-xs">
          🚨
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function createAmbulanceIcon(status: string) {
  const isEnRoute = status === 'EN_ROUTE_HOSPITAL' || status === 'ON_THE_WAY';
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${isEnRoute ? '<span class="absolute w-7 h-7 rounded-full bg-amber-400/50 animate-ping"></span>' : ''}
        <div class="w-7 h-7 rounded-lg bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 font-bold text-sm shadow-lg shadow-amber-950">
          🚑
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function createHospitalIcon(hospital: Hospital) {
  const isAccepting = hospital.emergency_status === 'ACCEPTING';
  const icuAvailable = hospital.capacity?.icu_beds_available ?? 0;
  const bgColor = isAccepting && icuAvailable > 0 ? 'bg-emerald-600' : 'bg-rose-700';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="flex flex-col items-center">
        <div class="px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${bgColor} border border-white/80 shadow-md flex items-center gap-1">
          <span>🏥</span>
          <span>ICU: ${icuAvailable}</span>
        </div>
        <div class="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
      </div>
    `,
    iconSize: [50, 30],
    iconAnchor: [25, 30]
  });
}

function createBloodBankIcon() {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="w-6 h-6 rounded-full bg-rose-900 border-2 border-rose-400 flex items-center justify-center text-rose-300 font-bold text-xs shadow-md">
        🩸
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

// Controller component to smoothly pan/zoom when focal points update
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const NagpurEmergencyMap: React.FC<NagpurMapProps> = ({
  center = [21.0850, 79.0600], // Centered around Nagpur / Wardha Road corridor
  zoom = 12,
  hospitals = [],
  ambulances = [],
  incident = null,
  bloodBanks = [],
  onSelectHospital,
  heightClass = 'h-[480px]',
  routeCoordinates = []
}) => {
  return (
    <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative`}>
      {/* Map Header Status Tag */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg shadow-lg text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-mono font-medium">Nagpur Emergency CAD Grid</span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapController center={center} zoom={zoom} />

        {/* High contrast dark emergency tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Emergency Incident Marker (Accident site) */}
        {incident && (
          <Marker
            position={[incident.latitude, incident.longitude]}
            icon={createIncidentIcon()}
          >
            <Popup className="emergency-popup">
              <div className="p-1 text-slate-900">
                <div className="font-bold text-red-600 flex items-center gap-1">
                  <span>🚨 EMERGENCY INCIDENT</span>
                </div>
                <div className="text-xs font-semibold mt-1">{incident.patient_name} ({incident.patient_age}y)</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{incident.location_address}</div>
                <div className="mt-1.5 inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 border border-red-300">
                  {incident.priority} — {incident.emergency_type}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ambulances */}
        {ambulances.map((amb) => (
          <Marker
            key={amb.id}
            position={[amb.latitude, amb.longitude]}
            icon={createAmbulanceIcon(amb.status)}
          >
            <Popup>
              <div className="p-1 text-slate-900">
                <div className="font-bold text-amber-600">🚑 Ambulance {amb.vehicle_number}</div>
                <div className="text-xs font-medium text-slate-700">Type: {amb.type} (ALS)</div>
                <div className="text-xs text-slate-600">Base: {amb.base_station}</div>
                <div className="text-xs text-slate-600">Driver: {amb.driver_name} ({amb.driver_phone})</div>
                <div className="mt-1 text-[11px] font-mono font-bold text-indigo-700">
                  Status: {amb.status.replace(/_/g, ' ')}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hospitals */}
        {hospitals.map((hosp) => (
          <Marker
            key={hosp.id}
            position={[hosp.latitude, hosp.longitude]}
            icon={createHospitalIcon(hosp)}
          >
            <Popup>
              <div className="p-1 text-slate-900 max-w-xs">
                <div className="font-bold text-slate-900 text-sm">{hosp.name}</div>
                <div className="text-xs text-slate-600">{hosp.address}</div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                  <div className="bg-slate-100 p-1 rounded font-medium">
                    ICU Beds: <span className="font-bold text-emerald-700">{hosp.capacity?.icu_beds_available ?? 0}</span>
                  </div>
                  <div className="bg-slate-100 p-1 rounded font-medium">
                    ER Beds: <span className="font-bold text-blue-700">{hosp.capacity?.er_beds_available ?? 0}</span>
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                  Trauma: {hosp.trauma_level} | Status: {hosp.emergency_status}
                </div>
                {onSelectHospital && (
                  <button
                    onClick={() => onSelectHospital(hosp)}
                    className="mt-2 w-full py-1 text-xs font-bold rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Select Hospital
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Blood Banks */}
        {bloodBanks.map((bb) => (
          <Marker
            key={bb.id}
            position={[bb.latitude, bb.longitude]}
            icon={createBloodBankIcon()}
          >
            <Popup>
              <div className="p-1 text-slate-900">
                <div className="font-bold text-rose-700">🩸 {bb.name}</div>
                <div className="text-xs text-slate-600">{bb.address}</div>
                <div className="text-xs font-mono text-slate-700 mt-1">Phone: {bb.phone}</div>
                <div className="mt-1 text-[10px] text-slate-500 font-mono">Source: {bb.source}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Line if connecting ambulance to scene or hospital */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#ef4444"
            weight={4}
            dashArray="6, 8"
          />
        )}
      </MapContainer>
    </div>
  );
};
