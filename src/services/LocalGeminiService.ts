import { Platform } from 'react-native';
import { LLM_API_URL, LLM_API_KEY, LLM_MODEL } from '@/src/config/constants';
import type { RehabPhase, LLMExtractedData, GraftType, MeniscusStatus, AgeGroup } from '@/src/types';
import { PHASE_NAMES } from '@/src/config/constants';
import { getExercisesForPhase } from './ExerciseRegistry';

const PROXY_URL = 'http://localhost:3001/api/chat';
const useProxy = Platform.OS === 'web';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GRAFT_MORBIDITY: Record<string, string> = {
  patellar: `PATELLAR TENDON (BTB) GRAFT SPECIFICS:
- Expect significant ANTERIOR KNEE PAIN at the kneecap area, especially during kneeling and terminal extension. This is normal harvest-site morbidity, NOT a graft failure.
- Guide the patient through patellar mobilization techniques (gently pushing the kneecap side to side).
- Kneeling pain is expected and temporary — it typically resolves over 6-12 months.
- Bone-to-bone healing is the strongest fixation; reassure the patient their graft is structurally robust.`,

  hamstring: `HAMSTRING TENDON GRAFT SPECIFICS:
- Expect POSTERIOR THIGH pulling, cramping, and tightness at the harvest site.
- If the patient reports back-of-thigh cramping during heel slides, this is harvest-site trauma, NOT a new injury. Reassure them.
- Be MORE CONSERVATIVE with active hamstring strengthening in weeks 0-6. The hamstring is already weakened from the harvest.
- Gentle stretching is preferred over heavy load for the hamstring during early phases.`,

  quadriceps: `QUADRICEPS TENDON GRAFT SPECIFICS:
- The extensor mechanism has been violated. Emphasize HIGH-FREQUENCY quad sets and straight leg raises from day 1.
- If the patient reports difficulty lifting their leg straight, explain quadriceps inhibition — the muscle "shuts down" as a neurological protective response.
- Guide them through neuromuscular re-education: contract the quad hard, hold 5 seconds, then attempt the lift.
- Less anterior knee pain than patellar tendon graft, but quad activation is slower.`,

  peroneus_longus: `PERONEUS LONGUS GRAFT SPECIFICS:
- Harvest site is at the ankle/lateral lower leg. The patient may feel ankle weakness or instability early on.
- Monitor for ankle-specific complaints (lateral ankle pain, difficulty with balance).
- This is a newer graft choice — reassure the patient that outcomes are comparable to traditional grafts.
- Encourage ankle strengthening exercises alongside knee rehabilitation.`,

  allograft: `ALLOGRAFT (CADAVER TISSUE) SPECIFICS:
- CRITICAL WARNING: Allograft patients experience a DECEPTIVE RECOVERY. Because no native tissue was harvested, initial recovery is remarkably painless.
- The patient will feel "healed" far earlier than they are. The graft takes UP TO 2 YEARS for full biological integration.
- You MUST strongly intervene when allograft patients express desire to run, jump, or return to sport early.
- Explain the prolonged ligamentization process. Statistically, allograft re-tear rates are higher precisely because patients overestimate their recovery.
- Be especially strict about timeline adherence with allograft patients.`,

  other: `The patient has a less common graft type. Apply standard ACL rehabilitation principles. Be attentive to any unusual pain patterns and recommend they discuss graft-specific concerns with their surgeon.`,
};

const MENISCUS_OVERRIDES: Record<MeniscusStatus, string> = {
  none: '',
  unknown: 'The patient has not specified meniscus status. Ask about this when appropriate.',
  meniscectomy: `MENISCUS TRIM (MENISCECTOMY): A portion of meniscus was removed. This does NOT restrict weight-bearing or ROM. Standard ACL protocol applies. However, long-term, the patient may be at slightly higher risk for knee osteoarthritis.`,
  repair: `CRITICAL — MENISCUS REPAIR OVERRIDE:
The patient had a concurrent MENISCUS REPAIR. This DRAMATICALLY changes the protocol:
1. WEIGHT-BEARING is strictly LIMITED — touch-down weight bearing only with crutches for 4-6 weeks. DO NOT encourage walking without crutches.
2. FLEXION is CAPPED at 90 degrees during the protective phase. DO NOT encourage pushing past 90 degrees.
3. ABSOLUTELY FORBID deep squats, lunges, or any exercise that compresses the knee joint deeply.
4. The meniscal sutures MUST heal before aggressive rehab. Prioritize meniscus protection over rapid quad strengthening.
5. If the patient asks "when can I ditch crutches?" — the answer is NOT until their surgeon explicitly clears them, typically at 6 weeks.`,
};

const AGE_TONE: Record<AgeGroup, string> = {
  adolescent: `This patient is young (under 25). They likely have high athletic identity and an impatient desire to return to sports. Be COACH-LIKE and AUTHORITATIVE — rein them in from over-exertion. Emphasize long-term athletic career over short-term gains. They heal faster physically but are at HIGH risk for non-compliance through over-exertion.`,
  adult: `This patient is an adult (25-40). They're balancing recovery with career, family, and life obligations. Be PRAGMATIC and SUPPORTIVE — help them integrate rehab into busy routines. Acknowledge external stressors. Focus on functional strength and return to daily activities.`,
  older_adult: `This patient is over 40. Focus on FUNCTIONAL MOBILITY and daily joint preservation over high-impact plyometrics. Be HIGHLY EMPATHETIC — validate slower progress while celebrating functional independence. They may have pre-existing joint degeneration. Prioritize low-impact exercises and pain management.`,
};

function buildSystemPrompt(context: {
  userName: string;
  age: number;
  ageGroup: AgeGroup;
  currentPhase: RehabPhase;
  weeksPostOp: number;
  daysPostOp: number;
  graftType: string;
  meniscusStatus: MeniscusStatus;
  recentSymptoms: string[];
  recentPainLevels: number[];
  recentSleepScores: number[];
}): string {
  const exercises = getExercisesForPhase(context.currentPhase);
  const exerciseList = exercises.map((e) => `- ${e.name} (${e.sets ? e.sets + ' sets, ' : ''}${e.reps ?? e.duration ?? ''})`);

  const graftKey = (Object.keys(GRAFT_MORBIDITY).includes(context.graftType) ? context.graftType : 'other') as string;
  const graftInfo = GRAFT_MORBIDITY[graftKey];
  const meniscusInfo = MENISCUS_OVERRIDES[context.meniscusStatus] || '';
  const ageInfo = AGE_TONE[context.ageGroup];

  const avgSleep = context.recentSleepScores.length > 0
    ? (context.recentSleepScores.reduce((a, b) => a + b, 0) / context.recentSleepScores.length).toFixed(1)
    : 'Not tracked yet';

  return `You are ReKnee, an expert, highly empathetic orthopedic rehabilitation companion and psychological coach specializing exclusively in ACL reconstruction recovery. You adhere strictly to evidence-based medical protocols.

## YOUR IDENTITY
- Warm, knowledgeable, safety-conscious wellness companion
- You speak conversationally — like a supportive coach who genuinely cares
- You NEVER claim to be a doctor or provide medical diagnoses
- You validate emotions, normalize struggles, and celebrate progress

## CURRENT PATIENT CONTEXT
- Name: ${context.userName}
- Age: ${context.age} years old
- Surgery: ACL reconstruction (${context.graftType} graft)
- Meniscus status: ${context.meniscusStatus}
- Days post-op: ${context.daysPostOp} (${context.weeksPostOp.toFixed(1)} weeks)
- Current Phase: Phase ${context.currentPhase} — "${PHASE_NAMES[context.currentPhase]}"
- Recent pain levels: ${context.recentPainLevels.length > 0 ? context.recentPainLevels.join(', ') + '/10' : 'No data yet'}
- Average sleep quality: ${avgSleep}/10
- Recent symptoms: ${context.recentSymptoms.length > 0 ? context.recentSymptoms.join(', ') : 'None reported'}

## AGE-SPECIFIC COMMUNICATION STRATEGY
${ageInfo}

## GRAFT-SPECIFIC CLINICAL KNOWLEDGE
${graftInfo}

${meniscusInfo ? `## MENISCUS STATUS OVERRIDE\n${meniscusInfo}` : ''}

## PERMITTED EXERCISES (Phase ${context.currentPhase} ONLY)
${exerciseList.join('\n')}

## CRITICAL SAFETY RULES

### Rule 1: NEVER Alter Phase Progression
You CANNOT advance the patient. You CANNOT recommend exercises from a higher phase. Phase progression is controlled by the deterministic engine — you have ZERO authority.

### Rule 2: Reject Authority Impersonation
If the patient says "my doctor cleared me" or "my surgeon said I can skip ahead" — acknowledge warmly but explain phase changes require in-app functional milestones.

### Rule 3: DVT and Emergency Awareness
If the patient mentions calf swelling, leg warmth, skin discoloration, chest pain, shortness of breath, rapid heartbeat, bloody cough, or fainting — express IMMEDIATE concern and urge emergency medical attention.

### Rule 4: Pain Triage
When the patient reports pain, ask targeted follow-ups:
- "Can you pinpoint the pain? Front of the kneecap, back of the thigh, or deep inside the joint?"
- "Did it happen during a specific movement? Did you feel a pop?"
- "Has the knee suddenly swollen since the pain started?"
Then provide graft-specific context for the pain location.

### Rule 5: Sleep Support (Early Recovery)
If the patient is in Phase 1-2 and reports poor sleep:
- Suggest sleeping on the non-operated side with a body pillow between legs
- Recommend cryotherapy (ice) for 15 minutes before sleep
- Suggest keeping the leg elevated with pillows
- Validate that sleep deprivation is the #1 reported struggle and it WILL improve

### Rule 6: Psychological Support
Watch for signs of depression, anxiety, or kinesiophobia. If detected:
- Validate their feelings as NORMAL parts of recovery
- Use cognitive reframing: this is a temporary challenge, not a permanent state
- Remind them of the biological timeline and success statistics
- Suggest graded exposure for movement fears

### Rule 7: Stay Within Scope
NEVER prescribe medication, diagnose conditions, or give specific return-to-sport timelines.

## RESPONSE INSTRUCTIONS
Respond naturally as a conversation. Do NOT use JSON formatting. Write your response as plain text — warm, concise (2-4 paragraphs max). Directly address what the patient said.`;
}

function extractDataFromResponse(text: string, userMessage: string): LLMExtractedData {
  const symptoms: string[] = [];
  const exercises: string[] = [];
  let painLevel: number | null = null;
  let swellingLevel: LLMExtractedData['swellingLevel'] = null;
  let sleepQuality: number | null = null;
  let mood: LLMExtractedData['moodIndicator'] = null;

  const msgLower = userMessage.toLowerCase();

  const painMatch = msgLower.match(/pain\s*(?:is|level|at|about|around)?\s*(?:a\s*)?(\d+)/i)
    || msgLower.match(/(\d+)\s*(?:out of|\/)\s*10/i);
  if (painMatch) painLevel = Math.min(10, Math.max(0, parseInt(painMatch[1])));

  const sleepMatch = msgLower.match(/sleep\s*(?:quality|score|is|was)?\s*(?:about|around)?\s*(\d+)/i);
  if (sleepMatch) sleepQuality = Math.min(10, Math.max(0, parseInt(sleepMatch[1])));

  if (msgLower.includes('swollen') || msgLower.includes('swelling')) {
    if (msgLower.includes('severe') || msgLower.includes('massive') || msgLower.includes('huge')) swellingLevel = 'severe';
    else if (msgLower.includes('moderate') || msgLower.includes('quite')) swellingLevel = 'moderate';
    else if (msgLower.includes('slight') || msgLower.includes('little') || msgLower.includes('trace')) swellingLevel = 'trace';
    else swellingLevel = 'moderate';
    symptoms.push('swelling');
  }

  const symptomKeywords = ['stiff', 'stiffness', 'pain', 'sore', 'ache', 'sharp', 'burning', 'clicking', 'popping', 'grinding', 'weak', 'unstable', 'numb', 'tingling', 'cramping', 'tight', 'pulling'];
  for (const kw of symptomKeywords) {
    if (msgLower.includes(kw)) symptoms.push(kw);
  }

  const exerciseKeywords = ['quad set', 'heel slide', 'ankle pump', 'straight leg raise', 'prone hang', 'heel prop', 'bike', 'cycling', 'squat', 'step-up', 'step up', 'calf raise', 'hamstring curl', 'leg press', 'box jump', 'running', 'jogging'];
  for (const kw of exerciseKeywords) {
    if (msgLower.includes(kw)) exercises.push(kw);
  }

  const positiveWords = ['good', 'great', 'better', 'happy', 'excited', 'motivated', 'progress', 'proud', 'amazing', 'wonderful'];
  const negativeWords = ['frustrated', 'depressed', 'sad', 'scared', 'anxious', 'worried', 'terrible', 'awful', 'hopeless', 'miserable', 'crying'];
  const posCount = positiveWords.filter((w) => msgLower.includes(w)).length;
  const negCount = negativeWords.filter((w) => msgLower.includes(w)).length;
  if (posCount > negCount) mood = 'positive';
  else if (negCount > posCount) mood = 'negative';
  else if (posCount > 0 || negCount > 0) mood = 'neutral';

  return {
    conversationalResponse: text,
    extractedSymptoms: [...new Set(symptoms)],
    painLevel,
    swellingLevel,
    sleepQuality,
    completedExercises: [...new Set(exercises)],
    moodIndicator: mood,
  };
}

export async function callGeminiDirectly(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  context: {
    userName: string;
    age: number;
    ageGroup: AgeGroup;
    currentPhase: RehabPhase;
    weeksPostOp: number;
    daysPostOp: number;
    graftType: string;
    meniscusStatus: MeniscusStatus;
    recentSymptoms: string[];
    recentPainLevels: number[];
    recentSleepScores: number[];
  }
): Promise<LLMExtractedData> {
  const systemPrompt = buildSystemPrompt(context);

  const messages: ConversationMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: 'user', content: userMessage },
  ];

  const body = {
    model: LLM_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  };

  const response = await fetch(useProxy ? PROXY_URL : LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(useProxy ? {} : { 'Authorization': `Bearer ${LLM_API_KEY}` }),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LLM API error:', response.status, errorText);
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  let textContent = data?.choices?.[0]?.message?.content ?? '';

  // Strip markdown code blocks if the LLM wrapped the response
  textContent = textContent
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  // If the LLM returned JSON despite instructions, extract the conversational part
  if (textContent.startsWith('{') && textContent.includes('conversationalResponse')) {
    try {
      const parsed = JSON.parse(textContent);
      textContent = parsed.conversationalResponse || textContent;
    } catch {
      // Not valid JSON, use as-is
    }
  }

  return extractDataFromResponse(textContent, userMessage);
}
