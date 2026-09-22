"""Single Gemini API client for chatbot, disease prediction, and doctor recommendation."""
import os
import json
import google.generativeai as genai
from flask import current_app, has_app_context

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Configure once; key from env or app config
def get_client(system_instruction: str = None):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key and has_app_context():
        api_key = current_app.config.get("GEMINI_API_KEY")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    model_name = os.environ.get("GEMINI_MODEL") or (current_app.config.get("GEMINI_MODEL") if has_app_context() else None) or "models/gemini-flash-latest"
    if system_instruction:
        return genai.GenerativeModel(model_name, system_instruction=system_instruction)
    return genai.GenerativeModel(model_name)


def _call_gemini(prompt: str, system_instruction: str = None) -> str:
    """Call Gemini and return response text. Returns friendly fallback on error."""
    try:
        client = get_client(system_instruction=system_instruction)
        if not client:
            return "AI is not configured. Please set GEMINI_API_KEY."
        response = client.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
        return "I couldn't generate a response. Please try again."
    except Exception as e:
        return f"AI service temporarily unavailable: {str(e)}"


def chatbot_response(user_message: str) -> str:
    """Answer hospital questions, analyze symptoms, suggest department, help with appointments."""
    system = """You are a helpful assistant for a government hospital. Your role:
- Answer questions about the hospital (timings, departments, facilities).
- When the user describes symptoms, suggest the most appropriate department (e.g. severe headache and nausea -> Neurology).
- Help users understand how to book appointments.
- Be concise and professional. Reply in 2-4 short sentences unless more detail is needed."""
    prompt = f"User: {user_message}\n\nAssistant:"
    return _call_gemini(prompt, system_instruction=system)


def disease_risk_prediction(symptoms: str, age: int, medical_history: str) -> dict:
    """Return possible disease risk, recommended doctor type, and urgency level."""
    prompt = f"""Analyze this patient information and respond with ONLY a valid JSON object (no markdown, no extra text):
- symptoms: {symptoms}
- age: {age}
- medical_history: {medical_history}

Respond with exactly this structure:
{{"possible_conditions": ["condition1", "condition2"], "recommended_specialization": "e.g. Cardiologist/Neurologist/General Physician", "urgency": "Low/Medium/High", "brief_advice": "One sentence advice"}}"""
    try:
        client = get_client()
        if not client:
            return {
                "possible_conditions": ["Unable to analyze - AI not configured"],
                "recommended_specialization": "General Physician",
                "urgency": "Medium",
                "brief_advice": "Please set GEMINI_API_KEY for AI analysis."
            }
        response = client.generate_content(prompt)
        text = (response.text or "").strip()
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        return {
            "possible_conditions": ["Analysis unavailable"],
            "recommended_specialization": "General Physician",
            "urgency": "Medium",
            "brief_advice": str(e)
        }


def doctor_recommendation(symptoms: str, age: int, medical_history: str) -> str:
    """Use same logic as disease prediction but return a text recommendation (e.g. for UI)."""
    result = disease_risk_prediction(symptoms, age, medical_history)
    spec = result.get("recommended_specialization", "General Physician")
    urgency = result.get("urgency", "Medium")
    advice = result.get("brief_advice", "")
    return f"Recommended: {spec}. Urgency: {urgency}. {advice}"
