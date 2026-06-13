interface DVTResult {
  flagged: boolean;
  matchedKeywords: string[];
  severity: 'none' | 'warning' | 'critical';
}

const DVT_RED_FLAGS: Array<[string, 'warning' | 'critical']> = [
  ['calf swelling', 'critical'],
  ['calf swollen', 'critical'],
  ['leg swelling', 'critical'],
  ['leg swollen', 'critical'],
  ['swollen calf', 'critical'],
  ['swollen leg', 'critical'],
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
  ['purple leg', 'critical'],
  ['purple calf', 'critical'],
  ['protruding veins', 'warning'],
  ['bulging veins', 'warning'],
  ['calf pain', 'warning'],
  ['calf tenderness', 'warning'],
  ['severe calf', 'critical'],
  ['charlie horse', 'warning'],
  ['charley horse', 'warning'],
  ['deep calf pain', 'critical'],
  ['chest pain', 'critical'],
  ['stabbing chest', 'critical'],
  ['sharp chest pain', 'critical'],
  ['shortness of breath', 'critical'],
  ["can't breathe", 'critical'],
  ['cannot breathe', 'critical'],
  ['hard to breathe', 'critical'],
  ['difficulty breathing', 'critical'],
  ['rapid heart', 'critical'],
  ['heart racing', 'critical'],
  ['racing heart', 'critical'],
  ['fast heartbeat', 'critical'],
  ['rapid heartbeat', 'critical'],
  ['bloody cough', 'critical'],
  ['coughing blood', 'critical'],
  ['blood in cough', 'critical'],
  ['fainting', 'critical'],
  ['passed out', 'critical'],
];

export function checkDVTServerSide(message: string): DVTResult {
  const normalized = message.toLowerCase().trim();
  const matched: string[] = [];
  let highest: 'none' | 'warning' | 'critical' = 'none';

  for (const [keyword, severity] of DVT_RED_FLAGS) {
    if (normalized.includes(keyword)) {
      matched.push(keyword);
      if (severity === 'critical') highest = 'critical';
      else if (severity === 'warning' && highest !== 'critical') highest = 'warning';
    }
  }

  const criticalCount = matched.filter((k) => {
    const entry = DVT_RED_FLAGS.find(([kw]) => kw === k);
    return entry && entry[1] === 'critical';
  }).length;
  const warningCount = matched.length - criticalCount;

  if (warningCount >= 2 && highest === 'warning') {
    highest = 'critical';
  }

  return { flagged: matched.length > 0, matchedKeywords: matched, severity: highest };
}

export const DVT_EMERGENCY_RESPONSE = {
  conversationalResponse:
    'MEDICAL ALERT: Based on the symptoms you described, you may be experiencing signs consistent with a Deep Vein Thrombosis (DVT) or Pulmonary Embolism (PE). This is a potentially life-threatening condition that requires IMMEDIATE medical attention.\n\n' +
    'DO NOT WAIT. Take the following steps RIGHT NOW:\n\n' +
    "1. CALL your surgeon's office immediately\n" +
    '2. If you cannot reach them, go to the nearest Emergency Room\n' +
    '3. If you are experiencing chest pain, shortness of breath, or rapid heart rate, CALL 911 immediately\n\n' +
    'Do NOT massage your leg. Keep your leg elevated and stay still until you receive medical care.',
  extractedSymptoms: [] as string[],
  painLevel: null,
  swellingLevel: null,
  completedExercises: [] as string[],
  moodIndicator: null,
  dvtAlert: true,
};
