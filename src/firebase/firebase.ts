import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

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

export type WorldNote = {
  id: string;
  authorId: string;
  authorName: string;
  villageId: string;
  text: string;
};

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
    // Firestore/network failures must never block local gameplay.
  }
}

export async function createWorldNote(villageId: string, authorName: string, text: string): Promise<WorldNote | null> {
  try {
    const user = await ensureAnonymousPlayer();
    const ref = await addDoc(collection(firestore, 'worldNotes'), {
      authorId: user.uid,
      authorName,
      villageId,
      text,
      createdAt: serverTimestamp(),
    });

    return { id: ref.id, authorId: user.uid, authorName, villageId, text };
  } catch {
    return null;
  }
}

export async function loadWorldNotes(villageId: string): Promise<WorldNote[]> {
  try {
    const snapshot = await getDocs(collection(firestore, 'worldNotes'));
    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }) as WorldNote)
      .filter((note) => note.villageId === villageId)
      .slice(-30)
      .reverse();
  } catch {
    return [];
  }
}

export async function deleteWorldNote(noteId: string): Promise<boolean> {
  try {
    const user = await ensureAnonymousPlayer();
    await deleteDoc(doc(firestore, 'worldNotes', noteId));
    return firebaseAuth.currentUser?.uid === user.uid;
  } catch {
    return false;
  }
}
