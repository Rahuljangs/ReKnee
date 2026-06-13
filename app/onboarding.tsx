import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppColors } from '@/src/utils/useAppColorScheme';
import Colors from '@/constants/Colors';
import type { GraftType, MeniscusStatus } from '@/src/types';
import { calculateWeeksPostOp } from '@/src/services/ClinicalEngine';

const GRAFT_OPTIONS: { value: GraftType; label: string; desc: string }[] = [
  { value: 'patellar', label: 'Patellar Tendon (BTB)', desc: 'Bone-patellar tendon-bone autograft — the gold standard' },
  { value: 'hamstring', label: 'Hamstring Tendon', desc: 'Semitendinosus and/or gracilis autograft' },
  { value: 'quadriceps', label: 'Quadriceps Tendon', desc: 'Quad tendon autograft — increasingly popular' },
  { value: 'peroneus_longus', label: 'Peroneus Longus', desc: 'Peroneus longus tendon autograft from the ankle' },
  { value: 'allograft', label: 'Allograft (Donor)', desc: 'Cadaver tissue graft — no donor site morbidity' },
  { value: 'other', label: 'Other', desc: 'Specify your graft type below' },
];

const MENISCUS_OPTIONS: { value: MeniscusStatus; label: string; desc: string }[] = [
  { value: 'none', label: 'No meniscus procedure', desc: 'ACL reconstruction only' },
  { value: 'repair', label: 'Meniscus Repair', desc: 'Meniscus was sutured — affects weight-bearing restrictions' },
  { value: 'meniscectomy', label: 'Meniscus Trim (Meniscectomy)', desc: 'Damaged portion was removed' },
  { value: 'unknown', label: "I'm not sure", desc: "That's okay — we'll ask your surgeon" },
];

export default function OnboardingScreen() {
  const { user, saveOnboardingProfile } = useAuth();
  const router = useRouter();
  const colors = useAppColors();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.displayName ?? '');
  const [ageText, setAgeText] = useState('');
  const [surgeryDate, setSurgeryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [graftType, setGraftType] = useState<GraftType | null>(null);
  const [customGraft, setCustomGraft] = useState('');
  const [meniscusStatus, setMeniscusStatus] = useState<MeniscusStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const weeksPostOp = calculateWeeksPostOp(surgeryDate);
  const initialPhase = weeksPostOp < 2 ? 1 : weeksPostOp < 6 ? 2 : weeksPostOp < 16 ? 3 : weeksPostOp < 24 ? 4 : 5;

  function onDateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setSurgeryDate(selectedDate);
  }

  function handleNextStep() {
    if (step === 1) {
      if (!name.trim()) { Alert.alert('Missing Info', 'Please enter your name.'); return; }
      if (!ageText.trim() || isNaN(parseInt(ageText))) { Alert.alert('Missing Info', 'Please enter your age.'); return; }
      setStep(2);
    } else if (step === 2) {
      if (surgeryDate > new Date()) { Alert.alert('Invalid Date', 'Surgery date cannot be in the future.'); return; }
      if (!graftType) { Alert.alert('Missing Info', 'Please select your graft type.'); return; }
      if (graftType === 'other' && !customGraft.trim()) { Alert.alert('Missing Info', 'Please describe your graft type.'); return; }
      setStep(3);
    }
  }

  async function handleComplete() {
    if (!meniscusStatus) {
      Alert.alert('Missing Info', 'Please select your meniscus status.');
      return;
    }

    setSaving(true);
    try {
      await saveOnboardingProfile({
        surgeryDate,
        graftType: graftType!,
        graftTypeCustom: graftType === 'other' ? customGraft.trim() : undefined,
        meniscusStatus,
        initialPhase,
        name: name.trim(),
        age: parseInt(ageText),
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 1 ? 'About You' : step === 2 ? 'Your Surgery' : 'One More Thing'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 1
            ? "Let's get to know you so we can personalize your recovery."
            : step === 2
              ? 'Tell us about your ACL reconstruction.'
              : 'This helps us tailor your exercise restrictions.'}
        </Text>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                { backgroundColor: s <= step ? Colors.brand.primary : colors.border },
                s === step && styles.stepDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {step === 1 && (
        <>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.text }]}>Your Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="What should we call you?"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.text }]}>Your Age</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="e.g., 28"
              placeholderTextColor={colors.textSecondary}
              value={ageText}
              onChangeText={setAgeText}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <Pressable style={({ pressed }) => [styles.nextButton, { opacity: pressed ? 0.7 : 1 }]} onPress={handleNextStep}>
            <Text style={styles.nextText}>Next</Text>
          </Pressable>
        </>
      )}

      {step === 2 && (
        <>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.text }]}>Surgery Date</Text>
            <Pressable
              style={[styles.dateButton, { backgroundColor: colors.inputBackground }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {surgeryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker value={surgeryDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={new Date()} onChange={onDateChange} />
            )}
            <Text style={[styles.weekInfo, { color: Colors.brand.primary }]}>
              {weeksPostOp.toFixed(1)} weeks post-op — Phase {initialPhase}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.text }]}>Graft Type</Text>
            {GRAFT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.option, { borderColor: graftType === opt.value ? Colors.brand.primary : colors.border, backgroundColor: graftType === opt.value ? Colors.brand.primaryLight : 'transparent' }]}
                onPress={() => setGraftType(opt.value)}
              >
                <View style={styles.radioOuter}>{graftType === opt.value && <View style={styles.radioInner} />}</View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.optDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
                </View>
              </Pressable>
            ))}
            {graftType === 'other' && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, marginTop: 4 }]}
                placeholder="e.g., LARS synthetic, tibialis anterior..."
                placeholderTextColor={colors.textSecondary}
                value={customGraft}
                onChangeText={setCustomGraft}
                maxLength={100}
              />
            )}
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1, borderColor: colors.border }]} onPress={() => setStep(1)}>
              <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.nextButton, { opacity: pressed ? 0.7 : 1, flex: 1 }]} onPress={handleNextStep}>
              <Text style={styles.nextText}>Next</Text>
            </Pressable>
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.text }]}>Meniscus Status</Text>
            <Text style={[styles.helper, { color: colors.textSecondary }]}>
              Did your surgeon also repair or trim your meniscus during the ACL surgery?
              This significantly affects your early rehab restrictions.
            </Text>
            {MENISCUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.option, { borderColor: meniscusStatus === opt.value ? Colors.brand.primary : colors.border, backgroundColor: meniscusStatus === opt.value ? Colors.brand.primaryLight : 'transparent' }]}
                onPress={() => setMeniscusStatus(opt.value)}
              >
                <View style={styles.radioOuter}>{meniscusStatus === opt.value && <View style={styles.radioInner} />}</View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.optDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {meniscusStatus === 'repair' && (
            <View style={[styles.warningCard, { backgroundColor: Colors.brand.dangerLight }]}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={[styles.warningText, { color: Colors.brand.danger }]}>
                Meniscus repair significantly restricts early weight-bearing and knee bending.
                Your exercises will be adjusted to protect the repair.
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1, borderColor: colors.border }]} onPress={() => setStep(2)}>
              <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.nextButton, { opacity: pressed || saving ? 0.7 : 1, flex: 1 }]}
              onPress={handleComplete}
              disabled={saving}
            >
              <Text style={styles.nextText}>{saving ? 'Setting up...' : 'Start My Recovery'}</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
  header: { marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 6, color: '#6B7280' },
  stepIndicator: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepDotActive: { width: 28, borderRadius: 5 },
  card: { borderRadius: 16, padding: 20, marginBottom: 16 },
  label: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  helper: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  input: { borderRadius: 12, padding: 16, fontSize: 16 },
  dateButton: { borderRadius: 12, padding: 16, alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '500' },
  weekInfo: { fontSize: 14, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 2, padding: 14, marginBottom: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand.primary },
  optLabel: { fontSize: 15, fontWeight: '600' },
  optDesc: { fontSize: 12, marginTop: 2 },
  warningCard: { flexDirection: 'row', borderRadius: 12, padding: 14, marginBottom: 16, gap: 10, alignItems: 'flex-start' },
  warningIcon: { fontSize: 20 },
  warningText: { fontSize: 13, lineHeight: 19, flex: 1, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backButton: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', borderWidth: 1.5 },
  backText: { fontSize: 16, fontWeight: '600' },
  nextButton: { backgroundColor: Colors.brand.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
