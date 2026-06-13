import type {
  RehabPhase,
  PhaseInfo,
  ClinicalState,
  DailyLog,
  UserProfile,
} from '@/src/types';
import { getExercisesForPhase } from './ExerciseRegistry';
import { PREMIUM_PHASE_THRESHOLD } from '@/src/config/constants';

const PHASE_DEFINITIONS: PhaseInfo[] = [
  {
    phase: 1,
    name: 'Protection & Early Motion',
    weekRange: [0, 2],
    description:
      'Protect the surgical graft, minimize swelling, restore passive knee extension, and reactivate the quadriceps.',
    objectives: [
      'Achieve full passive knee extension (0 degrees)',
      'Minimize joint effusion',
      'Activate quadriceps with isometric exercises',
      'Weight-bearing as tolerated with crutches',
    ],
    exitCriteria: [
      'Full passive knee extension achieved',
      'Trace or no effusion',
      'Minimal pain (pain level ≤ 3)',
      'Adequate quadriceps activation (can perform straight leg raise without extensor lag)',
    ],
  },
  {
    phase: 2,
    name: 'Early Strengthening',
    weekRange: [2, 6],
    description:
      'Restore full range of motion, normalize gait, wean off crutches, and begin closed-chain strengthening.',
    objectives: [
      'Restore full active and passive range of motion',
      'Normalize unassisted gait',
      'Begin closed-kinetic-chain strengthening',
      'Improve neuromuscular control',
    ],
    exitCriteria: [
      'Full pain-free active and passive ROM',
      'Normalized unassisted gait (no limp)',
      'Pain-free single-leg step-down',
      'No reactive swelling after exercises',
    ],
  },
  {
    phase: 3,
    name: 'Progressive Strengthening',
    weekRange: [6, 16],
    description:
      'Build significant strength, introduce bilateral plyometrics, and develop proprioception. The graft is at its weakest during this period — strict adherence is critical.',
    objectives: [
      'Increase quad and hamstring strength toward symmetry',
      'Introduce bilateral plyometrics with proper form',
      'Develop proprioceptive awareness',
      'Zero post-exercise pain or reactive swelling',
    ],
    exitCriteria: [
      'Quad and hamstring strength deficit < 25% vs. uninjured limb',
      'Zero pain during heavy loading activities',
      'Successful bilateral plyometrics with proper landing mechanics',
      'No reactive swelling for 2+ consecutive weeks',
    ],
  },
  {
    phase: 4,
    name: 'Sport-Specific Training',
    weekRange: [16, 24],
    description:
      'Dynamic agility training, rapid deceleration drills, and sport-specific movement patterns.',
    objectives: [
      'Develop multi-directional agility',
      'Train rapid deceleration and cutting mechanics',
      'Progress to single-leg plyometrics',
      'Build sport-specific conditioning',
    ],
    exitCriteria: [
      'Successful agility drill execution with proper form',
      'Zero reactive swelling after high-intensity sessions',
      'Pain-free deceleration and cutting',
      'Confidence in sport-specific movements',
    ],
  },
  {
    phase: 5,
    name: 'Return to Sport',
    weekRange: [24, null],
    description:
      'Full unrestricted training, competitive simulation, and long-term maintenance. Final physician clearance required for return to competition.',
    objectives: [
      'Achieve full competitive readiness',
      'Complete absence of pain and swelling',
      'Pass functional return-to-sport testing',
      'Obtain physician clearance for unrestricted play',
    ],
    exitCriteria: [
      'Physician clearance obtained',
      'Functional symmetry on hop tests',
      'Full confidence in unrestricted athletic activity',
    ],
  },
];

export function calculateDaysPostOp(surgeryDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - surgeryDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function calculateWeeksPostOp(surgeryDate: Date): number {
  return calculateDaysPostOp(surgeryDate) / 7;
}

export function getPhaseInfo(phase: RehabPhase): PhaseInfo {
  return PHASE_DEFINITIONS[phase - 1];
}

/**
 * Determines the maximum phase the user is eligible for based on
 * time alone (ignoring functional criteria).
 */
function getTimeEligiblePhase(weeksPostOp: number): RehabPhase {
  if (weeksPostOp < 2) return 1;
  if (weeksPostOp < 6) return 2;
  if (weeksPostOp < 16) return 3;
  if (weeksPostOp < 24) return 4;
  return 5;
}

/**
 * Evaluates functional exit criteria for a given phase based on recent daily logs.
 * Returns a list of unmet criteria (blockers). Empty array = all criteria met.
 */
function evaluateExitCriteria(
  phase: RehabPhase,
  recentLogs: DailyLog[]
): string[] {
  const blockers: string[] = [];

  if (recentLogs.length === 0) {
    blockers.push('Insufficient daily log data — please complete at least 3 daily check-ins');
    return blockers;
  }

  const lastThreeLogs = recentLogs.slice(-3);
  const latestLog = recentLogs[recentLogs.length - 1];

  switch (phase) {
    case 1: {
      if (latestLog.painLevel > 3) {
        blockers.push(`Pain level is ${latestLog.painLevel}/10 — must be ≤ 3`);
      }
      if (latestLog.swellingLevel === 'moderate' || latestLog.swellingLevel === 'severe') {
        blockers.push(`Swelling is ${latestLog.swellingLevel} — must be trace or none`);
      }
      const hasExtensionLag = latestLog.reportedSymptoms.some((s) =>
        s.toLowerCase().includes('extension lag') || s.toLowerCase().includes('cannot straighten')
      );
      if (hasExtensionLag) {
        blockers.push('Extension lag reported — full passive extension required');
      }
      break;
    }
    case 2: {
      if (latestLog.painLevel > 2) {
        blockers.push(`Pain level is ${latestLog.painLevel}/10 — must be ≤ 2 for phase advancement`);
      }
      const hasLimp = latestLog.reportedSymptoms.some((s) =>
        s.toLowerCase().includes('limp') || s.toLowerCase().includes('limping')
      );
      if (hasLimp) {
        blockers.push('Gait abnormality reported — normalized unassisted gait required');
      }
      const hasReactiveSwelling = lastThreeLogs.some(
        (log) => log.swellingLevel === 'moderate' || log.swellingLevel === 'severe'
      );
      if (hasReactiveSwelling) {
        blockers.push('Reactive swelling detected in recent logs — must have no swelling for advancement');
      }
      break;
    }
    case 3: {
      if (latestLog.painLevel > 1) {
        blockers.push(`Pain level is ${latestLog.painLevel}/10 — must be ≤ 1 during heavy loading`);
      }
      const hasSwellingRecently = lastThreeLogs.some(
        (log) => log.swellingLevel !== 'none' && log.swellingLevel !== 'trace'
      );
      if (hasSwellingRecently) {
        blockers.push('Swelling detected in recent sessions — need 2+ weeks swelling-free');
      }
      break;
    }
    case 4: {
      if (latestLog.painLevel > 0) {
        blockers.push('Any pain during agility drills blocks advancement');
      }
      const hasSwelling = lastThreeLogs.some(
        (log) => log.swellingLevel !== 'none'
      );
      if (hasSwelling) {
        blockers.push('Any reactive swelling blocks advancement to return-to-sport');
      }
      break;
    }
    case 5:
      // Phase 5 has no "next phase" — exit is physician clearance
      break;
  }

  return blockers;
}

/**
 * Core function: evaluates the user's clinical state.
 * This is the ONLY authority on phase progression.
 * The LLM has ZERO say in this logic.
 */
export function evaluateClinicalState(
  profile: UserProfile,
  recentLogs: DailyLog[]
): ClinicalState {
  const daysPostOp = calculateDaysPostOp(profile.surgeryDate);
  const weeksPostOp = calculateWeeksPostOp(profile.surgeryDate);
  const timeEligiblePhase = getTimeEligiblePhase(weeksPostOp);
  const currentPhase = profile.currentPhase;

  let canAdvance = false;
  let advancementBlockers: string[] = [];

  if (currentPhase < 5) {
    const nextPhase = (currentPhase + 1) as RehabPhase;

    if (timeEligiblePhase <= currentPhase) {
      advancementBlockers.push(
        `Time requirement not met — Phase ${nextPhase} requires at least ${getPhaseInfo(nextPhase).weekRange[0]} weeks post-op (currently ${weeksPostOp.toFixed(1)} weeks)`
      );
    } else {
      const functionalBlockers = evaluateExitCriteria(currentPhase, recentLogs);
      if (functionalBlockers.length > 0) {
        advancementBlockers = functionalBlockers;
      } else {
        canAdvance = true;
      }
    }
  }

  const isPremiumRequired = currentPhase >= PREMIUM_PHASE_THRESHOLD;

  return {
    currentPhase,
    weeksPostOp,
    daysPostOp,
    phaseInfo: getPhaseInfo(currentPhase),
    permittedExercises: getExercisesForPhase(currentPhase),
    canAdvance,
    advancementBlockers,
    isPremiumRequired,
  };
}

/**
 * Determines if a phase advancement should occur.
 * Only call this from the server side after evaluateClinicalState
 * confirms canAdvance === true.
 */
export function getNextPhase(currentPhase: RehabPhase): RehabPhase | null {
  if (currentPhase >= 5) return null;
  return (currentPhase + 1) as RehabPhase;
}
