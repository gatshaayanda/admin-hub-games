import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  deleteOutbox,
  deleteWorldNoteLocal,
  updateWorldNoteLocal,
  getAllWorldNotes,
  getOutbox,
  getWorldNotes,
  newLocalId,
  putMeta,
  putOutbox,
  putTombstone,
  putWorldNote,
  type LocalWorldNote,
  type OutboxItem,
} from '../storage/offlineStore';

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

export type WorldNoteReport = {
  id: string;
  noteId: string;
  reporterId: string;
  reporterName: string;
  villageId: string;
  reason: string;
};

const DEVICE_PLAYER_ID_KEY = 'admin-hub-games:offline-player-id';

function getOfflinePlayerId() {
  try {
    const existing = window.localStorage.getItem(DEVICE_PLAYER_ID_KEY);
    if (existing) return existing;
    const created = newLocalId('player');
    window.localStorage.setItem(DEVICE_PLAYER_ID_KEY, created);
    return created;
  } catch {
    return newLocalId('player');
  }
}

function localToWorldNote(note: LocalWorldNote): WorldNote {
  return { id: note.id, authorId: note.authorId, authorName: note.authorName, villageId: note.villageId, text: note.text };
}

async function queue(item: OutboxItem) {
  await putOutbox(item);
}

export async function ensureAnonymousPlayer(): Promise<User> {
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;
  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

export async function getAnonymousPlayerId(): Promise<string | null> {
  try { return (await ensureAnonymousPlayer()).uid; } catch { return getOfflinePlayerId(); }
}

export async function savePlayerProfile(displayName: string): Promise<void> {
  try { await putMeta('playerName', displayName); } catch { /* local persistence is best effort */ }
  try {
    const user = await ensureAnonymousPlayer();
    await setDoc(doc(firestore, 'players', user.uid), { displayName, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    await queue({ id: 'profile:latest', type: 'profile', payload: { displayName }, createdAt: Date.now() });
  }
}

export async function createWorldNote(villageId: string, authorName: string, text: string): Promise<WorldNote | null> {
  const id = newLocalId('note');
  const local: LocalWorldNote = {
    id,
    authorId: getOfflinePlayerId(),
    authorName,
    villageId,
    text,
    createdAt: Date.now(),
    synced: false,
  };
  try { await putWorldNote(local); } catch { return null; }

  await queue({ id: `create:${id}`, type: 'create-note', payload: { localId: id }, createdAt: Date.now() });
  void syncPending();
  return localToWorldNote(local);
}

export async function loadWorldNotes(villageId: string): Promise<WorldNote[]> {
  let local: WorldNote[] = [];
  try { local = (await getWorldNotes(villageId)).map(localToWorldNote); } catch { /* continue to Firebase */ }

  try {
    await ensureAnonymousPlayer();
    const notesQuery = query(collection(firestore, 'worldNotes'), where('villageId', '==', villageId), limit(30));
    const snapshot = await getDocs(notesQuery);
    for (const item of snapshot.docs) {
      const data = item.data();
      await putWorldNote({
        id: item.id,
        remoteId: item.id,
        authorId: String(data.authorId || ''),
        authorName: String(data.authorName || 'Player'),
        villageId: String(data.villageId || villageId),
        text: String(data.text || ''),
        createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : Date.now(),
        synced: true,
      });
    }
    return (await getWorldNotes(villageId)).map(localToWorldNote);
  } catch {
    return local;
  }
}

export async function editWorldNote(noteId: string, text: string): Promise<boolean> {
  const cleanText = text.trim().slice(0, 500);
  if (!cleanText) return false;
  const notes = await getAllWorldNotes().catch(() => []);
  const existing = notes.find((item) => item.id === noteId);
  if (!existing) return false;

  try {
    const user = await ensureAnonymousPlayer();
    const ownsNote = existing.authorId === user.uid || existing.authorId === getOfflinePlayerId();
    if (!ownsNote) return false;
    await updateWorldNoteLocal(noteId, cleanText);
    await setDoc(doc(firestore, 'worldNotes', noteId), {
      authorId: user.uid,
      authorName: existing.authorName,
      villageId: existing.villageId,
      text: cleanText,
      createdAt: new Date(existing.createdAt),
    });
    await putWorldNote({ ...existing, text: cleanText, authorId: user.uid, remoteId: noteId, synced: true });
    return true;
  } catch {
    await queue({ id: `edit:${noteId}`, type: 'edit-note', payload: { noteId, text: cleanText }, createdAt: Date.now() });
    void syncPending();
    return true;
  }
}

export async function reportWorldNote(note: WorldNote, reporterName: string, reason: string): Promise<boolean> {
  const reportId = newLocalId('report');
  try {
    const user = await ensureAnonymousPlayer();
    await setDoc(doc(firestore, 'worldNoteReports', reportId), {
      noteId: note.id,
      reporterId: user.uid,
      reporterName,
      villageId: note.villageId,
      reason,
      createdAt: new Date(),
    });
    return true;
  } catch {
    await queue({
      id: `report:${reportId}`,
      type: 'report-note',
      payload: { noteId: note.id, reporterName, villageId: note.villageId, reason },
      createdAt: Date.now(),
    });
    void syncPending();
    return true;
  }
}

export async function loadWorldNoteReports(): Promise<WorldNoteReport[]> {
  try {
    await ensureAnonymousPlayer();
    const snapshot = await getDocs(query(collection(firestore, 'worldNoteReports'), limit(50)));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WorldNoteReport).reverse();
  } catch { return []; }
}

export async function isFounderAdmin(): Promise<boolean> {
  try {
    const user = await ensureAnonymousPlayer();
    const token = await user.getIdTokenResult();
    return token.claims.admin === true;
  } catch { return false; }
}

export async function deleteWorldNote(noteId: string): Promise<boolean> {
  try { await deleteWorldNoteLocal(noteId); } catch { /* continue */ }
  await putTombstone(noteId);

  try {
    await ensureAnonymousPlayer();
    await deleteDoc(doc(firestore, 'worldNotes', noteId));
    return true;
  } catch {
    await queue({ id: `delete:${noteId}`, type: 'delete-note', payload: { noteId }, createdAt: Date.now() });
    void syncPending();
    return true;
  }
}

let syncInFlight = false;

async function syncPending() {
  if (syncInFlight) return;
  syncInFlight = true;
  const pending = await getOutbox().catch(() => []);
  if (!pending.length) {
    syncInFlight = false;
    return;
  }

  let user: User;
  try { user = await ensureAnonymousPlayer(); } catch { syncInFlight = false; return; }

  for (const item of pending) {
    try {
      if (item.type === 'profile') {
        await setDoc(doc(firestore, 'players', user.uid), { displayName: item.payload.displayName, updatedAt: serverTimestamp() }, { merge: true });
      } else if (item.type === 'create-note') {
        const notes = await getAllWorldNotes();
        const note = notes.find((candidate) => candidate.id === item.payload.localId);
        if (!note) { await deleteOutbox(item.id); continue; }
        await setDoc(doc(firestore, 'worldNotes', note.id), {
          authorId: user.uid,
          authorName: note.authorName,
          villageId: note.villageId,
          text: note.text,
          createdAt: new Date(note.createdAt),
        });
        await putWorldNote({ ...note, authorId: user.uid, remoteId: note.id, synced: true });
      } else if (item.type === 'edit-note') {
        const notes = await getAllWorldNotes();
        const note = notes.find((candidate) => candidate.id === item.payload.noteId);
        if (!note) { await deleteOutbox(item.id); continue; }
        await setDoc(doc(firestore, 'worldNotes', note.id), {
          authorId: user.uid,
          authorName: note.authorName,
          villageId: note.villageId,
          text: item.payload.text,
          createdAt: new Date(note.createdAt),
        });
        await putWorldNote({ ...note, text: item.payload.text, authorId: user.uid, remoteId: note.id, synced: true });
      } else if (item.type === 'delete-note') {
        await deleteDoc(doc(firestore, 'worldNotes', item.payload.noteId));
      } else if (item.type === 'report-note') {
        await setDoc(doc(firestore, 'worldNoteReports', item.id), {
          noteId: item.payload.noteId,
          reporterId: user.uid,
          reporterName: item.payload.reporterName,
          villageId: item.payload.villageId,
          reason: item.payload.reason,
          createdAt: new Date(item.createdAt),
        });
      }
      await deleteOutbox(item.id);
    } catch {
      // Keep the item queued. Startup, focus, visibility and online events retry it.
    }
  }
  syncInFlight = false;
}

void syncPending();
window.addEventListener('online', () => { void syncPending(); });
window.addEventListener('focus', () => { void syncPending(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void syncPending();
});


export async function saveShootersProgress(progress: unknown): Promise<void> {
  try {
    const user = await ensureAnonymousPlayer();
    await setDoc(doc(firestore, 'shootersTriggerProgress', user.uid), { progress, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    // Shooter gameplay remains local-first; the next online state can retry through local persistence.
  }
}
