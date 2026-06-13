import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEV_MODE } from '@/src/config/constants';
import type { UserProfile, GraftType } from '@/src/types';

interface AuthState {
  user: { uid: string; displayName: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isNewUser: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>;
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

function DevAuthProvider({ children }: { children: React.ReactNode }) {
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

  async function signInWithGoogle() {
    const mockUser = {
      uid: 'dev_user_001',
      displayName: 'Dev User',
      email: 'dev@reknee.test',
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));

    const existingProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);

    if (existingProfile) {
      const profile = JSON.parse(existingProfile);
      profile.surgeryDate = new Date(profile.surgeryDate);
      profile.phaseUpdatedAt = new Date(profile.phaseUpdatedAt);
      profile.createdAt = new Date(profile.createdAt);

      setState({ user: mockUser, profile, loading: false, isNewUser: false });
    } else {
      setState({ user: mockUser, profile: null, loading: false, isNewUser: true });
    }
  }

  async function signOut() {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.PROFILE]);
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
      value={{ ...state, signInWithGoogle, signOut, refreshProfile, saveOnboardingProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function ProdAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isNewUser: false,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const auth = require('@react-native-firebase/auth').default;
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const firestore = require('@react-native-firebase/firestore').default;

      GoogleSignin.configure({
        webClientId: '271119981552-kdbaao7g4ljhvuc19kb27rn8l1c9rmjq.apps.googleusercontent.com',
      });

      unsubscribe = auth().onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
          const profileDoc = await firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .get();

          if (profileDoc.exists()) {
            const data = profileDoc.data()!;
            setState({
              user: {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName ?? '',
                email: firebaseUser.email ?? '',
              },
              profile: {
                uid: firebaseUser.uid,
                displayName: data.displayName ?? firebaseUser.displayName ?? '',
                surgeryDate: data.surgeryDate?.toDate() ?? new Date(),
                graftType: data.graftType ?? 'patellar',
                currentPhase: data.currentPhase ?? 1,
                phaseUpdatedAt: data.phaseUpdatedAt?.toDate() ?? new Date(),
                isPremium: data.isPremium ?? false,
                pushToken: data.pushToken ?? null,
                createdAt: data.createdAt?.toDate() ?? new Date(),
              },
              loading: false,
              isNewUser: false,
            });
          } else {
            setState({
              user: {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName ?? '',
                email: firebaseUser.email ?? '',
              },
              profile: null,
              loading: false,
              isNewUser: true,
            });
          }
        } else {
          setState({ user: null, profile: null, loading: false, isNewUser: false });
        }
      });
    })();

    return () => unsubscribe?.();
  }, []);

  async function signInWithGoogle() {
    const auth = require('@react-native-firebase/auth').default;
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) throw new Error('No ID token received');
    const credential = auth.GoogleAuthProvider.credential(idToken);
    await auth().signInWithCredential(credential);
  }

  async function signOut() {
    const auth = require('@react-native-firebase/auth').default;
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    try { await GoogleSignin.revokeAccess(); } catch {}
    await auth().signOut();
  }

  async function saveOnboardingProfile(surgeryDate: Date, graftType: GraftType, initialPhase: number) {
    const firestore = require('@react-native-firebase/firestore').default;
    const uid = state.user!.uid;
    await firestore().collection('users').doc(uid).set({
      displayName: state.user!.displayName ?? '',
      surgeryDate: firestore.Timestamp.fromDate(surgeryDate),
      graftType,
      currentPhase: initialPhase,
      phaseUpdatedAt: firestore.FieldValue.serverTimestamp(),
      isPremium: false,
      pushToken: null,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    await refreshProfile();
  }

  async function refreshProfile() {
    if (!state.user) return;
    const firestore = require('@react-native-firebase/firestore').default;
    const profileDoc = await firestore()
      .collection('users')
      .doc(state.user.uid)
      .get();
    if (profileDoc.exists()) {
      const data = profileDoc.data()!;
      setState((prev) => ({
        ...prev,
        profile: {
          uid: prev.user!.uid,
          displayName: data.displayName ?? prev.user!.displayName ?? '',
          surgeryDate: data.surgeryDate?.toDate() ?? new Date(),
          graftType: data.graftType ?? 'patellar',
          currentPhase: data.currentPhase ?? 1,
          phaseUpdatedAt: data.phaseUpdatedAt?.toDate() ?? new Date(),
          isPremium: data.isPremium ?? false,
          pushToken: data.pushToken ?? null,
          createdAt: data.createdAt?.toDate() ?? new Date(),
        },
        isNewUser: false,
      }));
    }
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signInWithGoogle, signOut, refreshProfile, saveOnboardingProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (DEV_MODE) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }
  return <ProdAuthProvider>{children}</ProdAuthProvider>;
}
