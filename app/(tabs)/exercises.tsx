import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppColors } from '@/src/utils/useAppColorScheme';
import Colors from '@/constants/Colors';
import { getExercisesForPhase } from '@/src/services/ExerciseRegistry';
import { getPhaseInfo } from '@/src/services/ClinicalEngine';
import { getDailyMotivation } from '@/src/utils/motivationalQuotes';
import type { Exercise } from '@/src/types';
import { PHASE_NAMES } from '@/src/config/constants';

const COMPLETED_KEY = '@reknee_completed_exercises';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export default function ExercisesScreen() {
  const { profile } = useAuth();
  const colors = useAppColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCompleted();
  }, []);

  async function loadCompleted() {
    try {
      const json = await AsyncStorage.getItem(COMPLETED_KEY);
      if (json) {
        const data = JSON.parse(json);
        if (data.date === getTodayKey()) {
          setCompletedIds(new Set(data.ids));
        }
      }
    } catch {}
  }

  async function toggleComplete(id: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      AsyncStorage.setItem(
        COMPLETED_KEY,
        JSON.stringify({ date: getTodayKey(), ids: Array.from(next) })
      );
      return next;
    });
  }

  if (!profile) return null;

  const currentPhase = profile.currentPhase;
  const phaseInfo = getPhaseInfo(currentPhase);
  const exercises = getExercisesForPhase(currentPhase);
  const weeksPostOp = (
    (Date.now() - profile.surgeryDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  ).toFixed(1);

  const completedCount = exercises.filter((e) => completedIds.has(e.id)).length;
  const totalCount = exercises.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const motivation = getDailyMotivation(currentPhase);

  const sections = [
    {
      title: `Your Exercises (${completedCount}/${totalCount})`,
      data: exercises,
    },
  ];

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Phase card */}
            <View style={[styles.phaseCard, { backgroundColor: colors.surface }]}>
              <View style={styles.phaseHeader}>
                <View style={[styles.phaseBadge, { backgroundColor: Colors.brand.primaryLight }]}>
                  <Text style={[styles.phaseBadgeText, { color: Colors.brand.primary }]}>
                    Phase {currentPhase}
                  </Text>
                </View>
                <Text style={[styles.weekText, { color: colors.textSecondary }]}>
                  Week {weeksPostOp}
                </Text>
              </View>
              <Text style={[styles.phaseTitle, { color: colors.text }]}>
                {phaseInfo.name}
              </Text>
              <Text style={[styles.phaseDescription, { color: colors.textSecondary }]}>
                {phaseInfo.description}
              </Text>

              {/* Progress bar */}
              <View style={styles.progressSection}>
                <View style={[styles.progressTrack, { backgroundColor: colors.inputBackground }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: progressPct === 100
                          ? Colors.brand.secondary
                          : Colors.brand.primary,
                        width: `${progressPct}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: progressPct === 100 ? Colors.brand.secondary : colors.textSecondary }]}>
                  {progressPct === 100
                    ? 'All done for today!'
                    : `${completedCount} of ${totalCount} completed`}
                </Text>
              </View>

              {/* Phase dots */}
              <View style={styles.dotsContainer}>
                {[1, 2, 3, 4, 5].map((phase) => (
                  <View
                    key={phase}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          phase <= currentPhase
                            ? Colors.brand.primary
                            : colors.border,
                      },
                      phase === currentPhase && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Daily tip */}
            <View style={[styles.tipCard, { backgroundColor: Colors.brand.secondaryLight }]}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={[styles.tipText, { color: '#1B5E20' }]}>
                {motivation.tip}
              </Text>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const isCompleted = completedIds.has(item.id);

          return (
            <View style={[styles.exerciseCard, { backgroundColor: colors.surface, opacity: isCompleted ? 0.8 : 1 }]}>
              <View style={styles.exerciseRow}>
                {/* Checkbox */}
                <Pressable
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isCompleted ? Colors.brand.secondary : colors.border,
                      backgroundColor: isCompleted ? Colors.brand.secondary : 'transparent',
                    },
                  ]}
                  onPress={() => toggleComplete(item.id)}
                >
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>

                {/* Exercise info */}
                <Pressable
                  style={styles.exerciseContent}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.exerciseHeader}>
                    <Text
                      style={[
                        styles.exerciseName,
                        { color: colors.text },
                        isCompleted && styles.completedText,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                      {isExpanded ? '−' : '+'}
                    </Text>
                  </View>
                  <Text style={[styles.exerciseDesc, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                  {(item.sets || item.reps || item.duration) && (
                    <View style={styles.prescriptionRow}>
                      {item.sets && (
                        <View style={[styles.prescriptionPill, { backgroundColor: Colors.brand.primaryLight }]}>
                          <Text style={[styles.prescriptionText, { color: Colors.brand.primary }]}>
                            {item.sets} sets
                          </Text>
                        </View>
                      )}
                      {item.reps && (
                        <View style={[styles.prescriptionPill, { backgroundColor: Colors.brand.primaryLight }]}>
                          <Text style={[styles.prescriptionText, { color: Colors.brand.primary }]}>
                            {item.reps}
                          </Text>
                        </View>
                      )}
                      {item.duration && (
                        <View style={[styles.prescriptionPill, { backgroundColor: Colors.brand.primaryLight }]}>
                          <Text style={[styles.prescriptionText, { color: Colors.brand.primary }]}>
                            {item.duration}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  {isExpanded && (
                    <View style={styles.instructions}>
                      {item.instructions.map((step, idx) => (
                        <View key={idx} style={styles.instructionRow}>
                          <Text style={[styles.instructionNumber, { color: Colors.brand.primary }]}>
                            {idx + 1}
                          </Text>
                          <Text style={[styles.instructionText, { color: colors.text }]}>
                            {step}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  phaseCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseBadgeText: { fontSize: 13, fontWeight: '700' },
  weekText: { fontSize: 14, fontWeight: '600' },
  phaseTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  phaseDescription: { fontSize: 14, lineHeight: 20 },
  progressSection: { marginTop: 16, gap: 6 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  progressDotActive: { width: 28, borderRadius: 5 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  tipIcon: { fontSize: 18 },
  tipText: { fontSize: 13, lineHeight: 19, flex: 1, fontWeight: '500' },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listContent: { paddingBottom: 32 },
  exerciseCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  exerciseContent: { flex: 1 },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: { fontSize: 16, fontWeight: '700', flex: 1 },
  completedText: { textDecorationLine: 'line-through', opacity: 0.6 },
  expandIcon: { fontSize: 22, fontWeight: '300', marginLeft: 8 },
  exerciseDesc: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  prescriptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  prescriptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prescriptionText: { fontSize: 13, fontWeight: '600' },
  instructions: {
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 10,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: '800',
    width: 20,
    textAlign: 'center',
  },
  instructionText: { fontSize: 14, lineHeight: 20, flex: 1 },
});
