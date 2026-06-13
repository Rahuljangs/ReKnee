import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppColors } from '@/src/utils/useAppColorScheme';
import Colors from '@/constants/Colors';
import { DEV_MODE } from '@/src/config/constants';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
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
        {DEV_MODE && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>DEV MODE — Firebase bypassed</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.googleButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={signInWithGoogle}
        >
          {DEV_MODE ? (
            <Text style={styles.googleButtonText}>Continue as Dev User</Text>
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
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
  devBanner: {
    backgroundColor: Colors.brand.warning,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  devBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
