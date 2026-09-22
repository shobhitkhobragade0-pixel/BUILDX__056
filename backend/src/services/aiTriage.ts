import { EmergencyPriority } from '../types/index.js';

export interface StructuredTriageResult {
  priority: EmergencyPriority;
  summary: string;
  likely_requirements: string[];
  required_specialists: string[];
  require_icu: boolean;
  require_trauma_center: boolean;
  blood_urgency: 'IMMEDIATE' | 'STANDBY' | 'NOT_REQUIRED';
  recommended_blood_group?: string;
  disclaimer: string;
}

export async function triageSymptoms(
  symptomsText: string,
  emergencyType?: string,
  consciousStatus?: string
): Promise<StructuredTriageResult> {
  const combinedInput = `${emergencyType || ''} ${consciousStatus || ''} ${symptomsText}`.toLowerCase();

  // Try calling Gemini if AI_API_KEY is configured
  const apiKey = process.env.AI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an emergency triage decision-support engine for LIFELINK NAGPUR.
Given this emergency situation: "${combinedInput}", parse the requirements into JSON strictly with these keys:
{
  "priority": "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
  "summary": "short 1-line emergency summary",
  "likely_requirements": ["Trauma care", "ICU", "Neurosurgery evaluation", "Blood support"],
  "required_specialists": ["Neurosurgeon", "Orthopedic", "Trauma Specialist", "Cardiologist"],
  "require_icu": boolean,
  "require_trauma_center": boolean,
  "blood_urgency": "IMMEDIATE" | "STANDBY" | "NOT_REQUIRED"
}
Return ONLY valid JSON.`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (response.ok) {
        const data = (await response.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            ...parsed,
            disclaimer: 'AI-assisted decision support — not a medical diagnosis.'
          };
        }
      }
    } catch (err) {
      console.warn('Live LLM call fallback to clinical rules parser:', err);
    }
  }

  // Clinical Rule-Based Triage Parser (Deterministic, instant & reliable)
  let priority: EmergencyPriority = 'MODERATE';
  const likelyReqs: string[] = [];
  const reqSpecialists: string[] = [];
  let requireICU = false;
  let requireTrauma = false;
  let bloodUrgency: 'IMMEDIATE' | 'STANDBY' | 'NOT_REQUIRED' = 'NOT_REQUIRED';

  const isHeadInjury = /head|brain|skull|concussion|unconscious|altered sensorium|ear bleeding/i.test(combinedInput);
  const isFractureOrBone = /femur|bone|fracture|limb|leg|arm|pelvis|crush/i.test(combinedInput);
  const isSevereBleeding = /heavy bleeding|hemorrhage|arterial|blood loss|spurting|profuse/i.test(combinedInput);
  const isAccidentOrTrauma = /accident|collision|crash|run over|trauma|fall from height|hit by/i.test(combinedInput);
  const isCardiac = /chest pain|heart|cardiac|arrest|angina|palpitation|sweating/i.test(combinedInput);
  const isBreathing = /breathing|gasping|asthma|choking|asphyxia|respiratory/i.test(combinedInput);
  const isUnconscious = /unconscious|coma|unresponsive/i.test(combinedInput);

  if (isAccidentOrTrauma || isHeadInjury || isSevereBleeding || isUnconscious || isCardiac) {
    priority = 'CRITICAL';
    requireICU = true;
    requireTrauma = true;
  } else if (isFractureOrBone || isBreathing) {
    priority = 'HIGH';
  }

  if (isHeadInjury) {
    reqSpecialists.push('Neurosurgeon');
    likelyReqs.push('Neurosurgery evaluation & CT scanner');
    requireICU = true;
  }

  if (isFractureOrBone) {
    reqSpecialists.push('Orthopedic');
    likelyReqs.push('Orthopedic stabilization / C-arm OT');
  }

  if (isSevereBleeding) {
    likelyReqs.push('Emergency Blood support & transfusion');
    bloodUrgency = 'IMMEDIATE';
  }

  if (isAccidentOrTrauma) {
    reqSpecialists.push('Trauma Specialist');
    likelyReqs.push('Trauma Bay & resuscitation protocol');
    requireTrauma = true;
  }

  if (isCardiac) {
    reqSpecialists.push('Cardiologist');
    likelyReqs.push('Cath lab & Cardiac ICU');
    requireICU = true;
  }

  if (requireICU && !likelyReqs.includes('ICU Bed with Ventilator')) {
    likelyReqs.push('ICU Bed with Ventilator');
  }

  // Deduplicate
  const uniqueSpecialists = Array.from(new Set(reqSpecialists));
  const uniqueReqs = Array.from(new Set(likelyReqs));

  return {
    priority,
    summary: `${priority} Emergency: ${symptomsText.slice(0, 80)}${symptomsText.length > 80 ? '...' : ''}`,
    likely_requirements: uniqueReqs.length > 0 ? uniqueReqs : ['Emergency Physician Evaluation', 'Observation Bed'],
    required_specialists: uniqueSpecialists,
    require_icu: requireICU,
    require_trauma_center: requireTrauma,
    blood_urgency: bloodUrgency,
    disclaimer: 'AI-assisted decision support — not a medical diagnosis.'
  };
}
