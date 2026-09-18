const DB_NAME = 'admin-hub-games';
const DB_VERSION = 2;

export type LocalWorldNote = {
  id: string;
  remoteId?: string;
  authorId: string;
  authorName: string;
  villageId: string;
  text: string;
  createdAt: number;
  synced: boolean;
};

export type OutboxItem = {
  id: string;
  type: 'profile' | 'create-note' | 'delete-note' | 'report-note';
  payload: Record<string, string>;
  createdAt: number;
};

type MetaRecord = { key: string; value: unknown };

let dbPromise: Promise<IDBDatabase> | undefined;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('worldNotes')) db.createObjectStore('worldNotes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('tombstones')) db.createObjectStore('tombstones', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = undefined;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = undefined;
      reject(request.error);
    };
  });
  return dbPromise;
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putWorldNote(note: LocalWorldNote) {
  const db = await openDb();
  await requestResult(db.transaction('worldNotes', 'readwrite').objectStore('worldNotes').put(note));
}

export async function getWorldNotes(villageId: string) {
  const db = await openDb();
  const notes = await requestResult(db.transaction('worldNotes').objectStore('worldNotes').getAll()) as LocalWorldNote[];
  const tombstones = await getTombstones();
  return notes
    .filter((note) => note.villageId === villageId && !tombstones.has(note.remoteId || note.id))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllWorldNotes() {
  const db = await openDb();
  return await requestResult(db.transaction('worldNotes').objectStore('worldNotes').getAll()) as LocalWorldNote[];
}

export async function deleteWorldNoteLocal(id: string) {
  const db = await openDb();
  await requestResult(db.transaction('worldNotes', 'readwrite').objectStore('worldNotes').delete(id));
}

export async function putOutbox(item: OutboxItem) {
  const db = await openDb();
  await requestResult(db.transaction('outbox', 'readwrite').objectStore('outbox').put(item));
}

export async function getOutbox() {
  const db = await openDb();
  return await requestResult(db.transaction('outbox').objectStore('outbox').getAll()) as OutboxItem[];
}

export async function deleteOutbox(id: string) {
  const db = await openDb();
  await requestResult(db.transaction('outbox', 'readwrite').objectStore('outbox').delete(id));
}

export async function getTombstones() {
  const db = await openDb();
  const rows = await requestResult(db.transaction('tombstones').objectStore('tombstones').getAll()) as Array<{ id: string }>;
  return new Set(rows.map((row) => row.id));
}

export async function putTombstone(id: string) {
  const db = await openDb();
  await requestResult(db.transaction('tombstones', 'readwrite').objectStore('tombstones').put({ id }));
}

export async function putMeta(key: string, value: unknown) {
  const db = await openDb();
  await requestResult(db.transaction('meta', 'readwrite').objectStore('meta').put({ key, value } satisfies MetaRecord));
}

export async function getMeta<T>(key: string) {
  const db = await openDb();
  const row = await requestResult(db.transaction('meta').objectStore('meta').get(key)) as MetaRecord | undefined;
  return row?.value as T | undefined;
}

export function newLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
