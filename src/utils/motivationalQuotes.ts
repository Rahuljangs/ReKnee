import type { RehabPhase } from '@/src/types';

interface DailyMotivation {
  quote: string;
  tip: string;
}

const PHASE_QUOTES: Record<RehabPhase, DailyMotivation[]> = {
  1: [
    { quote: 'The hardest part is behind you. Every day forward is progress.', tip: 'Ankle pumps every hour help prevent blood clots and reduce swelling.' },
    { quote: 'Healing is not linear, but it is happening right now inside your knee.', tip: 'Ice for 15-20 minutes after exercises to manage swelling.' },
    { quote: 'Small steps today become strong strides tomorrow.', tip: 'Focus on getting full knee extension — it\'s the #1 priority this phase.' },
    { quote: 'Your body is doing incredible work rebuilding. Trust the process.', tip: 'Keep your leg elevated above your heart when resting.' },
    { quote: 'Patience is the most powerful medicine in recovery.', tip: 'Gentle quad sets throughout the day wake up your muscles.' },
    { quote: 'You chose to rebuild. That takes courage.', tip: 'Sleep with your leg straight, not bent under pillows.' },
    { quote: 'Every rep counts, even when it doesn\'t feel like it.', tip: 'Stay hydrated — your healing tissues need water.' },
  ],
  2: [
    { quote: 'You\'re walking a path millions have walked before you — and they made it.', tip: 'Stationary biking is your best friend right now. Start with low resistance.' },
    { quote: 'Your graft is becoming part of you. Give it time to settle in.', tip: 'Focus on normalizing your gait — no limping allowed!' },
    { quote: 'Consistency beats intensity in rehab. Show up every day.', tip: 'Mini squats to 60° are safe. Don\'t go deeper yet.' },
    { quote: 'The swelling will go down. The stiffness will ease. Keep going.', tip: 'Stretch your hamstrings and calves gently to improve range of motion.' },
    { quote: 'Two weeks in and you\'re already stronger than you know.', tip: 'Can you straighten your knee fully? That\'s the milestone to aim for.' },
    { quote: 'Your knee doesn\'t define you, but how you recover might.', tip: 'If you can walk without a limp, you\'re ready for the next challenge.' },
    { quote: 'Progress is quiet. One day you\'ll look back and be amazed.', tip: 'Standing hamstring curls build the muscle that protects your new ACL.' },
  ],
  3: [
    { quote: 'You\'re in the deep work now. This is where real strength is built.', tip: 'Your graft is at its weakest right now. Respect the biology.' },
    { quote: 'The temptation to rush is a sign you\'re healing. Channel that energy into form.', tip: 'Eccentric step-downs build control. Go slow on the way down.' },
    { quote: 'Strength doesn\'t come from what you can do. It comes from overcoming what you once couldn\'t.', tip: 'Double-leg box jumps before single-leg. Always.' },
    { quote: 'Three months feels long. But your knee has a lifetime ahead.', tip: 'If any exercise causes sharp pain, stop. Dull ache is okay, sharp pain is not.' },
    { quote: 'Every squat is a deposit in your recovery bank account.', tip: 'Balance training on a BOSU ball retrains your proprioception.' },
  ],
  4: [
    { quote: 'You\'re moving like an athlete again. Trust your training.', tip: 'Cutting drills: always push off with the outside foot.' },
    { quote: 'Speed is earned, not given. Your patience is paying off.', tip: 'If you can zig-zag pain-free, you\'re doing amazing.' },
    { quote: 'Your knee has been through fire and came out stronger.', tip: 'Single-leg hops test confidence as much as strength.' },
    { quote: 'The finish line is in sight. Don\'t sprint to it.', tip: 'Reactive agility is the final puzzle piece before return to sport.' },
  ],
  5: [
    { quote: 'You did it. Every painful rep, every boring exercise — it led here.', tip: 'Return to sport is a decision made by you AND your doctor together.' },
    { quote: 'The comeback is always stronger than the setback.', tip: 'Continue your maintenance exercises even after returning to sport.' },
    { quote: 'This recovery taught you something no sport ever could.', tip: 'The ACL-RSI psychological readiness score matters as much as physical tests.' },
  ],
};

export function getDailyMotivation(phase: RehabPhase): DailyMotivation {
  const quotes = PHASE_QUOTES[phase];
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % quotes.length;
  return quotes[dayIndex];
}
