import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { DEV_MODE } from '@/src/config/constants';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !profile) return;
    if (DEV_MODE) return;

    // Only init Firebase-dependent services in production mode
    (async () => {
      const { registerForPushNotifications, addNotificationListeners } =
        await import('@/src/services/NotificationService');
      const { configurePurchases } = await import('@/src/services/PurchaseService');

      registerForPushNotifications(user.uid);
      configurePurchases(user.uid);

      const cleanup = addNotificationListeners((data) => {
        if (data.type === 'daily_checkin') {
          router.push('/(tabs)');
        }
      });

      return cleanup;
    })();
  }, [user, profile, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppInitializer>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen
            name="dvt-emergency"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              title: 'Unlock Full Recovery',
              presentation: 'modal',
            }}
          />
        </Stack>
      </AppInitializer>
    </AuthProvider>
  );
}
