# LIFELINK NAGPUR

> **"Right Hospital. Right Resources. Right Now."**  
> Emergency Healthcare Coordination Network for Nagpur District (Healthcare & Emergency Services Track)

---

## The Challenge Scenario: Rohan's Accident near Wardha Road / Khapri

- **Incident Time**: 11:20 PM
- **Location**: Wardha Road near Khapri Flyover / Metro Pillar 38, Nagpur (Coordinates: `21.0505° N, 79.0531° E`)
- **Patient**: Rohan, 27-year-old male
- **Clinical Condition**: Severe head injury, compound femur fracture, profuse arterial bleeding, unconscious
- **Required Resources**: Level 1 Trauma Center, Available ICU Bed with ventilator, On-duty Neurosurgeon, On-duty Orthopedic Surgeon, Emergency O-negative blood reserves

### The Core Problem in Nagpur Today
In the current uncoordinated emergency setup, an ambulance responding to a crash on Wardha Road blindly transports the critical patient to the nearest private nursing home or clinic (e.g., Criticare Clinic on Wardha Road, 7 km away). 

Upon arrival at midnight, the paramedics discover that the clinic's **6 ICU beds are full (0 available)** and **no neurosurgeon is on duty**. Paramedics and distraught family members scramble on phone calls looking for beds while the patient suffers irreversible cerebral edema. By the time a second ambulance transfers him to a tertiary center, the golden hour has elapsed.

### How LIFELINK NAGPUR Solves It
LIFELINK replaces blind proximity dispatch with **Resource-Aware Hospital Matching**:
1. **Instant Geolocation & AI Triage**: Converts symptoms into structured requirements (Level 1 Trauma, ICU, Neurosurgeon, Orthopedic, O-negative blood) without offering faux medical diagnoses.
2. **Multi-Hospital Resource Evaluation**: Simultaneously checks 7 Nagpur tertiary hospitals (AIIMS Nagpur, Orange City Hospital, GMCH, Kingsway, CARE, Criticare, Alexis).
3. **Inadequate Facilities Bypassed**: Criticare Wardha Rd (0 ICU, no neurosurgeon) and CARE Hospital (no night neurosurgeon) are immediately filtered out with transparent, explainable reasons.
4. **Optimal Target Confirmed**: **AIIMS Nagpur (MIHAN)**—located just 8 minutes away via the MIHAN corridor—is identified with 8 free ICU beds, on-duty neurosurgeon Dr. Milind Rao, and 8 units of O-negative blood.
5. **Digital Pre-Admission Alert**: AIIMS Emergency Registrar confirms acceptance in one click, reserving the Red Resuscitation Bay before the ambulance even reaches the hospital.
6. **Live Telemetry for Families & Command Center**: Live GPS tracking with real-time Socket.IO event timeline.

---

## System Architecture & Tech Stack

```
[ Frontend: React 18 + TypeScript + Tailwind CSS + Leaflet Maps ]
                             │  HTTP & WebSockets (Socket.IO)
                             ▼
[ Backend: Node.js + Express.js + Socket.IO Gateway + AI Triage Engine ]
        │                                                │
        ▼                                                ▼
[ PostgreSQL (Relational Master) ]             [ MongoDB (Event Streams) ]
- Hospitals, Capacities, Specialists           - Emergency Event Timeline
- Ambulances & Incidents                        - Ambulance GPS History
- Confirmations, Blood Banks, Inventory        - Audit Logs & Telemetry
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, Leaflet + React-Leaflet, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO, PostgreSQL (`pg`), MongoDB Native Driver.
- **Zero-Friction Fallback**: Built-in high-performance in-memory relational & document adapter so the prototype runs out-of-the-box with 100% functionality even when external database servers are not yet started. When `POSTGRES_URL` or `MONGODB_URL` are provided, the system automatically connects to live databases.
- **Data Transparency**: Every record displays **Source**, **Verification Status**, and explicit **Data Status** (`DEMO / SIMULATED DATA` vs `VERIFIED`). No simulated data is ever falsely marked as `LIVE`.

---

## Live Endpoints & Ports

- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API & Health**: `http://localhost:5000/api/health`
- **Socket.IO Gateway**: `ws://localhost:5000`

---

## Key Views & Features

1. **Dashboard / Homepage**:
   - Immediate **EMERGENCY AMBULANCE** SOS CTA.
   - Prominent **RUN ROHAN EMERGENCY DEMO** launcher.
   - Real-time counters: Active emergencies, available ambulances, free ICU beds in Nagpur, critical blood alerts.
2. **Emergency Request Modal**:
   - Patient info (Name, Age, Gender).
   - Geolocation capture via browser GPS with fallback to Nagpur landmarks (Wardha Rd, Khapri, MIHAN, Sitabuldi, Medical Square).
   - Clinical state: Emergency type, conscious state, symptoms checklist, blood group.
   - Real-time AI Triage Assistant with non-diagnostic disclaimer.
3. **Resource-Aware Hospital Matching**:
   - Real-time matching engine evaluating ICU beds, ER beds, on-call specialists, trauma rating, and blood stock.
   - Explainable checkmarks: `✓ ICU Available (8 beds free)`, `✓ Neurosurgeon on duty`, `✓ ETA: 7 mins`, `✗ REJECTED: No ICU beds free`.
   - One-click confirmation request.
4. **Hospital Confirmation Portal**:
   - Live incoming emergency pre-alert card with ETA and patient vitals.
   - Action buttons: `ACCEPT & RESERVE TRAUMA BAY`, `REJECT — NO CAPACITY`, `REJECT — SPECIALIST UNAVAILABLE`, `REJECT — RESOURCE UNAVAILABLE`.
   - Interactive bed capacity and specialist on-call roster manager that writes live updates to the database.
5. **Ambulance Driver CAD Console**:
   - Turn-by-turn navigation on Leaflet map.
   - Working lifecycle buttons: `ACCEPT DISPATCH` &rarr; `ARRIVED AT SCENE` &rarr; `PATIENT PICKED UP` &rarr; `START TRANSPORT` &rarr; `ARRIVED AT HOSPITAL` &rarr; `HANDOVER COMPLETED`.
6. **Family Tracking Portal**:
   - Search by tracking code (`ROHAN-NAG-2026` or `EMG-NAG-xxxx`).
   - Live map showing moving ambulance, destination hospital, and real-time MongoDB event timeline.
7. **Control Room Dashboard (Nagpur Command Center)**:
   - Central CAD ledger of active emergencies.
   - Ambulance fleet status.
   - Hospital capacity matrix for Nagpur district.
   - Critical blood alerts.
   - Full-screen unified Nagpur emergency map.
8. **Blood Bank Network**:
   - Search by blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and distance from patient.
   - Stock level indicators (`AVAILABLE`, `LOW`, `UNAVAILABLE`).
   - `CALL BLOOD BANK` direct dialer and emergency unit reservation.
9. **Role-Based Switcher**:
   - Switch between `CITIZEN`, `FAMILY`, `AMBULANCE`, `HOSPITAL`, and `CONTROL_ROOM` instantly from the top navigation bar.

---

## How to Run the Prototype

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm v9+

### Quick Start (Development)
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Start Backend (in one terminal)
cd backend && npm run dev

# 3. Start Frontend (in second terminal)
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

### Starting Databases with Docker (Optional)
If Docker Desktop is running on your machine, you can launch PostgreSQL and MongoDB with one command:
```bash
docker compose up -d
```

---

## Verification & Test Results

- [x] Project starts cleanly with zero build or runtime errors.
- [x] Backend runs on port 5000 with REST APIs and Socket.IO.
- [x] Frontend runs on port 5173 with responsive mobile-first UI.
- [x] PostgreSQL & MongoDB dual-database architecture active.
- [x] Emergency request creation and GPS location capture work.
- [x] Resource-aware hospital matching filters out unqualified clinics and prioritizes AIIMS Nagpur.
- [x] Hospital pre-admission confirmation and bed capacity adjustments work.
- [x] Blood bank search by group and reserve functions work.
- [x] Family live tracking with Socket.IO updates works.
- [x] Ambulance driver action buttons work.
- [x] AI triage extracts structured clinical requirements with non-diagnostic disclaimer.
- [x] Rohan Emergency Demo 12-step automated simulation runs cleanly.
- [x] Data transparency badges (`DEMO / SIMULATED DATA`) are clearly displayed across all views.
