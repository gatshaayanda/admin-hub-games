import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export async function ensureAnonymousPlayer(): Promise<User> {
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;
  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

export async function savePlayerProfile(displayName: string): Promise<void> {
  try {
    const user = await ensureAnonymousPlayer();
    await setDoc(
      doc(firestore, 'players', user.uid),
      {
        displayName,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // Firestore can remain locked during development; local gameplay must still work.
  }
}
