import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types/form';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile document with Firestore /users/{uid}
  const syncUserProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: data.displayName || firebaseUser.displayName || 'Formora User',
          avatarUrl: data.photoURL || firebaseUser.photoURL || undefined,
          tier: data.tier || 'free',
          workspaces: [{ id: 'ws-main', name: 'Primary Workspace' }],
          currentWorkspaceId: 'ws-main',
          monthlyResponsesUsed: 0,
          monthlyResponsesLimit: 500,
          aiGenerationsUsed: 0,
          aiGenerationsLimit: 25,
        });
      } else {
        // Create initial profile in Firestore
        const newProfileData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Formora User',
          photoURL: firebaseUser.photoURL || '',
          tier: 'free',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfileData);
        setProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: newProfileData.displayName,
          avatarUrl: newProfileData.photoURL || undefined,
          tier: 'free',
          workspaces: [{ id: 'ws-main', name: 'Primary Workspace' }],
          currentWorkspaceId: 'ws-main',
          monthlyResponsesUsed: 0,
          monthlyResponsesLimit: 500,
          aiGenerationsUsed: 0,
          aiGenerationsLimit: 25,
        });
      }
    } catch (err) {
      console.warn('Profile sync fallback:', err);
      // Fallback local representation while connecting
      setProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Formora User',
        avatarUrl: firebaseUser.photoURL || undefined,
        tier: 'free',
        workspaces: [{ id: 'ws-main', name: 'Primary Workspace' }],
        currentWorkspaceId: 'ws-main',
        monthlyResponsesUsed: 0,
        monthlyResponsesLimit: 500,
        aiGenerationsUsed: 0,
        aiGenerationsLimit: 25,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(cred.user);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await syncUserProfile(cred.user);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await syncUserProfile({ ...cred.user, displayName: name });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
