import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppColors } from '@/src/utils/useAppColorScheme';
import Colors from '@/constants/Colors';

const PREMIUM_FEATURES = [
  {
    icon: '💪',
    title: 'Phase 3-5 Exercises',
    desc: 'Progressive strengthening, sport-specific drills, and return-to-sport protocols',
  },
  {
    icon: '🧠',
    title: 'Advanced AI Coaching',
    desc: 'Personalized recovery guidance through all 5 phases of rehabilitation',
  },
  {
    icon: '📊',
    title: 'Full Progress Tracking',
    desc: 'Complete symptom tracking and exercise logging through your entire recovery',
  },
  {
    icon: '🛡️',
    title: 'Safety Monitoring',
    desc: 'Continuous DVT symptom screening throughout your full recovery journey',
  },
];

export default function PaywallScreen() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const colors = useAppColors();
  const [purchasing, setPurchasing] = useState(false);

  async function handlePurchase() {
    setPurchasing(true);
    try {
      const Purchases = require('react-native-purchases').default;
      const offerings = await Purchases.getOfferings();
      const currentPackage = offerings.current?.availablePackages[0];
      if (!currentPackage) {
        Alert.alert('Error', 'No subscription packages available.');
        return;
      }
      const { customerInfo } = await Purchases.purchasePackage(currentPackage);
      if (customerInfo.entitlements.active['premium']) {
        await refreshProfile();
        Alert.alert('Welcome to Premium!', 'You now have access to your full recovery program.', [
          { text: 'Continue', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🏆</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Unlock Your Full Recovery
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          You've completed Phase 1 and 2 — great progress! Continue your
          rehabilitation journey with expert-guided exercises through return
          to sport.
        </Text>
      </View>

      <View style={styles.features}>
        {PREMIUM_FEATURES.map((feature, idx) => (
          <View key={idx} style={[styles.featureRow, { backgroundColor: colors.surface }]}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                {feature.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.purchaseButton,
          { opacity: pressed || purchasing ? 0.7 : 1 },
        ]}
        onPress={handlePurchase}
        disabled={purchasing}
      >
        <Text style={styles.purchaseButtonText}>
          {purchasing ? 'Processing...' : 'Start Premium'}
        </Text>
        <Text style={styles.purchasePrice}>Free trial, then $4.99/month</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          Maybe later
        </Text>
      </Pressable>

      <Text style={[styles.legal, { color: colors.textSecondary }]}>
        Payment will be charged to your Google Play account. Subscription
        automatically renews unless canceled at least 24 hours before the end
        of the current period. Manage in Google Play settings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  headerEmoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  features: { gap: 12, marginBottom: 32 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  featureIcon: { fontSize: 32 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '700' },
  featureDesc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  purchaseButton: {
    backgroundColor: Colors.brand.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  purchasePrice: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  skipText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  legal: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
