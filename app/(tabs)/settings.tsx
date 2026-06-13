import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppColors } from '@/src/utils/useAppColorScheme';
import Colors from '@/constants/Colors';
import { PHASE_NAMES, APP_VERSION } from '@/src/config/constants';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const colors = useAppColors();

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (!profile) return null;

  const weeksPostOp = (
    (Date.now() - profile.surgeryDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  ).toFixed(1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: Colors.brand.primaryLight }]}>
          <Text style={styles.avatarText}>
            {(profile.displayName || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {profile.displayName || 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user?.email ?? ''}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          RECOVERY STATUS
        </Text>
        <SettingRow
          label="Current Phase"
          value={`Phase ${profile.currentPhase} — ${PHASE_NAMES[profile.currentPhase]}`}
          colors={colors}
        />
        <SettingRow
          label="Weeks Post-Op"
          value={`${weeksPostOp} weeks`}
          colors={colors}
        />
        <SettingRow
          label="Surgery Date"
          value={profile.surgeryDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          colors={colors}
        />
        <SettingRow
          label="Graft Type"
          value={
            profile.graftType === 'patellar'
              ? 'Patellar Tendon'
              : profile.graftType === 'hamstring'
                ? 'Hamstring Tendon'
                : 'Allograft'
          }
          colors={colors}
        />
        <SettingRow
          label="Subscription"
          value={profile.isPremium ? 'Premium' : 'Free'}
          colors={colors}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ABOUT
        </Text>
        <SettingRow label="App Version" value={APP_VERSION} colors={colors} />
        <SettingRow label="AI Model" value="Llama 3.3 70B" colors={colors} />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.signOutButton,
          { opacity: pressed ? 0.7 : 1, backgroundColor: colors.surface },
        ]}
        onPress={handleSignOut}
      >
        <Text style={[styles.signOutText, { color: Colors.brand.danger }]}>
          Sign Out
        </Text>
      </Pressable>

      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        ReKnee is a wellness companion and adherence tracker. It does not
        provide medical diagnosis or treatment. Always consult your physician
        or physiotherapist before making changes to your rehabilitation
        program.
      </Text>
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof import('@/src/utils/useAppColorScheme').useAppColors>;
}) {
  return (
    <View style={settingStyles.row}>
      <Text style={[settingStyles.label, { color: colors.text }]}>{label}</Text>
      <Text style={[settingStyles.value, { color: colors.textSecondary }]}>
        {value}
      </Text>
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  label: { fontSize: 16 },
  value: { fontSize: 15, maxWidth: '55%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.brand.primary },
  userName: { fontSize: 22, fontWeight: '700' },
  userEmail: { fontSize: 14, marginTop: 4 },
  section: {
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  signOutButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutText: { fontSize: 17, fontWeight: '600' },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
});
