import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Scopes required for Google Sheets & Google Drive file access
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track interactive sign-in flow
let isSigningIn = false;
// In-memory token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export interface AuthStateListener {
  (user: User | null, accessToken: string | null): void;
}

const listeners: Set<AuthStateListener> = new Set();

const notifyListeners = (user: User | null, token: string | null) => {
  listeners.forEach((listener) => {
    try {
      listener(user, token);
    } catch (err) {
      console.error('Error notifying auth listener:', err);
    }
  });
};

/**
 * Initialize Firebase Auth listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        notifyListeners(user, cachedAccessToken);
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged in to Firebase, but token is not in memory.
        // Prompt re-auth or wait for user interaction to sign in with popup.
        notifyListeners(user, null);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      notifyListeners(null, null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Subscribe to auth state updates.
 */
export const subscribeAuthState = (listener: AuthStateListener) => {
  listeners.add(listener);
  // Initial immediate call with current state
  listener(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Interactive Google Sign-In with popup.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token Google dari autentikasi');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    notifyListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the cached in-memory access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Retrieve the current authenticated Firebase user.
 */
export const getCurrentUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

/**
 * Sign out of Google & Firebase, clearing memory token.
 */
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
  notifyListeners(null, null);
};
