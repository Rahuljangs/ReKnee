import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { UserProfile, GraftType } from '@/src/types';

interface AuthState {
  user: { uid: string; displayName: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isNewUser: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveOnboardingProfile: (surgeryDate: Date, graftType: GraftType, initialPhase: number, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  USER: '@reknee_user',
  PROFILE: '@reknee_profile',
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isNewUser: false,
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadFromStorage();
    } else {
      initNativeAuth();
    }
  }, []);

  async function loadFromStorage() {
    try {
      const [userJson, profileJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
      ]);
      if (userJson) {
        const user = JSON.parse(userJson);
        const profile = profileJson ? deserializeProfile(JSON.parse(profileJson)) : null;
        setState({ user, profile, loading: false, isNewUser: !profile });
      } else {
        setState({ user: null, profile: null, loading: false, isNewUser: false });
      }
    } catch {
      setState({ user: null, profile: null, loading: false, isNewUser: false });
    }
  }

  async function initNativeAuth() {
    try {
      const auth = require('@react-native-firebase/auth').default;
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      GoogleSignin.configure({
        webClientId: '271119981552-kdbaao7g4ljhvuc19kb27rn8l1c9rmjq.apps.googleusercontent.com',
      });

      auth().onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
          const user = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? '',
            email: firebaseUser.email ?? '',
          };
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

          const profileJson = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
          const profile = profileJson ? deserializeProfile(JSON.parse(profileJson)) : null;
          setState({ user, profile, loading: false, isNewUser: !profile });
        } else {
          setState({ user: null, profile: null, loading: false, isNewUser: false });
        }
      });
    } catch (error) {
      console.error('Native auth init error:', error);
      loadFromStorage();
    }
  }

  async function signIn() {
    if (Platform.OS === 'web') {
      const user = { uid: 'web_user_' + Date.now().toString(36), displayName: '', email: '' };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      const profileJson = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      const profile = profileJson ? deserializeProfile(JSON.parse(profileJson)) : null;
      setState({ user, profile, loading: false, isNewUser: !profile });
      return;
    }

    try {
      const auth = require('@react-native-firebase/auth').default;
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('No ID token received');
      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  async function signOut() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER, STORAGE_KEYS.PROFILE,
      '@reknee_messages', '@reknee_daily_logs', '@reknee_completed_exercises',
    ]);

    if (Platform.OS !== 'web') {
      try {
        const auth = require('@react-native-firebase/auth').default;
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        try { await GoogleSignin.revokeAccess(); } catch {}
        await auth().signOut();
      } catch {}
    }

    setState({ user: null, profile: null, loading: false, isNewUser: false });
  }

  async function saveOnboardingProfile(surgeryDate: Date, graftType: GraftType, initialPhase: number, name: string) {
    const profile: UserProfile = {
      uid: state.user!.uid,
      displayName: name || state.user!.displayName || '',
      surgeryDate,
      graftType,
      currentPhase: initialPhase as UserProfile['currentPhase'],
      phaseUpdatedAt: new Date(),
      isPremium: true,
      pushToken: null,
      createdAt: new Date(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    setState((prev) => ({ ...prev, profile, isNewUser: false }));
  }

  async function refreshProfile() {
    const profileJson = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    if (profileJson) {
      const profile = deserializeProfile(JSON.parse(profileJson));
      setState((prev) => ({ ...prev, profile, isNewUser: false }));
    }
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signOut, refreshProfile, saveOnboardingProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function deserializeProfile(data: any): UserProfile {
  return {
    ...data,
    surgeryDate: new Date(data.surgeryDate),
    phaseUpdatedAt: new Date(data.phaseUpdatedAt),
    createdAt: new Date(data.createdAt),
  };
}
