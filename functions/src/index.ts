import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { buildSystemPrompt } from './systemPrompt';
import { checkDVTServerSide, DVT_EMERGENCY_RESPONSE } from './dvtCheck';

admin.initializeApp();
const db = admin.firestore();

const llmApiKey = defineSecret('LLM_API_KEY');

const LLM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const LLM_MODEL = 'meta/llama-3.3-70b-instruct';

const PHASE_NAMES: Record<number, string> = {
  1: 'Protection & Early Motion',
  2: 'Early Strengthening',
  3: 'Progressive Strengthening',
  4: 'Sport-Specific Training',
  5: 'Return to Sport',
};

const PHASE_EXERCISES: Record<number, string[]> = {
  1: [
    'Quadriceps Sets (2x15-20)',
    'Heel Slides (2x15)',
    'Heel Props / Passive Extension (5 min)',
    'Prone Hangs (5 min)',
    'Straight Leg Raises (2x10)',
    'Ankle Pumps (20-30 every hour)',
  ],
  2: [
    'Stationary Bike (10-15 min, low resistance)',
    'Mini Squats 0-60 degrees (3x10)',
    'Step-Ups 4-inch (3x10 each leg)',
    'Standing Hamstring Curls (3x10)',
    'Bilateral Calf Raises (3x15)',
    'Prone Quadriceps Stretch (30s x 3)',
  ],
  3: [
    'Back Squats at 70% body weight (4x8-10)',
    'Eccentric Step-Ups 6-8 inch (3x10 each leg)',
    'Single-Leg Press (3x10 each leg)',
    'Double-Leg Box Jumps (3x8)',
    'Balance Board / BOSU Training (2-3 min per leg)',
  ],
  4: [
    'Forward/Backward Running (10-15 min)',
    'Side Shuffles (4x20m each direction)',
    'Carioca Steps (3x20m each direction)',
    'Zig-Zag Runs (4x5 cones)',
    'Tuck Jumps (3x8)',
    'Single-Leg Hops (3x5 each leg)',
  ],
  5: [
    'Full-Speed Sprints (5x40m)',
    'Reactive Agility Drills (15-20 min)',
    'Sport-Specific Simulation (30-45 min)',
    'Pistol Squats (3x5 each leg)',
  ],
};

export const onChatMessage = onRequest(
  { secrets: [llmApiKey], cors: true, region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { uid, message } = req.body;

    if (!uid || !message) {
      res.status(400).json({ error: 'Missing uid or message' });
      return;
    }

    try {
      const dvtResult = checkDVTServerSide(message);
      if (dvtResult.severity === 'critical') {
        await db.collection('users').doc(uid).collection('dvt_alerts').add({
          matchedKeywords: dvtResult.matchedKeywords,
          userMessage: message,
          severity: 'critical',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const response = {
          ...DVT_EMERGENCY_RESPONSE,
          extractedSymptoms: dvtResult.matchedKeywords,
        };
        res.json(response);
        return;
      }

      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const userData = userDoc.data()!;

      const surgeryDate = userData.surgeryDate.toDate();
      const now = new Date();
      const daysPostOp = Math.max(
        0,
        Math.floor((now.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const weeksPostOp = daysPostOp / 7;
      const currentPhase = userData.currentPhase as number;

      const logsSnap = await db
        .collection('users').doc(uid).collection('daily_logs')
        .orderBy('createdAt', 'desc').limit(5).get();

      const recentSymptoms: string[] = [];
      const recentPainLevels: number[] = [];

      logsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.reportedSymptoms) recentSymptoms.push(...data.reportedSymptoms);
        if (data.painLevel != null) recentPainLevels.push(data.painLevel);
      });

      const messagesSnap = await db
        .collection('users').doc(uid).collection('messages')
        .orderBy('createdAt', 'desc').limit(10).get();

      const conversationHistory = messagesSnap.docs
        .map((doc) => {
          const data = doc.data();
          return {
            role: data.role === 'user' ? 'user' as const : 'assistant' as const,
            content: data.content,
          };
        })
        .reverse();

      const systemPrompt = buildSystemPrompt({
        userName: userData.displayName || 'there',
        currentPhase,
        phaseName: PHASE_NAMES[currentPhase] || 'Unknown',
        weeksPostOp,
        daysPostOp,
        graftType: userData.graftType || 'unknown',
        permittedExercises: PHASE_EXERCISES[currentPhase] || [],
        recentSymptoms: [...new Set(recentSymptoms)].slice(0, 10),
        recentPainLevels: recentPainLevels.slice(0, 5),
      });

      const llmResponse = await fetch(LLM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmApiKey.value()}`,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!llmResponse.ok) {
        throw new Error(`LLM API error: ${llmResponse.status}`);
      }

      const llmData = await llmResponse.json();
      const responseText = llmData?.choices?.[0]?.message?.content ?? '';

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          conversationalResponse: responseText,
          extractedSymptoms: [],
          painLevel: null,
          swellingLevel: null,
          completedExercises: [],
          moodIndicator: null,
        };
      }

      if (
        parsed.extractedSymptoms?.length ||
        parsed.painLevel != null ||
        parsed.completedExercises?.length
      ) {
        const today = new Date().toISOString().split('T')[0];
        const logRef = db.collection('users').doc(uid).collection('daily_logs').doc(today);
        const existingLog = await logRef.get();

        if (existingLog.exists) {
          const updateData: Record<string, any> = {};
          if (parsed.extractedSymptoms?.length) {
            updateData.reportedSymptoms = admin.firestore.FieldValue.arrayUnion(...parsed.extractedSymptoms);
          }
          if (parsed.completedExercises?.length) {
            updateData.completedExercises = admin.firestore.FieldValue.arrayUnion(...parsed.completedExercises);
          }
          if (parsed.painLevel != null) updateData.painLevel = parsed.painLevel;
          if (parsed.swellingLevel) updateData.swellingLevel = parsed.swellingLevel;
          updateData.llmSummary = (parsed.conversationalResponse || '').substring(0, 500);
          await logRef.update(updateData);
        } else {
          await logRef.set({
            reportedSymptoms: parsed.extractedSymptoms ?? [],
            completedExercises: parsed.completedExercises ?? [],
            painLevel: parsed.painLevel ?? 0,
            swellingLevel: parsed.swellingLevel ?? 'none',
            llmSummary: (parsed.conversationalResponse || '').substring(0, 500),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      res.json({
        ...parsed,
        dvtAlert: dvtResult.flagged
          ? { flagged: true, severity: dvtResult.severity, matchedKeywords: dvtResult.matchedKeywords }
          : null,
      });
    } catch (error) {
      console.error('onChatMessage error:', error);
      res.status(500).json({
        conversationalResponse:
          "I'm having a moment — please try sending your message again. If you're experiencing any emergency symptoms, please contact your doctor immediately.",
        extractedSymptoms: [],
        painLevel: null,
        swellingLevel: null,
        completedExercises: [],
        moodIndicator: null,
        error: true,
      });
    }
  }
);

export const scheduledDailyCheckIn = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
  },
  async () => {
    const usersSnap = await db.collection('users').where('pushToken', '!=', null).get();

    const messages = usersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        to: data.pushToken,
        title: 'ReKnee Check-In',
        body: `Good morning${data.displayName ? `, ${data.displayName.split(' ')[0]}` : ''}! How is your knee feeling today?`,
        data: { type: 'daily_checkin' },
      };
    });

    if (messages.length === 0) return;

    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(chunk),
        });
      } catch (error) {
        console.error('Push notification error:', error);
      }
    }
  }
);
