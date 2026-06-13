import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, BackHandler, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

export default function DVTEmergencyScreen() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(15);
  const canDismiss = secondsLeft <= 0;

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => !canDismiss);
    return () => handler.remove();
  }, [canDismiss]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function callEmergency() {
    Linking.openURL('tel:911');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} bounces={false}>
      <View style={styles.alertBanner}>
        <Text style={styles.alertIcon}>⚠️</Text>
        <Text style={styles.alertTitle}>MEDICAL ALERT</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.heading}>
          Potential Deep Vein Thrombosis Detected
        </Text>

        <Text style={styles.description}>
          Based on the symptoms you described, you may be experiencing signs
          consistent with a Deep Vein Thrombosis (DVT) or Pulmonary Embolism
          (PE). This is a potentially life-threatening condition.
        </Text>

        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Take These Steps NOW:</Text>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              CALL your surgeon's office immediately
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              If you cannot reach them, go to the nearest Emergency Room
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              If experiencing chest pain, shortness of breath, or rapid heart
              rate — Call 911 immediately
            </Text>
          </View>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            DO NOT massage your leg. DO NOT walk on it unnecessarily. Keep your
            leg elevated and stay as still as possible until you receive
            medical care.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.emergencyButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={callEmergency}
        >
          <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
        </Pressable>

        {canDismiss ? (
          <Pressable
            style={({ pressed }) => [
              styles.dismissButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.dismissText}>
              I understand — return to app
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.timerText}>
            Please read the information above ({secondsLeft}s)
          </Text>
        )}

        <Text style={styles.disclaimer}>
          This app cannot provide medical diagnosis. Only a qualified medical
          professional can evaluate your condition.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0000',
  },
  content: {
    flexGrow: 1,
  },
  alertBanner: {
    backgroundColor: Colors.brand.danger,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  alertIcon: { fontSize: 48, marginBottom: 8 },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  body: {
    flex: 1,
    padding: 24,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  stepsContainer: { marginBottom: 24 },
  stepsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.danger,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.brand.danger,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  emergencyButton: {
    backgroundColor: Colors.brand.danger,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  dismissButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dismissText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  timerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
