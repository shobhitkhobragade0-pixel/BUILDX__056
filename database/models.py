"""SQLite database models for Hospital Scheduler."""
import sqlite3
from datetime import datetime
from contextlib import contextmanager
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'hospital_scheduler.db')


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Initialize all tables."""
    with get_db() as conn:
        c = conn.cursor()

        # Admin (hardcoded check in app; this table for extensibility)
        c.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Patients
        c.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                phone TEXT,
                age INTEGER,
                blood_group TEXT,
                health_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Hospitals
        c.execute("""
            CREATE TABLE IF NOT EXISTS hospitals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                city TEXT DEFAULT 'Nagpur',
                hospital_type TEXT DEFAULT 'Government',
                latitude REAL,
                longitude REAL,
                phone TEXT,
                ambulance_available INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Lightweight migration for existing DBs (add hospital_type if missing)
        try:
            cols = [r["name"] for r in c.execute("PRAGMA table_info(hospitals)").fetchall()]
            if "hospital_type" not in cols:
                c.execute("ALTER TABLE hospitals ADD COLUMN hospital_type TEXT DEFAULT 'Government'")
            if "city" not in cols:
                c.execute("ALTER TABLE hospitals ADD COLUMN city TEXT DEFAULT 'Nagpur'")
            if "ambulance_available" not in cols:
                c.execute("ALTER TABLE hospitals ADD COLUMN ambulance_available INTEGER DEFAULT 1")
        except Exception:
            pass

        # Departments
        c.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                hospital_id INTEGER REFERENCES hospitals(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Doctors
        c.execute("""
            CREATE TABLE IF NOT EXISTS doctors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department_id INTEGER REFERENCES departments(id),
                hospital_id INTEGER REFERENCES hospitals(id),
                specialization TEXT,
                phone TEXT,
                consultation_fee REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Appointments & slots (simplified: slot = date + time)
        c.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER REFERENCES patients(id),
                doctor_id INTEGER REFERENCES doctors(id),
                department_id INTEGER REFERENCES departments(id),
                hospital_id INTEGER REFERENCES hospitals(id),
                slot_date DATE NOT NULL,
                slot_time TEXT NOT NULL,
                status TEXT DEFAULT 'scheduled',
                queue_position INTEGER,
                estimated_wait_minutes INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            )
        """)

        # Emergencies
        c.execute("""
            CREATE TABLE IF NOT EXISTS emergencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_name TEXT NOT NULL,
                description TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'HIGH',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Blood donors
        c.execute("""
            CREATE TABLE IF NOT EXISTS blood_donors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                blood_group TEXT NOT NULL,
                phone TEXT NOT NULL,
                location TEXT,
                latitude REAL,
                longitude REAL,
                last_donation_date DATE,
                available INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Health ID linked records (visit history, prescriptions, etc.)
        c.execute("""
            CREATE TABLE IF NOT EXISTS health_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER REFERENCES patients(id),
                record_type TEXT NOT NULL,
                title TEXT,
                content TEXT,
                doctor_notes TEXT,
                visit_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Doctor availability (per day slots)
        c.execute("""
            CREATE TABLE IF NOT EXISTS doctor_availability (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doctor_id INTEGER REFERENCES doctors(id),
                day_of_week INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                max_patients INTEGER DEFAULT 20,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()


def seed_sample_data():
    """Seed sample hospitals, departments, doctors, and one donor for demo."""
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM hospitals")
        hospitals_count = c.fetchone()[0]
        if hospitals_count == 0:
            c.execute("""
                INSERT INTO hospitals (name, address, city, hospital_type, latitude, longitude, phone, ambulance_available) VALUES
                ('Government Medical College and Hospital', 'Medical College Road, Nagpur', 'Nagpur', 'Government', 21.1458, 79.0882, '0712-2543171', 1),
                ('Mayo Hospital', 'Central Avenue, Nagpur', 'Nagpur', 'Government', 21.1469, 79.0835, '0712-2525112', 1),
                ('Indira Gandhi Government Medical College', 'Near Railway Station, Nagpur', 'Nagpur', 'Government', 21.1493, 79.0809, '0712-2701649', 1),
                ('Daga Hospital', 'Dharampeth, Nagpur', 'Nagpur', 'Government', 21.1528, 79.0924, '0712-2541406', 1),
                ('Lata Mangeshkar Hospital', 'Hingna Road, Nagpur', 'Nagpur', 'Government', 21.1256, 79.0956, '0712-2256789', 1),
                ('Seth Kesarimal Porwal College Hospital', 'Digambar Jain Chowk, Nagpur', 'Nagpur', 'Public', 21.1489, 79.0892, '0712-2725401', 1),
                ('Wockhardt Hospital', 'Jhansi Rani Square, Nagpur', 'Nagpur', 'Public', 21.1394, 79.0789, '0712-6666999', 1),
                ('Alexis Multispeciality Hospital', 'Wardha Road, Nagpur', 'Nagpur', 'Public', 21.1647, 79.0663, '0712-7112000', 1)
            """)
            c.execute("""
                INSERT INTO departments (name, hospital_id) VALUES
                ('General Medicine', 1), ('Cardiology', 1), ('Neurology', 1), ('Orthopedics', 1),
                ('General Medicine', 2), ('Pediatrics', 2), ('General Medicine', 3), ('Dermatology', 3),
                ('General Medicine', 4), ('Cardiology', 4), ('Neurology', 4), ('Orthopedics', 4),
                ('General Medicine', 5), ('Pediatrics', 5), ('General Medicine', 6), ('Dermatology', 6)
            """)
            c.execute("""
                INSERT INTO doctors (name, department_id, hospital_id, specialization, phone) VALUES
                ('Dr. Rajesh Kumar', 1, 1, 'General Physician', '9876543210'),
                ('Dr. Priya Sharma', 2, 1, 'Cardiologist', '9876543211'),
                ('Dr. Amit Singh', 3, 1, 'Neurologist', '9876543212'),
                ('Dr. Sneha Patel', 4, 1, 'Orthopedic', '9876543213'),
                ('Dr. Vikram Rao', 5, 2, 'General Physician', '9876543214'),
                ('Dr. Anjali Desai', 6, 2, 'Pediatrician', '9876543215'),
                ('Dr. Kiran Reddy', 7, 3, 'General Physician', '9876543216'),
                ('Dr. Meera Iyer', 8, 3, 'Dermatologist', '9876543217')
            """)
            # Availability: Mon-Fri 9-17 for each doctor
            for doc_id in range(1, 9):
                for day in range(1, 6):  # Mon=1 to Fri=5
                    c.execute("""
                        INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, max_patients)
                        VALUES (?, ?, '09:00', '17:00', 25)
                    """, (doc_id, day))

        # Seed donors even if hospitals already exist (expand cities)
        c.execute("SELECT COUNT(*) FROM blood_donors")
        donors_count = c.fetchone()[0]
        if donors_count < 20:
            c.execute("""
                INSERT INTO blood_donors (name, blood_group, phone, location, last_donation_date, available) VALUES
                ('Ramesh K', 'O+', '9123456780', 'Nagpur', '2024-01-15', 1),
                ('Sita M', 'A+', '9123456781', 'Nagpur', '2024-02-20', 1),
                ('Arun P', 'B+', '9123456782', 'Nagpur', '2024-03-01', 1),

                ('Neha S', 'AB+', '9123456790', 'Mumbai', '2024-02-10', 1),
                ('Imran A', 'O-', '9123456791', 'Mumbai', '2024-01-28', 1),
                ('Kavya R', 'B-', '9123456792', 'Mumbai', '2023-12-12', 0),

                ('Rahul D', 'A-', '9123456793', 'Delhi', '2024-02-05', 1),
                ('Pooja N', 'O+', '9123456794', 'Delhi', '2023-11-18', 1),
                ('Sandeep K', 'B+', '9123456795', 'Delhi', '2024-03-03', 1),

                ('Asha P', 'A+', '9123456796', 'Amravati', '2024-01-07', 1),
                ('Pratik M', 'O+', '9123456797', 'Amravati', '2023-12-30', 1),

                ('Tanvi J', 'AB-', '9123456798', 'Pune', '2024-02-25', 1),
                ('Rohit G', 'B+', '9123456799', 'Pune', '2024-01-20', 1),

                ('Manish V', 'A+', '9123456800', 'Aurangabad', '2024-02-01', 1),
                ('Seema T', 'O-', '9123456801', 'Aurangabad', '2023-10-14', 1),

                ('Ananya C', 'B-', '9123456802', 'Kolkata', '2024-02-14', 1),
                ('Debashis S', 'AB+', '9123456803', 'Kolkata', '2024-01-09', 1),

                ('Karthik R', 'O+', '9123456804', 'Chennai', '2024-02-18', 1),
                ('Meena L', 'A+', '9123456805', 'Chennai', '2023-12-05', 1)
            """)
        conn.commit()
