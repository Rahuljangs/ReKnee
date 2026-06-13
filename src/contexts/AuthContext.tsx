import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  saveOnboardingProfile: (surgeryDate: Date, graftType: GraftType, initialPhase: number) => Promise<void>;
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
    loadStoredState();
  }, []);

  async function loadStoredState() {
    try {
      const [userJson, profileJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
      ]);

      if (userJson) {
        const user = JSON.parse(userJson);
        const profile = profileJson ? JSON.parse(profileJson) : null;

        if (profile) {
          profile.surgeryDate = new Date(profile.surgeryDate);
          profile.phaseUpdatedAt = new Date(profile.phaseUpdatedAt);
          profile.createdAt = new Date(profile.createdAt);
        }

        setState({
          user,
          profile,
          loading: false,
          isNewUser: !profile,
        });
      } else {
        setState({ user: null, profile: null, loading: false, isNewUser: false });
      }
    } catch {
      setState({ user: null, profile: null, loading: false, isNewUser: false });
    }
  }

  async function signIn() {
    const user = {
      uid: 'user_' + Date.now().toString(36),
      displayName: '',
      email: '',
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    const existingProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    if (existingProfile) {
      const profile = JSON.parse(existingProfile);
      profile.surgeryDate = new Date(profile.surgeryDate);
      profile.phaseUpdatedAt = new Date(profile.phaseUpdatedAt);
      profile.createdAt = new Date(profile.createdAt);
      setState({ user, profile, loading: false, isNewUser: false });
    } else {
      setState({ user, profile: null, loading: false, isNewUser: true });
    }
  }

  async function signOut() {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.PROFILE, '@reknee_messages', '@reknee_daily_logs', '@reknee_completed_exercises']);
    setState({ user: null, profile: null, loading: false, isNewUser: false });
  }

  async function saveOnboardingProfile(surgeryDate: Date, graftType: GraftType, initialPhase: number) {
    const profile: UserProfile = {
      uid: state.user!.uid,
      displayName: state.user!.displayName,
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
      const profile = JSON.parse(profileJson);
      profile.surgeryDate = new Date(profile.surgeryDate);
      profile.phaseUpdatedAt = new Date(profile.phaseUpdatedAt);
      profile.createdAt = new Date(profile.createdAt);
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
