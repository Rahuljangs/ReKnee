export type GraftType =
  | 'patellar'
  | 'hamstring'
  | 'quadriceps'
  | 'peroneus_longus'
  | 'allograft'
  | 'other';

export type RehabPhase = 1 | 2 | 3 | 4 | 5;

export type SwellingLevel = 'none' | 'trace' | 'moderate' | 'severe';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  surgeryDate: Date;
  graftType: GraftType;
  graftTypeCustom?: string;
  currentPhase: RehabPhase;
  phaseUpdatedAt: Date;
  isPremium: boolean;
  pushToken: string | null;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  extractedSymptoms?: string[];
  dvtFlag?: boolean;
  createdAt: Date;
}

export interface DailyLog {
  id: string;
  reportedSymptoms: string[];
  completedExercises: string[];
  painLevel: number;
  swellingLevel: SwellingLevel;
  llmSummary: string;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  sets?: string;
  reps?: string;
  duration?: string;
  instructions: string[];
  phase: RehabPhase;
}

export interface PhaseInfo {
  phase: RehabPhase;
  name: string;
  weekRange: [number, number | null];
  description: string;
  objectives: string[];
  exitCriteria: string[];
}

export interface ClinicalState {
  currentPhase: RehabPhase;
  weeksPostOp: number;
  daysPostOp: number;
  phaseInfo: PhaseInfo;
  permittedExercises: Exercise[];
  canAdvance: boolean;
  advancementBlockers: string[];
  isPremiumRequired: boolean;
}

export interface DVTCheckResult {
  flagged: boolean;
  matchedKeywords: string[];
  severity: 'none' | 'warning' | 'critical';
}

export interface GeminiExtractedData {
  conversationalResponse: string;
  extractedSymptoms: string[];
  painLevel: number | null;
  swellingLevel: SwellingLevel | null;
  completedExercises: string[];
  moodIndicator: 'positive' | 'neutral' | 'negative' | null;
}
