<<<<<<< HEAD
# Arogya Sampark

Production-level web application to reduce waiting time in government hospitals using AI scheduling, automation, and emergency prioritization.

## Tech Stack

- **Backend:** Python Flask
- **Frontend:** HTML, CSS, JavaScript (Tailwind CSS)
- **Database:** SQLite
- **AI:** Google Gemini API (chatbot, disease prediction, doctor recommendation)
- **Location:** Browser Geolocation API
- **Translation:** Google Translate widget (single-page translation)

## Setup

1. **Clone and install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   Optional: `pip install python-dotenv` to load `.env` automatically.

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `GEMINI_API_KEY` (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
   - Optionally set `SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`

3. **Run**
   ```bash
   python app.py
   ```
   Open http://127.0.0.1:5000

## Default Credentials

- **Admin:** username `admin`, password `admin123` (change via env)
- **Patients:** Register from the site

## Features

1. **Emergency button** – Large red button on homepage → confirmation → details + geolocation → stored and shown in admin dashboard (HIGH PRIORITY).
2. **Auto location** – On homepage, browser geolocation fetches nearest hospitals with distance and doctor count.
3. **AI Chatbot** – Floating button; Gemini powers hospital Q&A, symptom analysis, department suggestion, appointment help.
4. **AI Disease risk prediction** – Symptoms + age + medical history → possible conditions, recommended doctor, urgency (same Gemini API).
5. **Appointment booking** – Register/Login → choose hospital, department, doctor → select date/time slot; shows queue size and estimated waiting time.
6. **Rescheduler** – Cancel or reschedule appointments from My Appointments.
7. **Blood donor search** – Filter by blood group, location, availability; view name, phone, last donation date.
8. **Health ID** – Link Health ID; store and view visit history, prescriptions, doctor notes.
9. **Multi-language** – Google Translate widget in navbar; translates entire page (no separate language pages).
10. **Admin panel** – Login on same site → dashboard: emergency alerts, doctors, appointments, patients, donors, analytics (daily patients, emergency cases, busiest departments, doctor workload, average waiting time).

## Project Structure

```
/templates          # Jinja2 HTML (base, index, patient/*, admin/*)
/static
  /css/style.css
  /js/               # location, emergency, chatbot, booking, etc.
  /images
/database/models.py  # SQLite init and seed
/ai/gemini_client.py # Gemini: chatbot, disease prediction, doctor recommendation
/admin, /patient     # Package placeholders
app.py              # Flask app and all routes
```

## API Summary

- `POST /api/emergency` – Submit emergency (name, description, lat, lng)
- `POST /api/hospitals/nearby` – Nearest hospitals by user location
- `GET /api/hospitals` – List hospitals (for booking)
- `POST /api/ai/chat` – Chatbot message
- `POST /api/ai/disease-prediction` – Disease risk (symptoms, age, history)
- `GET/POST /api/appointments` – List/book (patient)
- `POST /api/appointments/<id>/cancel`, `/reschedule`
- `GET /api/blood-donors` – Search donors
- `GET/POST /api/patient/health-id`, `GET/POST /api/patient/health-records`
- Admin: `/api/admin/emergencies`, `/api/admin/analytics`, etc.
=======
# ai_appointment_booking_for_government_hospital
>>>>>>> d10105772f2287e3b6e1d8222a572603e7705f55
