import type { Exercise, RehabPhase } from '@/src/types';

const EXERCISES: Exercise[] = [
  // ── Phase 1: Protection & Early Motion (Weeks 0-2) ──
  {
    id: 'p1_quad_sets',
    name: 'Quadriceps Sets',
    description: 'Isometric quadriceps activation while seated or lying down.',
    sets: '2',
    reps: '15-20',
    instructions: [
      'Sit with your leg extended on a flat surface.',
      'Tighten the muscles on top of your thigh by pressing the back of your knee down.',
      'Hold for 5 seconds, then relax.',
    ],
    phase: 1,
  },
  {
    id: 'p1_heel_slides',
    name: 'Heel Slides',
    description: 'Gently bend and straighten the knee using a towel for assistance.',
    sets: '2',
    reps: '15',
    instructions: [
      'Lie on your back with a towel looped around your foot.',
      'Slowly slide your heel toward your buttock, bending the knee.',
      'Use the towel to gently assist the motion if needed.',
      'Slide back to the starting position.',
    ],
    phase: 1,
  },
  {
    id: 'p1_heel_props',
    name: 'Heel Props (Passive Extension)',
    description: 'Achieve full passive knee extension by propping the heel.',
    duration: '5 minutes',
    instructions: [
      'Place a rolled towel under your ankle so your heel is elevated.',
      'Let gravity gently push your knee into full extension.',
      'Hold for 5 minutes. Do NOT place anything under your knee.',
    ],
    phase: 1,
  },
  {
    id: 'p1_prone_hangs',
    name: 'Prone Hangs',
    description: 'Lie face-down with knee off the edge of the bed for passive extension.',
    duration: '5 minutes',
    instructions: [
      'Lie face down on a bed with your knee and lower leg hanging off the edge.',
      'Let gravity gently straighten your knee.',
      'Hold for 5 minutes.',
    ],
    phase: 1,
  },
  {
    id: 'p1_slr',
    name: 'Straight Leg Raises',
    description: 'Lift the entire leg while keeping the knee locked straight.',
    sets: '2',
    reps: '10',
    instructions: [
      'Lie on your back. Tighten your quad to lock the knee.',
      'Lift your leg about 12 inches off the surface.',
      'Hold for 3 seconds, then slowly lower.',
    ],
    phase: 1,
  },
  {
    id: 'p1_ankle_pumps',
    name: 'Ankle Pumps',
    description: 'Pump your ankle up and down to improve circulation and prevent blood clots.',
    reps: '20-30 every hour',
    instructions: [
      'While lying or sitting, point your toes down (plantar flexion).',
      'Then pull your toes up toward your shin (dorsiflexion).',
      'Repeat rapidly. Do this every hour while awake.',
    ],
    phase: 1,
  },

  // ── Phase 2: Early Strengthening (Weeks 2-6) ──
  {
    id: 'p2_stationary_bike',
    name: 'Stationary Bike',
    description: 'Low-resistance cycling to improve range of motion and circulation.',
    duration: '10-15 minutes',
    instructions: [
      'Set the bike to low or zero resistance.',
      'Pedal gently, focusing on achieving full rotation.',
      'Increase duration gradually as tolerated.',
    ],
    phase: 2,
  },
  {
    id: 'p2_mini_squats',
    name: 'Mini Squats (0-60 degrees)',
    description: 'Partial squats to begin weight-bearing strengthening.',
    sets: '3',
    reps: '10',
    instructions: [
      'Stand with feet shoulder-width apart, holding a chair for balance.',
      'Slowly bend knees to about 60 degrees (quarter squat).',
      'Keep weight evenly distributed. Do not let knees go past toes.',
      'Return to standing.',
    ],
    phase: 2,
  },
  {
    id: 'p2_step_ups',
    name: 'Step-Ups (4-inch)',
    description: 'Step up onto a low platform to build quadriceps strength.',
    sets: '3',
    reps: '10 each leg',
    instructions: [
      'Stand in front of a 4-inch step.',
      'Step up with your surgical leg, pushing through the heel.',
      'Bring the other foot up, then step back down.',
    ],
    phase: 2,
  },
  {
    id: 'p2_hamstring_curls',
    name: 'Standing Hamstring Curls',
    description: 'Curl your heel toward your buttock while standing.',
    sets: '3',
    reps: '10',
    instructions: [
      'Stand holding a chair for balance.',
      'Slowly curl your heel toward your buttock.',
      'Hold briefly at the top, then lower slowly.',
    ],
    phase: 2,
  },
  {
    id: 'p2_calf_raises',
    name: 'Bilateral Calf Raises',
    description: 'Rise up on both toes to strengthen the calves.',
    sets: '3',
    reps: '15',
    instructions: [
      'Stand on both feet near a wall for balance.',
      'Rise up on your toes as high as possible.',
      'Hold for 2 seconds, then slowly lower.',
    ],
    phase: 2,
  },
  {
    id: 'p2_quad_stretch',
    name: 'Prone Quadriceps Stretch',
    description: 'Lie face down and gently pull your heel toward your buttock.',
    duration: '30 seconds x 3',
    instructions: [
      'Lie face down. Loop a towel around your ankle.',
      'Gently pull your heel toward your buttock until you feel a stretch in the front of your thigh.',
      'Hold for 30 seconds. Repeat 3 times.',
    ],
    phase: 2,
  },

  // ── Phase 3: Progressive Strengthening (Weeks 6-16) ──
  {
    id: 'p3_back_squats',
    name: 'Back Squats (70% Body Weight)',
    description: 'Loaded squats to build significant quadriceps and glute strength.',
    sets: '4',
    reps: '8-10',
    instructions: [
      'Use a barbell loaded to approximately 70% of body weight.',
      'Squat to at least 90 degrees of knee flexion.',
      'Keep core tight, chest up, and knees tracking over toes.',
    ],
    phase: 3,
  },
  {
    id: 'p3_eccentric_step_ups',
    name: 'Eccentric Step-Ups (6-8 inch)',
    description: 'Step down slowly from a raised platform to build eccentric control.',
    sets: '3',
    reps: '10 each leg',
    instructions: [
      'Stand on a 6-8 inch platform on your surgical leg.',
      'Slowly lower the opposite foot to the ground over 3-4 seconds.',
      'Push back up to standing. Focus on control, not speed.',
    ],
    phase: 3,
  },
  {
    id: 'p3_single_leg_press',
    name: 'Single-Leg Press',
    description: 'Unilateral leg press to address strength asymmetry.',
    sets: '3',
    reps: '10 each leg',
    instructions: [
      'Sit in a leg press machine with one foot on the platform.',
      'Press to full extension without locking the knee.',
      'Lower slowly with control.',
    ],
    phase: 3,
  },
  {
    id: 'p3_double_leg_box_jumps',
    name: 'Double-Leg Box Jumps',
    description: 'Bilateral plyometrics to begin retraining explosive power.',
    sets: '3',
    reps: '8',
    instructions: [
      'Stand in front of a low box (8-12 inches).',
      'Jump onto the box with both feet, landing softly with bent knees.',
      'Step down (do not jump down). Repeat.',
    ],
    phase: 3,
  },
  {
    id: 'p3_balance_board',
    name: 'Balance Board / BOSU Training',
    description: 'Proprioceptive training on an unstable surface.',
    duration: '2-3 minutes per leg',
    instructions: [
      'Stand on a balance board or BOSU ball on your surgical leg.',
      'Maintain balance while keeping your knee slightly bent.',
      'Progress to closing your eyes once stable.',
    ],
    phase: 3,
  },

  // ── Phase 4: Sport-Specific Training (Weeks 16-24) ──
  {
    id: 'p4_forward_backward_runs',
    name: 'Forward/Backward Running',
    description: 'Linear running at progressive speeds.',
    duration: '10-15 minutes',
    instructions: [
      'Begin with a light jog forward for 50 meters.',
      'Turn and jog backward at moderate pace.',
      'Gradually increase speed over sessions.',
    ],
    phase: 4,
  },
  {
    id: 'p4_side_shuffles',
    name: 'Side Shuffles',
    description: 'Lateral movement drill for agility.',
    sets: '4',
    reps: '20 meters each direction',
    instructions: [
      'Assume an athletic stance with knees slightly bent.',
      'Shuffle laterally, keeping hips low and feet apart.',
      'Do not cross your feet. Stay on the balls of your feet.',
    ],
    phase: 4,
  },
  {
    id: 'p4_carioca',
    name: 'Carioca Steps',
    description: 'Crossover stepping drill for hip and knee coordination.',
    sets: '3',
    reps: '20 meters each direction',
    instructions: [
      'Move laterally, alternating crossing your trailing foot in front and behind.',
      'Keep your hips facing forward while your legs cross over.',
      'Increase speed gradually.',
    ],
    phase: 4,
  },
  {
    id: 'p4_zigzag_runs',
    name: 'Zig-Zag Runs',
    description: 'Cutting drill with cones for multi-directional agility.',
    sets: '4',
    reps: '5 cones',
    instructions: [
      'Set up cones in a zig-zag pattern about 5 meters apart.',
      'Sprint to each cone and plant/cut to change direction.',
      'Focus on keeping your knee over your toes during cuts.',
    ],
    phase: 4,
  },
  {
    id: 'p4_tuck_jumps',
    name: 'Tuck Jumps',
    description: 'High-intensity plyometric jump bringing knees to chest.',
    sets: '3',
    reps: '8',
    instructions: [
      'Stand with feet hip-width apart.',
      'Jump vertically, driving knees toward your chest.',
      'Land softly with bent knees. Reset between each rep.',
    ],
    phase: 4,
  },
  {
    id: 'p4_single_leg_hops',
    name: 'Single-Leg Hops',
    description: 'Unilateral hopping for power and confidence.',
    sets: '3',
    reps: '5 each leg',
    instructions: [
      'Stand on your surgical leg.',
      'Hop forward, landing on the same leg.',
      'Stick the landing for 2 seconds before hopping again.',
    ],
    phase: 4,
  },

  // ── Phase 5: Return to Sport (Weeks 24+) ──
  {
    id: 'p5_full_speed_sprints',
    name: 'Full-Speed Sprints',
    description: 'Unrestricted sprinting at maximal effort.',
    sets: '5',
    reps: '40 meters',
    instructions: [
      'Warm up thoroughly before sprinting.',
      'Sprint at 100% effort for 40 meters.',
      'Walk back to start for recovery. Repeat.',
    ],
    phase: 5,
  },
  {
    id: 'p5_reactive_agility',
    name: 'Reactive Agility Drills',
    description: 'Unpredictable direction changes responding to visual cues.',
    duration: '15-20 minutes',
    instructions: [
      'Have a partner point in random directions.',
      'React and sprint/cut to the indicated direction.',
      'Simulate game-like unpredictable movements.',
    ],
    phase: 5,
  },
  {
    id: 'p5_sport_simulation',
    name: 'Sport-Specific Simulation',
    description: 'Full practice drills mimicking your sport.',
    duration: '30-45 minutes',
    instructions: [
      'Participate in non-contact practice sessions.',
      'Gradually progress to full-contact practice.',
      'Monitor for any pain, swelling, or instability.',
    ],
    phase: 5,
  },
  {
    id: 'p5_single_leg_squat',
    name: 'Pistol Squats (Single-Leg Squat)',
    description: 'Advanced single-leg strength and balance test.',
    sets: '3',
    reps: '5 each leg',
    instructions: [
      'Stand on one leg with the other extended forward.',
      'Squat down as low as possible while maintaining balance.',
      'Push back up to standing without assistance.',
    ],
    phase: 5,
  },
];

export function getExercisesForPhase(phase: RehabPhase): Exercise[] {
  return EXERCISES.filter((e) => e.phase === phase);
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function getAllExercisesUpToPhase(phase: RehabPhase): Exercise[] {
  return EXERCISES.filter((e) => e.phase <= phase);
}
