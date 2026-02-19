// IndexedDB helper for storing ACLS session reports locally

import { HsAndTs, PostROSCChecklist, PostROSCVitals, PathwayMode, PregnancyCauses, PregnancyInterventions, SpecialCircumstances, AnaphylaxisChecklist, AsthmaChecklist, HyperthermiaChecklist, OpioidOverdoseChecklist, DrowningChecklist, ElectrocutionChecklist, LVADFailureChecklist } from '@/types/acls';

const DB_NAME = 'acls_sessions';
const DB_VERSION = 4; // Bump version for sessionType field
const STORE_NAME = 'sessions';

export type SessionType = 'cardiac-arrest' | 'bradytachy' | 'bradytachy-arrest';

export interface StoredSession {
  id: string;
  savedAt: number;
  startTime: number;
  endTime: number | null;
  roscTime: number | null;
  outcome: 'rosc' | 'deceased' | 'resolved' | null;
  duration: number;
  totalCPRTime: number;
  cprFraction: number;
  shockCount: number;
  epinephrineCount: number;
  amiodaroneCount: number;
  lidocaineCount: number;
  // Session type (cardiac arrest, bradytachy only, or bradytachy that switched to arrest)
  sessionType: SessionType;
  // Pathway mode (Adult ACLS / Pediatric PALS)
  pathwayMode: PathwayMode;
  patientWeight: number | null;
  // All interventions with full detail
  interventions: Array<{
    timestamp: number;
    type: string;
    details: string;
    value?: number | string;
    translationKey?: string;
    translationParams?: Record<string, string | number>;
  }>;
  // EtCO2 readings
  etco2Readings: Array<{
    timestamp: number;
    value: number;
  }>;
  // H's & T's analysis
  hsAndTs: HsAndTs;
  // Post-ROSC data
  postROSCChecklist: PostROSCChecklist | null;
  postROSCVitals: PostROSCVitals | null;
  // Airway status
  airwayStatus: 'ambu' | 'sga' | 'ett';
  // Pregnancy data (Adult only)
  pregnancyActive?: boolean;
  pregnancyCauses?: PregnancyCauses;
  pregnancyInterventions?: PregnancyInterventions;
  // Special Circumstances data
  specialCircumstances?: SpecialCircumstances;
  anaphylaxisChecklist?: AnaphylaxisChecklist;
  asthmaChecklist?: AsthmaChecklist;
  hyperthermiaChecklist?: HyperthermiaChecklist;
  opioidOverdoseChecklist?: OpioidOverdoseChecklist;
  drowningChecklist?: DrowningChecklist;
  electrocutionChecklist?: ElectrocutionChecklist;
  lvadFailureChecklist?: LVADFailureChecklist;
  // BradyTachy data (for combined sessions)
  bradyTachyStartTime?: number | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
        store.createIndex('pathwayMode', 'pathwayMode', { unique: false });
        store.createIndex('sessionType', 'sessionType', { unique: false });
      } else {
        // Handle migration for existing stores
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        const store = transaction?.objectStore(STORE_NAME);
        if (store && !store.indexNames.contains('sessionType')) {
          store.createIndex('sessionType', 'sessionType', { unique: false });
        }
      }
    };
  });
}

export async function saveSession(session: StoredSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(session);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllSessions(): Promise<StoredSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('savedAt');
    const request = index.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.reverse()); // Most recent first
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteSessions(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Delete all sessions in a single transaction
    let completed = 0;
    let hasError = false;

    ids.forEach(id => {
      const request = store.delete(id);
      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(request.error);
        }
      };
      request.onsuccess = () => {
        completed++;
        if (completed === ids.length && !hasError) {
          resolve();
        }
      };
    });

    // Handle empty array case
    if (ids.length === 0) {
      resolve();
    }
  });
}

export async function getSession(id: string): Promise<StoredSession | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function clearSessionDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
    request.onsuccess = () => resolve();
  });
}
