// IndexedDB/localStorage helper for Brady/Tachy sessions

import { PathwayMode } from '@/types/acls';
import { saveSession, StoredSession } from './sessionStorage';
import { logger } from '@/utils/logger';
import { encryptedStorage } from './crypto';

export interface StoredBradyTachySession {
  id: string;
  startTime: number;
  endTime: number | null;
  patientGroup: 'adult' | 'pediatric';
  weightKg: number | null;
  branch: 'bradycardia' | 'tachycardia' | null;
  interventions: Array<{
    timestamp: number;
    type: string;
    details: string;
    value?: number | string;
    doseStep?: number;
    calculatedDose?: string;
    decisionContext?: Record<string, unknown>;
    translationKey?: string;
    translationParams?: Record<string, string | number>;
  }>;
  outcome: 'resolved' | 'switched_to_arrest' | 'transferred' | null;
}

const BRADY_TACHY_SESSION_KEY = 'acls_bradytachy_active_session';

export async function saveBradyTachySession(session: StoredBradyTachySession): Promise<void> {
  try {
    await encryptedStorage.setItem(BRADY_TACHY_SESSION_KEY, JSON.stringify(session));
    logger.sessionEvent('Brady/Tachy session saved');
  } catch (e) {
    logger.error('Failed to save Brady/Tachy session', e);
  }
}

export async function getBradyTachySession(): Promise<StoredBradyTachySession | null> {
  try {
    const data = await encryptedStorage.getItem(BRADY_TACHY_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    logger.error('Failed to retrieve Brady/Tachy session', e);
    return null;
  }
}

export function clearBradyTachySession(): void {
  try {
    encryptedStorage.removeItem(BRADY_TACHY_SESSION_KEY);
    logger.sessionEvent('Brady/Tachy session cleared');
  } catch (e) {
    logger.error('Failed to clear Brady/Tachy session', e);
  }
}

/**
 * Save BradyTachy session to history (IndexedDB)
 * This should be called when the session ends (resolved/transferred).
 */
export async function saveBradyTachyToHistory(session: StoredBradyTachySession): Promise<void> {
  try {
    const duration = session.endTime ? session.endTime - session.startTime : 0;

    // Determine session type and outcome
    const sessionType = session.outcome === 'switched_to_arrest' ? 'bradytachy-arrest' : 'bradytachy';
    const outcome = session.outcome === 'resolved' ? 'resolved' : null;

    // Convert BradyTachy session to StoredSession format for history
    const historySession: StoredSession = {
      id: session.id,
      savedAt: Date.now(),
      startTime: session.startTime,
      endTime: session.endTime,
      roscTime: null,
      outcome,
      duration,
      totalCPRTime: 0, // BradyTachy doesn't track CPR time (that's for arrest)
      cprFraction: 0,
      shockCount: 0,
      epinephrineCount: 0,
      amiodaroneCount: 0,
      lidocaineCount: 0,
      sessionType,
      pathwayMode: session.patientGroup as PathwayMode,
      patientWeight: session.weightKg,
      interventions: session.interventions.map(i => ({
        timestamp: i.timestamp,
        type: i.type,
        details: i.details,
        value: i.value,
        translationKey: i.translationKey,
        translationParams: i.translationParams,
      })),
      etco2Readings: [],
      hsAndTs: {
        hypovolemia: false,
        hypoxia: false,
        hydrogenIon: false,
        hypoHyperkalemia: false,
        hypothermia: false,
        tensionPneumothorax: false,
        tamponade: false,
        toxins: false,
        thrombosisPulmonary: false,
        thrombosisCoronary: false,
      },
      postROSCChecklist: null,
      postROSCVitals: null,
      airwayStatus: 'ambu',
      bradyTachyStartTime: session.startTime,
    };
    
    await saveSession(historySession);
  } catch (e) {
    console.error('Failed to save Brady/Tachy session to history:', e);
  }
}
