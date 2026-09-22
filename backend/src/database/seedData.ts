import { Hospital, HospitalCapacity, HospitalSpecialist, BloodBank, BloodInventoryItem, Ambulance, User } from '../types/index.js';

export const SEED_USERS: User[] = [
  { id: 'usr-cit-1', name: 'Rohan Sharma', role: 'CITIZEN', email: 'rohan.sharma@example.com', phone: '+91 98230 11223', created_at: new Date().toISOString() },
  { id: 'usr-fam-1', name: 'Pooja Sharma (Sister)', role: 'FAMILY', email: 'pooja.s@example.com', phone: '+91 98230 44556', created_at: new Date().toISOString() },
  { id: 'usr-amb-1', name: 'Sachin Patil (Paramedic)', role: 'AMBULANCE', email: 'sachin.108@nagpur.gov.in', phone: '+91 97654 88990', created_at: new Date().toISOString() },
  { id: 'usr-hosp-1', name: 'AIIMS Emergency Registrar', role: 'HOSPITAL', email: 'emergency@aiimsnagpur.edu.in', phone: '+91 712 2811100', created_at: new Date().toISOString() },
  { id: 'usr-ctrl-1', name: 'Nagpur Control Room Officer', role: 'CONTROL_ROOM', email: 'dispatch@nagpuremergency.org', phone: '+91 712 2561108', created_at: new Date().toISOString() },
];

export const SEED_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-aiims',
    name: 'AIIMS Nagpur (Super Speciality & Trauma Center)',
    type: 'Central Government Institute of National Importance',
    address: 'Plot No. 2, Sector 20, MIHAN, Nagpur, Maharashtra 441108',
    latitude: 21.0601,
    longitude: 79.0275,
    phone: '+91 712 2811100',
    trauma_level: 'LEVEL_1',
    emergency_status: 'ACCEPTING',
    source: 'National Health Mission Nagpur / Live Hospital Registry',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'hosp-orange-city',
    name: 'Orange City Hospital & Research Institute (OCHRI)',
    type: 'Private Multi Super Speciality & Advanced Trauma Care',
    address: '19, Pandey Layout, Khamla Road, Nagpur, Maharashtra 440025',
    latitude: 21.1147,
    longitude: 79.0688,
    phone: '+91 712 2289999',
    trauma_level: 'LEVEL_1',
    emergency_status: 'ACCEPTING',
    source: 'OCHRI Hospital Information Management System',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: 'hosp-gmch',
    name: 'Government Medical College & Hospital (GMCH Nagpur)',
    type: 'Tertiary Government Teaching Hospital & Trauma Center',
    address: 'Hanuman Nagar, Medical Square, Nagpur, Maharashtra 440003',
    latitude: 21.1292,
    longitude: 79.0964,
    phone: '+91 712 2744400',
    trauma_level: 'LEVEL_1',
    emergency_status: 'ACCEPTING',
    source: 'Maharashtra Directorate of Medical Education (DMER)',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'hosp-kingsway',
    name: 'Kingsway Hospitals Nagpur',
    type: 'Tertiary Care Multispeciality & Surgical Center',
    address: '44, Kingsway Road, Near Kasturchand Park, Nagpur, 440001',
    latitude: 21.1554,
    longitude: 79.0882,
    phone: '+91 712 6667777',
    trauma_level: 'LEVEL_1',
    emergency_status: 'ACCEPTING',
    source: 'Kingsway Emergency Bed Board',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'hosp-care',
    name: 'CARE Hospitals Nagpur',
    type: 'Cardiac, Critical Care & General Hospital',
    address: '3, Farmland, Panchsheel Square, Wardha Road, Ramdaspeth, Nagpur, 440012',
    latitude: 21.1378,
    longitude: 79.0768,
    phone: '+91 712 3982222',
    trauma_level: 'LEVEL_2',
    emergency_status: 'LIMITED',
    source: 'CARE Clinical Bed Monitoring Feed',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'hosp-criticare-wardha',
    name: 'Wardha Road Emergency & Criticare Clinic',
    type: 'Private General Nursing Home (Level 3 / Non-Tertiary)',
    address: 'Near Chhatrapati Square, Wardha Road, Nagpur, 440015',
    latitude: 21.1082,
    longitude: 79.0631,
    phone: '+91 712 2248811',
    trauma_level: 'NONE',
    emergency_status: 'LIMITED',
    source: 'Clinic Self-Reported Portal',
    verification_status: 'SELF_REPORTED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'hosp-alexis',
    name: 'Max Super Speciality Hospital (Alexis)',
    type: 'Super Speciality Tertiary Hospital',
    address: 'Survey No. 232, Mankapur, Koradi Road, Nagpur, 440030',
    latitude: 21.1960,
    longitude: 79.0792,
    phone: '+91 712 7120000',
    trauma_level: 'LEVEL_2',
    emergency_status: 'ACCEPTING',
    source: 'Max Healthcare Central Bed Portal',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  }
];

export const SEED_CAPACITY: Record<string, HospitalCapacity> = {
  'hosp-aiims': {
    id: 'cap-aiims',
    hospital_id: 'hosp-aiims',
    icu_beds_total: 45,
    icu_beds_available: 8,
    er_beds_total: 30,
    er_beds_available: 12,
    ventilator_available: 14,
    updated_at: new Date().toISOString(),
    source: 'AIIMS Bed Dashboard API',
    verification_status: 'VERIFIED'
  },
  'hosp-orange-city': {
    id: 'cap-orange-city',
    hospital_id: 'hosp-orange-city',
    icu_beds_total: 28,
    icu_beds_available: 4,
    er_beds_total: 20,
    er_beds_available: 6,
    ventilator_available: 8,
    updated_at: new Date().toISOString(),
    source: 'OCHRI Real-time Bed Ledger',
    verification_status: 'VERIFIED'
  },
  'hosp-gmch': {
    id: 'cap-gmch',
    hospital_id: 'hosp-gmch',
    icu_beds_total: 60,
    icu_beds_available: 2,
    er_beds_total: 50,
    er_beds_available: 5,
    ventilator_available: 6,
    updated_at: new Date().toISOString(),
    source: 'GMCH Emergency Admission Desk',
    verification_status: 'VERIFIED'
  },
  'hosp-kingsway': {
    id: 'cap-kingsway',
    hospital_id: 'hosp-kingsway',
    icu_beds_total: 35,
    icu_beds_available: 7,
    er_beds_total: 25,
    er_beds_available: 9,
    ventilator_available: 11,
    updated_at: new Date().toISOString(),
    source: 'Kingsway ER Triage Desk',
    verification_status: 'VERIFIED'
  },
  'hosp-care': {
    id: 'cap-care',
    hospital_id: 'hosp-care',
    icu_beds_total: 24,
    icu_beds_available: 2,
    er_beds_total: 14,
    er_beds_available: 3,
    ventilator_available: 4,
    updated_at: new Date().toISOString(),
    source: 'CARE Hospital Bed Monitoring',
    verification_status: 'VERIFIED'
  },
  'hosp-criticare-wardha': {
    id: 'cap-criticare',
    hospital_id: 'hosp-criticare-wardha',
    icu_beds_total: 6,
    icu_beds_available: 0, // CRITICAL: ICU is FULL
    er_beds_total: 4,
    er_beds_available: 1,
    ventilator_available: 0,
    updated_at: new Date().toISOString(),
    source: 'Clinic Front Desk Entry',
    verification_status: 'SELF_REPORTED'
  },
  'hosp-alexis': {
    id: 'cap-alexis',
    hospital_id: 'hosp-alexis',
    icu_beds_total: 30,
    icu_beds_available: 9,
    er_beds_total: 18,
    er_beds_available: 8,
    ventilator_available: 10,
    updated_at: new Date().toISOString(),
    source: 'Max Central HIMS',
    verification_status: 'VERIFIED'
  }
};

export const SEED_SPECIALISTS: HospitalSpecialist[] = [
  // AIIMS Nagpur
  { id: 'spec-1', hospital_id: 'hosp-aiims', specialty: 'Neurosurgeon', doctor_name: 'Dr. Milind Rao (MS, MCh)', status: 'AVAILABLE', contact: '+91 712 2811101', updated_at: new Date().toISOString() },
  { id: 'spec-2', hospital_id: 'hosp-aiims', specialty: 'Orthopedic', doctor_name: 'Dr. Sunil Patil (MS Ortho)', status: 'AVAILABLE', contact: '+91 712 2811102', updated_at: new Date().toISOString() },
  { id: 'spec-3', hospital_id: 'hosp-aiims', specialty: 'Trauma Specialist', doctor_name: 'Dr. Priya Verma (FCPS Trauma)', status: 'AVAILABLE', contact: '+91 712 2811103', updated_at: new Date().toISOString() },
  { id: 'spec-4', hospital_id: 'hosp-aiims', specialty: 'Cardiologist', doctor_name: 'Dr. A. Sharma (DM Cardio)', status: 'ON CALL', contact: '+91 712 2811104', updated_at: new Date().toISOString() },

  // Orange City Hospital
  { id: 'spec-5', hospital_id: 'hosp-orange-city', specialty: 'Neurosurgeon', doctor_name: 'Dr. Rajesh Gupta (MCh Neuro)', status: 'ON CALL', contact: '+91 712 2289991', updated_at: new Date().toISOString() },
  { id: 'spec-6', hospital_id: 'hosp-orange-city', specialty: 'Orthopedic', doctor_name: 'Dr. S. Deshmukh (DNB Ortho)', status: 'AVAILABLE', contact: '+91 712 2289992', updated_at: new Date().toISOString() },
  { id: 'spec-7', hospital_id: 'hosp-orange-city', specialty: 'Trauma Specialist', doctor_name: 'Dr. Vivek Kulkarni', status: 'AVAILABLE', contact: '+91 712 2289993', updated_at: new Date().toISOString() },

  // GMCH Nagpur
  { id: 'spec-8', hospital_id: 'hosp-gmch', specialty: 'Neurosurgeon', doctor_name: 'Dr. K. Joshi (HOD Neurosurgery)', status: 'AVAILABLE', contact: '+91 712 2744401', updated_at: new Date().toISOString() },
  { id: 'spec-9', hospital_id: 'hosp-gmch', specialty: 'Orthopedic', doctor_name: 'Dr. M. Bhave (Assoc. Prof)', status: 'AVAILABLE', contact: '+91 712 2744402', updated_at: new Date().toISOString() },
  { id: 'spec-10', hospital_id: 'hosp-gmch', specialty: 'Trauma Specialist', doctor_name: 'Dr. Nitin Roy (Senior Resident)', status: 'AVAILABLE', contact: '+91 712 2744403', updated_at: new Date().toISOString() },

  // Kingsway Hospital
  { id: 'spec-11', hospital_id: 'hosp-kingsway', specialty: 'Neurosurgeon', doctor_name: 'Dr. Pradeep Agarwal', status: 'AVAILABLE', contact: '+91 712 6667771', updated_at: new Date().toISOString() },
  { id: 'spec-12', hospital_id: 'hosp-kingsway', specialty: 'Orthopedic', doctor_name: 'Dr. Tejas Kale', status: 'AVAILABLE', contact: '+91 712 6667772', updated_at: new Date().toISOString() },

  // CARE Hospital - NO Neurosurgeon tonight!
  { id: 'spec-13', hospital_id: 'hosp-care', specialty: 'Cardiologist', doctor_name: 'Dr. Rajiv Mehta (Chief Interventional)', status: 'AVAILABLE', contact: '+91 712 3982221', updated_at: new Date().toISOString() },
  { id: 'spec-14', hospital_id: 'hosp-care', specialty: 'Neurosurgeon', doctor_name: 'Dr. A. Gadkari', status: 'UNAVAILABLE', contact: '+91 712 3982222', updated_at: new Date().toISOString() },
  { id: 'spec-15', hospital_id: 'hosp-care', specialty: 'Trauma Specialist', doctor_name: 'Dr. D. Shinde', status: 'ON CALL', contact: '+91 712 3982223', updated_at: new Date().toISOString() },

  // Criticare Wardha Road Clinic - NO Specialist on duty!
  { id: 'spec-16', hospital_id: 'hosp-criticare-wardha', specialty: 'General Physician', doctor_name: 'Dr. S. Mohite (MBBS)', status: 'AVAILABLE', contact: '+91 712 2248812', updated_at: new Date().toISOString() },
  { id: 'spec-17', hospital_id: 'hosp-criticare-wardha', specialty: 'Neurosurgeon', doctor_name: 'None On Duty', status: 'UNAVAILABLE', contact: '', updated_at: new Date().toISOString() },
  { id: 'spec-18', hospital_id: 'hosp-criticare-wardha', specialty: 'Orthopedic', doctor_name: 'None On Duty', status: 'UNAVAILABLE', contact: '', updated_at: new Date().toISOString() },

  // Alexis / Max
  { id: 'spec-19', hospital_id: 'hosp-alexis', specialty: 'Neurosurgeon', doctor_name: 'Dr. Sanjay Khadse', status: 'AVAILABLE', contact: '+91 712 7120001', updated_at: new Date().toISOString() },
  { id: 'spec-20', hospital_id: 'hosp-alexis', specialty: 'Orthopedic', doctor_name: 'Dr. Amol Patil', status: 'AVAILABLE', contact: '+91 712 7120002', updated_at: new Date().toISOString() }
];

export const SEED_BLOOD_BANKS: BloodBank[] = [
  {
    id: 'bb-aiims',
    name: 'AIIMS Nagpur Central Blood Center',
    address: 'AIIMS Campus, Sector 20, MIHAN, Nagpur 441108',
    latitude: 21.0601,
    longitude: 79.0275,
    phone: '+91 712 2811190',
    source: 'e-Raktkosh National Portal',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: 'bb-jeevan-jyoti',
    name: 'Jeevan Jyoti Blood Center Nagpur',
    address: 'Central Bazar Road, Ramdaspeth, Nagpur 440010',
    latitude: 21.1390,
    longitude: 79.0745,
    phone: '+91 712 2422233',
    source: 'e-Raktkosh Maharashtra',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'bb-gmch',
    name: 'GMCH Regional Blood Transfusion Center',
    address: 'GMCH Campus, Medical Square, Nagpur 440003',
    latitude: 21.1292,
    longitude: 79.0964,
    phone: '+91 712 2744550',
    source: 'State Blood Transfusion Council (SBTC)',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 18 * 60 * 1000).toISOString()
  },
  {
    id: 'bb-hedgewar',
    name: 'Dr. Hedgewar Raktpedhi Blood Bank',
    address: 'Abhyankar Road, Dharampeth, Nagpur 440010',
    latitude: 21.1442,
    longitude: 79.0620,
    phone: '+91 712 2541112',
    source: 'Voluntary Blood Center Network',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'bb-daga',
    name: 'Daga Memorial Hospital Blood Bank',
    address: 'Gandhibagh, Itwari, Nagpur 440002',
    latitude: 21.1481,
    longitude: 79.1023,
    phone: '+91 712 2761899',
    source: 'Municipal Corporation Blood Registry',
    verification_status: 'VERIFIED',
    data_status: 'DEMO / SIMULATED DATA',
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }
];

export const SEED_BLOOD_INVENTORY: BloodInventoryItem[] = [
  // AIIMS Nagpur Blood Center
  { id: 'inv-aiims-O-', blood_bank_id: 'bb-aiims', blood_group: 'O-', units_available: 8, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-aiims-O+', blood_bank_id: 'bb-aiims', blood_group: 'O+', units_available: 24, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-aiims-A+', blood_bank_id: 'bb-aiims', blood_group: 'A+', units_available: 18, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-aiims-A-', blood_bank_id: 'bb-aiims', blood_group: 'A-', units_available: 4, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-aiims-B+', blood_bank_id: 'bb-aiims', blood_group: 'B+', units_available: 22, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-aiims-B-', blood_bank_id: 'bb-aiims', blood_group: 'B-', units_available: 6, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-aiims-AB+', blood_bank_id: 'bb-aiims', blood_group: 'AB+', units_available: 10, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-aiims-AB-', blood_bank_id: 'bb-aiims', blood_group: 'AB-', units_available: 3, status: 'LOW', last_verified_at: new Date().toISOString() },

  // Jeevan Jyoti
  { id: 'inv-jj-O-', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'O-', units_available: 3, status: 'LOW', last_verified_at: new Date().toISOString() },
  { id: 'inv-jj-O+', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'O+', units_available: 19, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-jj-B+', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'B+', units_available: 28, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-jj-B-', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'B-', units_available: 2, status: 'LOW', last_verified_at: new Date().toISOString() },
  { id: 'inv-jj-A+', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'A+', units_available: 15, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-jj-A-', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'A-', units_available: 1, status: 'LOW', last_verified_at: new Date().toISOString() },
  { id: 'inv-jj-AB+', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'AB+', units_available: 7, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-jj-AB-', blood_bank_id: 'bb-jeevan-jyoti', blood_group: 'AB-', units_available: 0, status: 'UNAVAILABLE', last_verified_at: new Date().toISOString() },

  // GMCH
  { id: 'inv-gmch-O-', blood_bank_id: 'bb-gmch', blood_group: 'O-', units_available: 5, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-gmch-O+', blood_bank_id: 'bb-gmch', blood_group: 'O+', units_available: 35, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-gmch-B+', blood_bank_id: 'bb-gmch', blood_group: 'B+', units_available: 30, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-gmch-A+', blood_bank_id: 'bb-gmch', blood_group: 'A+', units_available: 26, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },

  // Hedgewar
  { id: 'inv-hedg-O-', blood_bank_id: 'bb-hedgewar', blood_group: 'O-', units_available: 2, status: 'LOW', last_verified_at: new Date().toISOString() },
  { id: 'inv-hedg-O+', blood_bank_id: 'bb-hedgewar', blood_group: 'O+', units_available: 12, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-hedg-B+', blood_bank_id: 'bb-hedgewar', blood_group: 'B+', units_available: 14, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },

  // Daga Memorial
  { id: 'inv-daga-O-', blood_bank_id: 'bb-daga', blood_group: 'O-', units_available: 0, status: 'UNAVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-daga-O+', blood_bank_id: 'bb-daga', blood_group: 'O+', units_available: 16, status: 'AVAILABLE', last_verified_at: new Date().toISOString() },
  { id: 'inv-daga-B+', blood_bank_id: 'bb-daga', blood_group: 'B+', units_available: 11, status: 'AVAILABLE', last_verified_at: new Date().toISOString() }
];

export const SEED_AMBULANCES: Ambulance[] = [
  {
    id: 'amb-als-101',
    vehicle_number: 'MH-31-EM-1081',
    type: 'ALS',
    base_station: 'Khapri Toll Plaza / Wardha Road Station',
    latitude: 21.0530,
    longitude: 79.0510, // ~1.1 km from Rohan's accident location
    status: 'AVAILABLE',
    driver_name: 'Sachin Patil',
    driver_phone: '+91 97654 88990',
    current_incident_id: null,
    updated_at: new Date().toISOString(),
    source: 'Nagpur 108 Emergency Dispatch CAD',
    data_status: 'DEMO / SIMULATED DATA'
  },
  {
    id: 'amb-als-102',
    vehicle_number: 'MH-31-EM-1082',
    type: 'ALS',
    base_station: 'Chhatrapati Square Wardha Road',
    latitude: 21.1080,
    longitude: 79.0625,
    status: 'AVAILABLE',
    driver_name: 'Dinesh Wankhede',
    driver_phone: '+91 98223 77112',
    current_incident_id: null,
    updated_at: new Date().toISOString(),
    source: 'Nagpur 108 Emergency Dispatch CAD',
    data_status: 'DEMO / SIMULATED DATA'
  },
  {
    id: 'amb-bls-103',
    vehicle_number: 'MH-31-EM-2041',
    type: 'BLS',
    base_station: 'Medical Square GMCH Post',
    latitude: 21.1290,
    longitude: 79.0960,
    status: 'AVAILABLE',
    driver_name: 'Anil Meshram',
    driver_phone: '+91 94231 66554',
    current_incident_id: null,
    updated_at: new Date().toISOString(),
    source: 'Nagpur 108 Emergency Dispatch CAD',
    data_status: 'DEMO / SIMULATED DATA'
  },
  {
    id: 'amb-als-104',
    vehicle_number: 'MH-31-EM-1084',
    type: 'ALS',
    base_station: 'Khamla Ring Road Station',
    latitude: 21.1140,
    longitude: 79.0680,
    status: 'AVAILABLE',
    driver_name: 'Prakash Raut',
    driver_phone: '+91 98901 22334',
    current_incident_id: null,
    updated_at: new Date().toISOString(),
    source: 'Nagpur 108 Emergency Dispatch CAD',
    data_status: 'DEMO / SIMULATED DATA'
  },
  {
    id: 'amb-bls-105',
    vehicle_number: 'MH-31-EM-2045',
    type: 'BLS',
    base_station: 'Sitabuldi Interchange Post',
    latitude: 21.1450,
    longitude: 79.0830,
    status: 'AVAILABLE',
    driver_name: 'Ramesh Gawande',
    driver_phone: '+91 97643 11998',
    current_incident_id: null,
    updated_at: new Date().toISOString(),
    source: 'Nagpur 108 Emergency Dispatch CAD',
    data_status: 'DEMO / SIMULATED DATA'
  }
];
