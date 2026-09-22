"""
Arogya Sampark
AI-Powered Government Hospital Check-up Scheduler (Flask backend)
"""
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
import hashlib
from datetime import datetime, date, timedelta
from functools import wraps
from flask import (
    Flask, render_template, request, jsonify, redirect, url_for,
    session, flash
)
from database.models import get_db, init_db, seed_sample_data

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
app.config["GEMINI_API_KEY"] = os.environ.get("GEMINI_API_KEY", "")

# Admin credentials (in production use env or hashed DB)
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")


def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()


def login_required(f):
    @wraps(f)
    def inner(*args, **kwargs):
        if not session.get("patient_id"):
            if request.is_json or request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return jsonify({"error": "Login required"}), 401
            return redirect(url_for("patient_login"))
        return f(*args, **kwargs)
    return inner


def admin_required(f):
    @wraps(f)
    def inner(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return inner


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/home")
def patient_home():
    return render_template("patient/home.html")


# ---------- Emergency ----------
@app.route("/api/emergency", methods=["POST"])
def api_emergency():
    data = request.get_json() or {}
    name = data.get("patient_name", "").strip()
    description = data.get("description", "").strip()
    lat = data.get("latitude")
    lng = data.get("longitude")
    if not name or not description:
        return jsonify({"success": False, "error": "Name and description required"}), 400
    with get_db() as conn:
        conn.execute(
            """INSERT INTO emergencies (patient_name, description, latitude, longitude, status, priority)
               VALUES (?, ?, ?, ?, 'pending', 'HIGH')""",
            (name, description, lat, lng)
        )
    return jsonify({"success": True, "message": "Emergency reported. Help is on the way."})


# ---------- Hospitals list (for booking dropdown) ----------
@app.route("/api/hospitals")
def api_hospitals():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, name, address, phone, hospital_type FROM hospitals WHERE hospital_type IN ('Government','Public') ORDER BY name"
        ).fetchall()
    return jsonify({"hospitals": [dict(r) for r in rows]})


# ---------- Location & nearest hospitals ----------
@app.route("/api/hospitals/nearby", methods=["POST"])
def api_nearby_hospitals():
    data = request.get_json() or {}
    lat = data.get("latitude")
    lng = data.get("longitude")
    if lat is None or lng is None:
        return jsonify({"error": "Latitude and longitude required"}), 400
    with get_db() as conn:
        rows = conn.execute(
            """SELECT id, name, address, city, hospital_type, latitude, longitude, phone, ambulance_available
               FROM hospitals
               WHERE city = 'Nagpur' AND hospital_type IN ('Government','Public')"""
        ).fetchall()
    hospitals = []
    for r in rows:
        d = dict(r)
        # Calculate distance using Haversine formula approximation
        if d.get("latitude") and d.get("longitude"):
            dlat = (d.get("latitude") or 0) - lat
            dlng = (d.get("longitude") or 0) - lng
            dist_km = round((dlat**2 + dlng**2) ** 0.5 * 111, 2)
            d["distance_km"] = dist_km
            
            # Calculate ambulance ETA (assuming 30 km/h average speed in city)
            eta_minutes = max(5, round((dist_km / 30) * 60))  # Minimum 5 minutes
            d["ambulance_eta"] = f"{eta_minutes} min"
        else:
            d["distance_km"] = None
            d["ambulance_eta"] = "N/A"
        
        hospitals.append(d)
    
    # Sort by distance (nearest first)
    hospitals.sort(key=lambda x: x.get("distance_km", float('inf')))
    
    # Attach doctors count per hospital
    with get_db() as conn:
        for h in hospitals:
            count = conn.execute(
                "SELECT COUNT(*) FROM doctors WHERE hospital_id = ?", (h["id"],)
            ).fetchone()[0]
            h["doctors_count"] = count
    return jsonify({"hospitals": hospitals})


# ---------- AI: Chatbot ----------
@app.route("/api/ai/chat", methods=["POST"])
def api_ai_chat():
    from ai.gemini_client import chatbot_response
    data = request.get_json() or {}
    msg = (data.get("message") or "").strip()
    if not msg:
        return jsonify({"reply": "Please enter a message."})
    reply = chatbot_response(msg)
    return jsonify({"reply": reply})


# ---------- AI: Disease risk prediction ----------
@app.route("/api/ai/disease-prediction", methods=["POST"])
def api_disease_prediction():
    from ai.gemini_client import disease_risk_prediction
    data = request.get_json() or {}
    symptoms = (data.get("symptoms") or "").strip()
    age = int(data.get("age") or 0)
    medical_history = (data.get("medical_history") or "").strip()
    if not symptoms:
        return jsonify({"error": "Symptoms required"}), 400
    result = disease_risk_prediction(symptoms, age, medical_history)
    return jsonify(result)


# ---------- Patient auth ----------
@app.route("/patient/register", methods=["GET", "POST"])
def patient_register():
    if request.method == "GET":
        return render_template("patient/register.html")
    email = (request.form.get("email") or "").strip()
    password = request.form.get("password") or ""
    name = (request.form.get("name") or "").strip()
    phone = (request.form.get("phone") or "").strip()
    if not email or not password or not name:
        flash("Name, email and password are required.")
        return redirect(url_for("patient_register"))
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM patients WHERE email = ?", (email,)).fetchone()
        if existing:
            flash("Email already registered.")
            return redirect(url_for("patient_register"))
        conn.execute(
            """INSERT INTO patients (name, email, password_hash, phone) VALUES (?, ?, ?, ?)""",
            (name, email, hash_password(password), phone)
        )
    flash("Registration successful. Please login.")
    return redirect(url_for("patient_login"))


@app.route("/patient/login", methods=["GET", "POST"])
def patient_login():
    if request.method == "GET":
        return render_template("patient/login.html")
    email = (request.form.get("email") or "").strip()
    password = request.form.get("password") or ""
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, name FROM patients WHERE email = ? AND password_hash = ?",
            (email, hash_password(password))
        ).fetchone()
    if not row:
        flash("Invalid email or password.")
        return redirect(url_for("patient_login"))
    session["patient_id"] = row["id"]
    session["patient_name"] = row["name"]
    return redirect(url_for("patient_dashboard"))


@app.route("/patient/logout")
def patient_logout():
    session.clear()
    return redirect(url_for("index"))


@app.route("/patient/dashboard")
@login_required
def patient_dashboard():
    return render_template("patient/dashboard.html")


# ---------- Appointments ----------
@app.route("/api/departments")
def api_departments():
    hospital_id = request.args.get("hospital_id", type=int)
    with get_db() as conn:
        if hospital_id:
            rows = conn.execute(
                """SELECT d.id, d.name, d.hospital_id FROM departments d WHERE d.hospital_id = ?""",
                (hospital_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT d.id, d.name, d.hospital_id FROM departments d"""
            ).fetchall()
    return jsonify({"departments": [dict(r) for r in rows]})


@app.route("/api/doctors")
def api_doctors():
    department_id = request.args.get("department_id", type=int)
    hospital_id = request.args.get("hospital_id", type=int)
    with get_db() as conn:
        q = """SELECT id, name, department_id, hospital_id, specialization, phone
               FROM doctors WHERE 1=1"""
        params = []
        if department_id:
            q += " AND department_id = ?"
            params.append(department_id)
        if hospital_id:
            q += " AND hospital_id = ?"
            params.append(hospital_id)
        rows = conn.execute(q, params).fetchall()
    return jsonify({"doctors": [dict(r) for r in rows]})


def _slots_for_doctor(conn, doctor_id, from_date, days=7):
    """Return list of {date, time} for next days (simplified 9-17 hourly)."""
    slots = []
    for d in range(days):
        dt = from_date + timedelta(days=d)
        dow = dt.isoweekday()  # Mon=1
        avail = conn.execute(
            """SELECT start_time, end_time, max_patients FROM doctor_availability
               WHERE doctor_id = ? AND day_of_week = ?""",
            (doctor_id, dow)
        ).fetchone()
        if not avail:
            continue
        start = avail["start_time"]
        end = avail["end_time"]
        # Parse HH:MM and generate hourly slots
        def to_min(s):
            p = s.split(":")
            return int(p[0]) * 60 + int(p[1]) if len(p) >= 2 else 0
        start_m = to_min(start)
        end_m = to_min(end)
        for m in range(start_m, end_m, 60):
            h, mi = divmod(m, 60)
            time_str = f"{h:02d}:{mi:02d}"
            slots.append({"date": dt.isoformat(), "time": time_str})
    return slots


@app.route("/api/doctors/<int:doctor_id>/slots")
def api_doctor_slots(doctor_id):
    from_date = date.today()
    with get_db() as conn:
        slots = _slots_for_doctor(conn, doctor_id, from_date)
        # Mark booked slots
        for s in slots:
            existing = conn.execute(
                """SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status = 'scheduled'""",
                (doctor_id, s["date"], s["time"])
            ).fetchone()
            s["available"] = existing is None
        queue_count = conn.execute(
            """SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND slot_date >= ? AND status = 'scheduled'""",
            (doctor_id, from_date.isoformat())
        ).fetchone()[0]
    return jsonify({"slots": slots, "queue_size": queue_count})


@app.route("/api/appointments", methods=["GET", "POST"])
@login_required
def api_appointments():
    if request.method == "GET":
        pid = session["patient_id"]
        with get_db() as conn:
            rows = conn.execute(
                """SELECT a.id, a.slot_date, a.slot_time, a.status, a.queue_position, a.estimated_wait_minutes,
                          d.name as doctor_name, dep.name as department_name, h.name as hospital_name
                   FROM appointments a
                   JOIN doctors d ON a.doctor_id = d.id
                   JOIN departments dep ON a.department_id = dep.id
                   JOIN hospitals h ON a.hospital_id = h.id
                   WHERE a.patient_id = ? ORDER BY a.slot_date, a.slot_time""",
                (pid,)
            ).fetchall()
        return jsonify({"appointments": [dict(r) for r in rows]})
    # POST: book
    data = request.get_json() or {}
    doctor_id = data.get("doctor_id")
    slot_date = data.get("slot_date")
    slot_time = data.get("slot_time")
    if not all([doctor_id, slot_date, slot_time]):
        return jsonify({"success": False, "error": "doctor_id, slot_date, slot_time required"}), 400
    with get_db() as conn:
        doc = conn.execute("SELECT id, department_id, hospital_id FROM doctors WHERE id = ?", (doctor_id,)).fetchone()
        if not doc:
            return jsonify({"success": False, "error": "Doctor not found"}), 404
        existing = conn.execute(
            """SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status = 'scheduled'""",
            (doctor_id, slot_date, slot_time)
        ).fetchone()
        if existing:
            return jsonify({"success": False, "error": "Slot already booked"}), 400
        queue = conn.execute(
            """SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND slot_date = ? AND status = 'scheduled'""",
            (doctor_id, slot_date)
        ).fetchone()[0]
        wait = min(30 + queue * 15, 180)
        conn.execute(
            """INSERT INTO appointments (patient_id, doctor_id, department_id, hospital_id, slot_date, slot_time, status, queue_position, estimated_wait_minutes)
               VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)""",
            (session["patient_id"], doctor_id, doc["department_id"], doc["hospital_id"], slot_date, slot_time, queue + 1, wait)
        )
    return jsonify({"success": True, "message": "Appointment booked."})


@app.route("/api/appointments/<int:aid>/cancel", methods=["POST"])
@login_required
def api_appointment_cancel(aid):
    with get_db() as conn:
        row = conn.execute("SELECT id FROM appointments WHERE id = ? AND patient_id = ?", (aid, session["patient_id"])).fetchone()
        if not row:
            return jsonify({"success": False, "error": "Appointment not found"}), 404
        conn.execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", (aid,))
    return jsonify({"success": True})


@app.route("/api/appointments/<int:aid>/reschedule", methods=["POST"])
@login_required
def api_appointment_reschedule(aid):
    data = request.get_json() or {}
    new_date = data.get("slot_date")
    new_time = data.get("slot_time")
    if not new_date or not new_time:
        return jsonify({"success": False, "error": "slot_date and slot_time required"}), 400
    with get_db() as conn:
        row = conn.execute("SELECT id, doctor_id FROM appointments WHERE id = ? AND patient_id = ? AND status = 'scheduled'", (aid, session["patient_id"])).fetchone()
        if not row:
            return jsonify({"success": False, "error": "Appointment not found"}), 404
        existing = conn.execute(
            """SELECT id FROM appointments WHERE doctor_id = ? AND slot_date = ? AND slot_time = ? AND status = 'scheduled'""",
            (row["doctor_id"], new_date, new_time)
        ).fetchone()
        if existing:
            return jsonify({"success": False, "error": "New slot already taken"}), 400
        conn.execute("UPDATE appointments SET slot_date = ?, slot_time = ? WHERE id = ?", (new_date, new_time, aid))
    return jsonify({"success": True})


# ---------- Blood donor search ----------
@app.route("/api/blood-donors")
def api_blood_donors():
    blood_group = request.args.get("blood_group", "").strip()
    location = request.args.get("location", "").strip()
    available = request.args.get("available")
    with get_db() as conn:
        q = "SELECT id, name, blood_group, phone, location, last_donation_date, available FROM blood_donors WHERE 1=1"
        params = []
        if blood_group:
            q += " AND blood_group = ?"
            params.append(blood_group)
        if location:
            q += " AND (location LIKE ? OR location = ?)"
            params.extend([f"%{location}%", location])
        if available is not None and available != "":
            q += " AND available = ?"
            params.append(1 if str(available).lower() in ("1", "true", "yes") else 0)
        rows = conn.execute(q, params).fetchall()
    return jsonify({"donors": [dict(r) for r in rows]})


# ---------- Health ID / records ----------
@app.route("/api/patient/health-id", methods=["GET", "POST"])
@login_required
def api_health_id():
    if request.method == "POST":
        data = request.get_json() or {}
        health_id = (data.get("health_id") or "").strip()
        with get_db() as conn:
            conn.execute("UPDATE patients SET health_id = ? WHERE id = ?", (health_id, session["patient_id"]))
        return jsonify({"success": True})
    with get_db() as conn:
        row = conn.execute("SELECT health_id FROM patients WHERE id = ?", (session["patient_id"],)).fetchone()
    return jsonify({"health_id": row["health_id"] if row else None})


@app.route("/api/patient/health-records")
@login_required
def api_health_records():
    with get_db() as conn:
        rows = conn.execute(
            """SELECT id, record_type, title, content, doctor_notes,
                      COALESCE(visit_date, substr(created_at, 1, 10)) as visit_date,
                      created_at
               FROM health_records
               WHERE patient_id = ?
               ORDER BY visit_date DESC, created_at DESC""",
            (session["patient_id"],)
        ).fetchall()

        appts = conn.execute(
            """SELECT a.id as appointment_id, a.slot_date as visit_date, a.slot_time,
                      a.status, a.created_at,
                      d.name as doctor_name, dep.name as department_name, h.name as hospital_name
               FROM appointments a
               JOIN doctors d ON a.doctor_id = d.id
               JOIN departments dep ON a.department_id = dep.id
               JOIN hospitals h ON a.hospital_id = h.id
               WHERE a.patient_id = ?
               ORDER BY a.slot_date DESC, a.slot_time DESC""",
            (session["patient_id"],)
        ).fetchall()

    records = [dict(r) for r in rows]
    # Convert appointments into health-history items (so users see past visits)
    for a in appts:
        d = dict(a)
        records.append({
            "id": f"appt-{d['appointment_id']}",
            "record_type": "visit",
            "title": f"{d.get('department_name','')} - {d.get('doctor_name','')}",
            "content": f"{d.get('hospital_name','')} | {d.get('visit_date','')} {d.get('slot_time','')} | status: {d.get('status','')}",
            "doctor_notes": "",
            "visit_date": d.get("visit_date"),
            "created_at": d.get("created_at")
        })

    # Sort combined records by visit_date then created_at
    records.sort(key=lambda x: (x.get("visit_date") or "", x.get("created_at") or ""), reverse=True)
    return jsonify({"records": records})


@app.route("/api/patient/health-records", methods=["POST"])
@login_required
def api_health_records_add():
    data = request.get_json() or {}
    record_type = (data.get("record_type") or "visit").strip()
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    doctor_notes = (data.get("doctor_notes") or "").strip()
    visit_date = data.get("visit_date") or date.today().isoformat()
    with get_db() as conn:
        conn.execute(
            """INSERT INTO health_records (patient_id, record_type, title, content, doctor_notes, visit_date) VALUES (?, ?, ?, ?, ?, ?)""",
            (session["patient_id"], record_type, title, content, doctor_notes, visit_date)
        )
    return jsonify({"success": True})


# ---------- Platform Stats API ----------
@app.route("/api/platform-stats", methods=["GET"])
def api_platform_stats():
    with get_db() as conn:
        # Get real counts from database
        appointments_count = conn.execute("SELECT COUNT(*) FROM appointments").fetchone()[0]
        patients_count = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
        donors_count = conn.execute("SELECT COUNT(*) FROM blood_donors WHERE available = 1").fetchone()[0]
        hospitals_count = conn.execute("SELECT COUNT(*) FROM hospitals").fetchone()[0]
        
        return jsonify({
            "appointments": appointments_count,
            "patients": patients_count,
            "donors": donors_count,
            "hospitals": hospitals_count
        })
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "GET":
        return render_template("admin/login.html")
    username = (request.form.get("username") or "").strip()
    password = request.form.get("password") or ""
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        return redirect(url_for("admin_dashboard"))
    flash("Invalid admin credentials.")
    return redirect(url_for("admin_login"))


@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("index"))


@app.route("/admin")
@admin_required
def admin_dashboard():
    return render_template("admin/dashboard.html")


@app.route("/api/admin/emergencies")
@admin_required
def api_admin_emergencies():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, patient_name, description, latitude, longitude, status, priority, created_at FROM emergencies ORDER BY created_at DESC"
        ).fetchall()
    return jsonify({"emergencies": [dict(r) for r in rows]})


@app.route("/api/admin/emergencies/<int:eid>/status", methods=["POST"])
@admin_required
def api_admin_emergency_status(eid):
    data = request.get_json() or {}
    status = data.get("status", "attended")
    with get_db() as conn:
        conn.execute("UPDATE emergencies SET status = ? WHERE id = ?", (status, eid))
    return jsonify({"success": True})


@app.route("/api/admin/doctors", methods=["GET", "POST"])
@admin_required
def api_admin_doctors():
    if request.method == "GET":
        with get_db() as conn:
            rows = conn.execute(
                """SELECT doc.id, doc.name, doc.specialization, doc.phone, doc.hospital_id, doc.department_id,
                          h.name as hospital_name, d.name as department_name
                   FROM doctors doc LEFT JOIN hospitals h ON doc.hospital_id = h.id LEFT JOIN departments d ON doc.department_id = d.id"""
            ).fetchall()
        return jsonify({"doctors": [dict(r) for r in rows]})
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    department_id = data.get("department_id")
    hospital_id = data.get("hospital_id")
    specialization = (data.get("specialization") or "").strip()
    phone = (data.get("phone") or "").strip()
    if not name or not department_id or not hospital_id:
        return jsonify({"success": False, "error": "Name, department, hospital required"}), 400
    with get_db() as conn:
        conn.execute(
            """INSERT INTO doctors (name, department_id, hospital_id, specialization, phone) VALUES (?, ?, ?, ?, ?)""",
            (name, department_id, hospital_id, specialization, phone)
        )
    return jsonify({"success": True})


@app.route("/api/admin/appointments")
@admin_required
def api_admin_appointments():
    with get_db() as conn:
        rows = conn.execute(
            """SELECT a.id, a.slot_date, a.slot_time, a.status, p.name as patient_name, d.name as doctor_name, h.name as hospital_name
               FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id JOIN hospitals h ON a.hospital_id = h.id
               ORDER BY a.slot_date, a.slot_time"""
        ).fetchall()
    return jsonify({"appointments": [dict(r) for r in rows]})


@app.route("/api/admin/patients")
@admin_required
def api_admin_patients():
    with get_db() as conn:
        rows = conn.execute("SELECT id, name, email, phone, age, blood_group, health_id, created_at FROM patients ORDER BY id").fetchall()
    return jsonify({"patients": [dict(r) for r in rows]})


@app.route("/api/admin/donors")
@admin_required
def api_admin_donors():
    with get_db() as conn:
        rows = conn.execute("SELECT id, name, blood_group, phone, location, last_donation_date, available FROM blood_donors").fetchall()
    return jsonify({"donors": [dict(r) for r in rows]})


@app.route("/api/admin/analytics")
@admin_required
def api_admin_analytics():
    with get_db() as conn:
        today = date.today().isoformat()
        daily_patients = conn.execute(
            "SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE slot_date = ? AND status = 'scheduled'", (today,)
        ).fetchone()[0]
        emergency_count = conn.execute("SELECT COUNT(*) FROM emergencies WHERE status = 'pending'").fetchone()[0]
        dept_counts = conn.execute(
            """SELECT dep.name, COUNT(a.id) as cnt FROM appointments a JOIN departments dep ON a.department_id = dep.id
               WHERE a.slot_date >= ? AND a.status = 'scheduled' GROUP BY a.department_id ORDER BY cnt DESC LIMIT 5""",
            (today,)
        ).fetchall()
        doctor_workload = conn.execute(
            """SELECT d.name, COUNT(a.id) as cnt FROM appointments a JOIN doctors d ON a.doctor_id = d.id
               WHERE a.slot_date >= ? AND a.status = 'scheduled' GROUP BY a.doctor_id ORDER BY cnt DESC LIMIT 10""",
            (today,)
        ).fetchall()
        avg_wait = conn.execute(
            "SELECT AVG(estimated_wait_minutes) FROM appointments WHERE slot_date >= ? AND status = 'scheduled'",
            (today,)
        ).fetchone()[0] or 0
    return jsonify({
        "daily_patients": daily_patients,
        "emergency_cases": emergency_count,
        "busiest_departments": [{"name": r["name"], "count": r["cnt"]} for r in dept_counts],
        "doctor_workload": [{"name": r["name"], "count": r["cnt"]} for r in doctor_workload],
        "average_waiting_time_minutes": round(avg_wait, 1)
    })


# ---------- Pages (patient booking, disease prediction, etc.) ----------
@app.route("/book")
def book_page():
    return render_template("patient/book.html")


@app.route("/disease-prediction")
def disease_prediction_page():
    return render_template("patient/disease_prediction.html")


@app.route("/blood-donors")
def blood_donors_page():
    return render_template("patient/blood_donors.html")


@app.route("/my-appointments")
@login_required
def my_appointments_page():
    return render_template("patient/my_appointments.html")


@app.route("/health-id")
@login_required
def health_id_page():
    return render_template("patient/health_id.html")


# ---------- Init ----------
with app.app_context():
    init_db()
    seed_sample_data()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
