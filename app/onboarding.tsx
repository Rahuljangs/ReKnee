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
import type { GraftType } from '@/src/types';
import { calculateWeeksPostOp } from '@/src/services/ClinicalEngine';

const GRAFT_OPTIONS: { value: GraftType; label: string; desc: string }[] = [
  { value: 'patellar', label: 'Patellar Tendon', desc: 'Bone-patellar tendon-bone autograft' },
  { value: 'hamstring', label: 'Hamstring Tendon', desc: 'Semitendinosus/gracilis autograft' },
  { value: 'allograft', label: 'Allograft', desc: 'Donor tissue graft' },
];

export default function OnboardingScreen() {
  const { saveOnboardingProfile } = useAuth();
  const router = useRouter();
  const colors = useAppColors();

  const [name, setName] = useState('');
  const [surgeryDate, setSurgeryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [graftType, setGraftType] = useState<GraftType | null>(null);
  const [saving, setSaving] = useState(false);

  const weeksPostOp = calculateWeeksPostOp(surgeryDate);
  const initialPhase = weeksPostOp < 2 ? 1 : weeksPostOp < 6 ? 2 : weeksPostOp < 16 ? 3 : weeksPostOp < 24 ? 4 : 5;

  function onDateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setSurgeryDate(selectedDate);
  }

  async function handleComplete() {
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Please enter your name.');
      return;
    }
    if (!graftType) {
      Alert.alert('Missing Info', 'Please select your graft type.');
      return;
    }
    if (surgeryDate > new Date()) {
      Alert.alert('Invalid Date', 'Surgery date cannot be in the future.');
      return;
    }

    setSaving(true);
    try {
      await saveOnboardingProfile(surgeryDate, graftType, initialPhase, name.trim());
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
        <Text style={[styles.title, { color: colors.text }]}>Welcome to ReKnee</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Let's set up your recovery profile. We need a couple of details to
          personalize your rehabilitation journey.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.text }]}>Your Name</Text>
        <Text style={[styles.helper, { color: colors.textSecondary }]}>
          What should we call you?
        </Text>
        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Enter your name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          maxLength={50}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.text }]}>Surgery Date</Text>
        <Text style={[styles.helper, { color: colors.textSecondary }]}>
          When was your ACL reconstruction performed?
        </Text>

        <Pressable
          style={[styles.dateButton, { backgroundColor: colors.inputBackground }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>
            {surgeryDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={surgeryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        <Text style={[styles.weekInfo, { color: Colors.brand.primary }]}>
          {weeksPostOp.toFixed(1)} weeks post-op — Starting at Phase {initialPhase}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.text }]}>Graft Type</Text>
        <Text style={[styles.helper, { color: colors.textSecondary }]}>
          Which type of graft was used in your reconstruction?
        </Text>

        {GRAFT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.graftOption,
              {
                borderColor: graftType === opt.value ? Colors.brand.primary : colors.border,
                backgroundColor: graftType === opt.value ? Colors.brand.primaryLight : 'transparent',
              },
            ]}
            onPress={() => setGraftType(opt.value)}
          >
            <View style={styles.radioOuter}>
              {graftType === opt.value && <View style={styles.radioInner} />}
            </View>
            <View style={styles.graftText}>
              <Text style={[styles.graftLabel, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[styles.graftDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          { opacity: pressed || saving ? 0.7 : 1 },
        ]}
        onPress={handleComplete}
        disabled={saving}
      >
        <Text style={styles.continueText}>
          {saving ? 'Setting up...' : 'Start My Recovery'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 80, paddingBottom: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, lineHeight: 24, marginTop: 8 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  label: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  helper: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  nameInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  dateButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dateText: { fontSize: 16, fontWeight: '500' },
  weekInfo: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  graftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.brand.primary,
  },
  graftText: { flex: 1 },
  graftLabel: { fontSize: 16, fontWeight: '600' },
  graftDesc: { fontSize: 13, marginTop: 2 },
  continueButton: {
    backgroundColor: Colors.brand.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
