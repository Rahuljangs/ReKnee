import type { DVTCheckResult } from '@/src/types';

/**
 * DVT (Deep Vein Thrombosis) and PE (Pulmonary Embolism) red flag keywords.
 * Each entry is [keyword/phrase, severity].
 * This is a DETERMINISTIC check — no LLM involvement.
 */
const DVT_RED_FLAGS: Array<[string, 'warning' | 'critical']> = [
  // DVT indicators
  ['calf swelling', 'critical'],
  ['calf swollen', 'critical'],
  ['leg swelling', 'critical'],
  ['leg swollen', 'critical'],
  ['swollen calf', 'critical'],
  ['swollen leg', 'critical'],
  ['lower leg swelling', 'critical'],
  ['leg warmth', 'critical'],
  ['warm to touch', 'warning'],
  ['warm leg', 'critical'],
  ['hot leg', 'critical'],
  ['hot calf', 'critical'],
  ['reddish skin', 'critical'],
  ['bluish skin', 'critical'],
  ['red discoloration', 'critical'],
  ['blue discoloration', 'critical'],
  ['skin discoloration', 'critical'],
  ['skin turned red', 'critical'],
  ['skin turned blue', 'critical'],
  ['purple leg', 'critical'],
  ['purple calf', 'critical'],
  ['protruding veins', 'warning'],
  ['veins bulging', 'warning'],
  ['bulging veins', 'warning'],
  ['calf pain', 'warning'],
  ['calf tenderness', 'warning'],
  ['severe calf', 'critical'],
  ['charlie horse', 'warning'],
  ['charley horse', 'warning'],
  ['cramping calf', 'warning'],
  ['calf cramp', 'warning'],
  ['deep calf pain', 'critical'],

  // Pulmonary Embolism indicators (immediately life-threatening)
  ['chest pain', 'critical'],
  ['stabbing chest', 'critical'],
  ['sharp chest pain', 'critical'],
  ['chest tightness', 'critical'],
  ['shortness of breath', 'critical'],
  ['can\'t breathe', 'critical'],
  ['cannot breathe', 'critical'],
  ['hard to breathe', 'critical'],
  ['difficulty breathing', 'critical'],
  ['trouble breathing', 'critical'],
  ['rapid heart', 'critical'],
  ['heart racing', 'critical'],
  ['racing heart', 'critical'],
  ['fast heartbeat', 'critical'],
  ['rapid heartbeat', 'critical'],
  ['pounding heart', 'critical'],
  ['bloody cough', 'critical'],
  ['coughing blood', 'critical'],
  ['blood in cough', 'critical'],
  ['cough blood', 'critical'],
  ['blood when coughing', 'critical'],
  ['sudden dizziness', 'critical'],
  ['feel faint', 'warning'],
  ['fainting', 'critical'],
  ['passed out', 'critical'],
];

/**
 * Scans a user message for DVT/PE red flags.
 * This runs on EVERY user message, both client-side (for immediate UI response)
 * and server-side (as the authoritative check that cannot be bypassed).
 */
export function checkForDVTRedFlags(message: string): DVTCheckResult {
  const normalizedMessage = message.toLowerCase().trim();
  const matchedKeywords: string[] = [];
  let highestSeverity: 'none' | 'warning' | 'critical' = 'none';

  for (const [keyword, severity] of DVT_RED_FLAGS) {
    if (normalizedMessage.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      if (severity === 'critical') {
        highestSeverity = 'critical';
      } else if (severity === 'warning' && highestSeverity !== 'critical') {
        highestSeverity = 'warning';
      }
    }
  }

  // A single critical flag = immediate halt.
  // Two or more warning flags also escalate to critical.
  const criticalCount = matchedKeywords.filter((k) => {
    const entry = DVT_RED_FLAGS.find(([kw]) => kw === k);
    return entry && entry[1] === 'critical';
  }).length;

  const warningCount = matchedKeywords.length - criticalCount;

  let finalSeverity = highestSeverity;
  if (warningCount >= 2 && finalSeverity === 'warning') {
    finalSeverity = 'critical';
  }

  return {
    flagged: matchedKeywords.length > 0,
    matchedKeywords,
    severity: finalSeverity,
  };
}

export const DVT_EMERGENCY_MESSAGE =
  'MEDICAL ALERT: Based on the symptoms you described, you may be experiencing signs consistent with a Deep Vein Thrombosis (DVT) or Pulmonary Embolism (PE). This is a potentially life-threatening condition that requires IMMEDIATE medical attention.\n\n' +
  'DO NOT WAIT. Take the following steps RIGHT NOW:\n\n' +
  '1. CALL your surgeon\'s office immediately\n' +
  '2. If you cannot reach them, go to the nearest Emergency Room\n' +
  '3. If you are experiencing chest pain, shortness of breath, or rapid heart rate, CALL 911 (or your local emergency number) immediately\n\n' +
  'Do NOT massage your leg. Do NOT walk on it unnecessarily. Keep your leg elevated and stay as still as possible until you receive medical care.\n\n' +
  'This app cannot provide medical diagnosis. Only a qualified medical professional can evaluate your condition.';
