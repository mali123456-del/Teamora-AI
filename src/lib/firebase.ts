import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Workspace Google Keep & Google Workspace OAuth scopes
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Firestore DB with explicit Database ID as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out error:', error);
    throw error;
  }
};
