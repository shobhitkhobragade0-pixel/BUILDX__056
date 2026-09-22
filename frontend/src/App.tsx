import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { HospitalMatchingView } from './views/HospitalMatchingView';
import { BloodBankView } from './views/BloodBankView';
import { FamilyTrackingView } from './views/FamilyTrackingView';
import { ControlRoomDashboard } from './views/ControlRoomDashboard';
import { AmbulanceDashboard } from './views/AmbulanceDashboard';
import { HospitalConfirmationPortal } from './views/HospitalConfirmationPortal';
import { EmergencyRequestModal } from './views/EmergencyRequestModal';
import { RohanDemoModal } from './components/RohanDemo/RohanDemoModal';
import { getAllEmergencies, getAmbulances, getHospitals } from './services/api';
import { socket } from './services/socket';
import { UserRole, EmergencyIncident, Hospital, Ambulance } from './types';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('CITIZEN');
  const [activeView, setActiveView] = useState<string>('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isRohanDemoOpen, setIsRohanDemoOpen] = useState(false);

  // Global State
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeIncident, setActiveIncident] = useState<EmergencyIncident | null>(null);
  const [familyTrackingCode, setFamilyTrackingCode] = useState<string>('ROHAN-NAG-2026');

  // Load baseline data
  const loadInitialData = async () => {
    try {
      const [incRes, ambRes, hospRes] = await Promise.all([
        getAllEmergencies(),
        getAmbulances(),
        getHospitals()
      ]);
      setIncidents(incRes);
      setAmbulances(ambRes);
      setHospitals(hospRes);
      if (incRes.length > 0) {
        setActiveIncident(incRes[0]);
      }
    } catch (e) {
      console.error('Initial data load error:', e);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Global Socket.IO listener for notifications and live events
    socket.on('emergency:new', (inc: EmergencyIncident) => {
      setIncidents(prev => [inc, ...prev]);
      setActiveIncident(inc);
    });

    socket.on('emergency:updated', (inc: EmergencyIncident) => {
      setIncidents(prev => prev.map(item => item.id === inc.id ? inc : item));
      if (activeIncident?.id === inc.id) {
        setActiveIncident(inc);
      }
    });

    socket.on('demo:rohan:step', (data) => {
      if (data.incident) {
        setActiveIncident(data.incident);
        setFamilyTrackingCode(data.incident.tracking_code);
      }
    });

    return () => {
      socket.off('emergency:new');
      socket.off('emergency:updated');
      socket.off('demo:rohan:step');
    };
  }, [activeIncident]);

  // Handle role changes
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'AMBULANCE') {
      setActiveView('ambulance');
    } else if (role === 'HOSPITAL') {
      setActiveView('hospital');
    } else if (role === 'CONTROL_ROOM') {
      setActiveView('control_room');
    } else if (role === 'FAMILY') {
      setActiveView('family');
    } else {
      setActiveView('home');
    }
  };

  const handleEmergencyCreated = (incident: EmergencyIncident) => {
    setActiveIncident(incident);
    setFamilyTrackingCode(incident.tracking_code);
    setActiveView('matching'); // Navigate to hospital matching directly
  };

  const availableAmbulancesCount = ambulances.filter(a => a.status === 'AVAILABLE').length;
  const freeIcuBedsCount = hospitals.reduce((acc, h) => acc + (h.capacity?.icu_beds_available || 0), 0);
  const activeEmergenciesCount = incidents.filter(i => i.status !== 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenRohanDemo={() => setIsRohanDemoOpen(true)}
        activeEmergencyCount={activeEmergenciesCount}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'home' && (
          <HomeView
            onOpenSOS={() => setIsSOSOpen(true)}
            onOpenRohanDemo={() => setIsRohanDemoOpen(true)}
            onNavigate={setActiveView}
            activeEmergenciesCount={activeEmergenciesCount}
            availableAmbulancesCount={availableAmbulancesCount}
            freeIcuBedsCount={freeIcuBedsCount}
            activeIncident={activeIncident}
          />
        )}

        {activeView === 'matching' && (
          <HospitalMatchingView
            activeIncident={activeIncident}
            onHospitalConfirmed={() => setActiveView('family')}
          />
        )}

        {activeView === 'blood' && (
          <BloodBankView />
        )}

        {activeView === 'family' && (
          <FamilyTrackingView
            initialCode={familyTrackingCode}
          />
        )}

        {activeView === 'control_room' && (
          <ControlRoomDashboard />
        )}

        {activeView === 'ambulance' && (
          <AmbulanceDashboard />
        )}

        {activeView === 'hospital' && (
          <HospitalConfirmationPortal />
        )}
      </main>

      {/* Emergency Request Modal */}
      <EmergencyRequestModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onEmergencyCreated={handleEmergencyCreated}
      />

      {/* Rohan Demo 12-Step Modal */}
      <RohanDemoModal
        isOpen={isRohanDemoOpen}
        onClose={() => setIsRohanDemoOpen(false)}
        onSelectTrackingCode={(code) => {
          setFamilyTrackingCode(code);
          setActiveView('family');
        }}
      />

    </div>
  );
};

export default App;
