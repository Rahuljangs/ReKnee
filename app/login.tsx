import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppColors } from '@/src/utils/useAppColorScheme';
import Colors from '@/constants/Colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>🦵</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>ReKnee</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Your ACL Recovery Companion
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Daily check-ins, guided exercises, and intelligent progress tracking
          — all powered by AI.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={signIn}
        >
          <Text style={styles.startButtonText}>Get Started</Text>
        </Pressable>

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          This app is a wellness companion and does not provide medical diagnosis
          or treatment.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: Colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  bottom: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: Colors.brand.primary,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
