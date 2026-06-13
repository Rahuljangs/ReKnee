import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkForDVTRedFlags, DVT_EMERGENCY_MESSAGE } from './DVTTriageService';
import { callGeminiDirectly } from './LocalGeminiService';
import { calculateDaysPostOp, calculateWeeksPostOp } from './ClinicalEngine';
import { DEV_MODE, CLOUD_FUNCTION_BASE_URL } from '@/src/config/constants';
import type { ChatMessage, UserProfile, DailyLog, GeminiExtractedData, DVTCheckResult } from '@/src/types';

const MESSAGES_KEY = '@reknee_messages';
const LOGS_KEY = '@reknee_daily_logs';

export interface ChatResponse {
  message: string;
  dvtAlert: DVTCheckResult;
  extractedData?: GeminiExtractedData;
}

async function getStoredMessages(): Promise<ChatMessage[]> {
  const json = await AsyncStorage.getItem(MESSAGES_KEY);
  if (!json) return [];
  const msgs: ChatMessage[] = JSON.parse(json);
  return msgs.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
}

async function appendMessage(msg: ChatMessage): Promise<void> {
  const existing = await getStoredMessages();
  existing.push(msg);
  // Keep last 200 messages
  const trimmed = existing.slice(-200);
  await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(trimmed));
}

async function getStoredLogs(): Promise<DailyLog[]> {
  const json = await AsyncStorage.getItem(LOGS_KEY);
  if (!json) return [];
  return JSON.parse(json);
}

async function upsertDailyLog(data: Partial<DailyLog>): Promise<void> {
  const logs = await getStoredLogs();
  const today = new Date().toISOString().split('T')[0];
  const idx = logs.findIndex((l) => l.id === today);

  if (idx >= 0) {
    const existing = logs[idx];
    logs[idx] = {
      ...existing,
      reportedSymptoms: [...new Set([...existing.reportedSymptoms, ...(data.reportedSymptoms ?? [])])],
      completedExercises: [...new Set([...existing.completedExercises, ...(data.completedExercises ?? [])])],
      painLevel: data.painLevel ?? existing.painLevel,
      swellingLevel: data.swellingLevel ?? existing.swellingLevel,
      llmSummary: data.llmSummary ?? existing.llmSummary,
    };
  } else {
    logs.push({
      id: today,
      reportedSymptoms: data.reportedSymptoms ?? [],
      completedExercises: data.completedExercises ?? [],
      painLevel: data.painLevel ?? 0,
      swellingLevel: data.swellingLevel ?? 'none',
      llmSummary: data.llmSummary ?? '',
      createdAt: new Date(),
    });
  }

  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(-60)));
}

export async function sendMessage(
  userMessage: string,
  profile: UserProfile
): Promise<ChatResponse> {
  const dvtCheck = checkForDVTRedFlags(userMessage);

  const userMsg: ChatMessage = {
    id: `u_${Date.now()}`,
    role: 'user',
    content: userMessage,
    extractedSymptoms: [],
    dvtFlag: dvtCheck.flagged,
    createdAt: new Date(),
  };
  await appendMessage(userMsg);

  if (dvtCheck.severity === 'critical') {
    const sysMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      role: 'system',
      content: DVT_EMERGENCY_MESSAGE,
      extractedSymptoms: dvtCheck.matchedKeywords,
      dvtFlag: true,
      createdAt: new Date(),
    };
    await appendMessage(sysMsg);
    return { message: DVT_EMERGENCY_MESSAGE, dvtAlert: dvtCheck };
  }

  if (DEV_MODE) {
    return sendMessageLocal(userMessage, profile, dvtCheck);
  } else {
    return sendMessageRemote(userMessage, profile, dvtCheck);
  }
}

async function sendMessageLocal(
  userMessage: string,
  profile: UserProfile,
  dvtCheck: DVTCheckResult
): Promise<ChatResponse> {
  try {
    const allMessages = await getStoredMessages();
    const conversationHistory = allMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.content }],
      }));

    // Remove the last entry (the message we just added) since we pass it separately
    if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user') {
      conversationHistory.pop();
    }

    const logs = await getStoredLogs();
    const recentSymptoms = logs.flatMap((l) => l.reportedSymptoms).slice(-10);
    const recentPainLevels = logs.map((l) => l.painLevel).filter((p) => p > 0).slice(-5);

    const data = await callGeminiDirectly(userMessage, conversationHistory, {
      userName: profile.displayName || 'there',
      currentPhase: profile.currentPhase,
      weeksPostOp: calculateWeeksPostOp(profile.surgeryDate),
      daysPostOp: calculateDaysPostOp(profile.surgeryDate),
      graftType: profile.graftType,
      recentSymptoms: [...new Set(recentSymptoms)],
      recentPainLevels,
    });

    const aiMsg: ChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: data.conversationalResponse,
      extractedSymptoms: data.extractedSymptoms,
      dvtFlag: false,
      createdAt: new Date(),
    };
    await appendMessage(aiMsg);

    if (data.extractedSymptoms.length || data.painLevel != null || data.completedExercises.length) {
      await upsertDailyLog({
        reportedSymptoms: data.extractedSymptoms,
        completedExercises: data.completedExercises,
        painLevel: data.painLevel ?? undefined,
        swellingLevel: data.swellingLevel ?? undefined,
        llmSummary: data.conversationalResponse.substring(0, 500),
      });
    }

    return { message: data.conversationalResponse, dvtAlert: dvtCheck, extractedData: data };
  } catch (error) {
    console.error('Local Gemini error:', error);
    const fallback =
      "I'm having trouble connecting to the AI service right now. Please check your internet connection and try again. If you're experiencing any medical emergency, contact your doctor immediately.";
    return { message: fallback, dvtAlert: dvtCheck };
  }
}

async function sendMessageRemote(
  userMessage: string,
  profile: UserProfile,
  dvtCheck: DVTCheckResult
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/onChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: profile.uid, message: userMessage }),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();

    const aiMsg: ChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: data.conversationalResponse,
      extractedSymptoms: data.extractedSymptoms ?? [],
      dvtFlag: false,
      createdAt: new Date(),
    };
    await appendMessage(aiMsg);

    return { message: data.conversationalResponse, dvtAlert: dvtCheck, extractedData: data };
  } catch (error) {
    console.error('Remote chat error:', error);
    const fallback = "I'm having trouble connecting right now. Please try again.";
    return { message: fallback, dvtAlert: dvtCheck };
  }
}

export async function loadMessageHistory(_uid: string, _limitCount = 50): Promise<ChatMessage[]> {
  if (DEV_MODE) {
    return getStoredMessages();
  }

  const firestore = require('@react-native-firebase/firestore').default;
  const snapshot = await firestore()
    .collection('users')
    .doc(_uid)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(_limitCount)
    .get();

  return snapshot.docs
    .map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        content: data.content,
        extractedSymptoms: data.extractedSymptoms,
        dvtFlag: data.dvtFlag,
        createdAt: data.createdAt?.toDate() ?? new Date(),
      } as ChatMessage;
    })
    .reverse();
}

export async function loadRecentDailyLogs(_uid: string, count = 7): Promise<DailyLog[]> {
  if (DEV_MODE) {
    const logs = await getStoredLogs();
    return logs.slice(-count);
  }

  const firestore = require('@react-native-firebase/firestore').default;
  const snapshot = await firestore()
    .collection('users')
    .doc(_uid)
    .collection('daily_logs')
    .orderBy('createdAt', 'desc')
    .limit(count)
    .get();

  return snapshot.docs
    .map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        reportedSymptoms: data.reportedSymptoms ?? [],
        completedExercises: data.completedExercises ?? [],
        painLevel: data.painLevel ?? 0,
        swellingLevel: data.swellingLevel ?? 'none',
        llmSummary: data.llmSummary ?? '',
        createdAt: data.createdAt?.toDate() ?? new Date(),
      } as DailyLog;
    })
    .reverse();
}
