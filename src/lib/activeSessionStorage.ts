// Storage for active (in-progress) sessions to enable resume functionality
import { ACLSSession, PathwayMode } from '@/types/acls';
import { encryptedStorage, isCryptoAvailable } from './crypto';

const ACTIVE_SESSION_KEY = 'acls-active-session';
const TIMER_STATE_KEY = 'acls-timer-state';
const PATHWAY_MODE_KEY = 'acls-pathway-mode';
const PATHWAY_WEIGHT_KEY = 'acls-pathway-weight';

export interface SavedTimerState {
  cprCycleRemaining: number;
  epiRemaining: number;
  totalElapsed: number;
  totalCPRTime: number;
  savedAt: number;
}

export async function saveActiveSession(session: ACLSSession, timerState: SavedTimerState): Promise<void> {
  try {
    await encryptedStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    await encryptedStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
  } catch (e) {
    console.error('Failed to save active session:', e);
  }
}

export async function getActiveSession(): Promise<{ session: ACLSSession; timerState: SavedTimerState } | null> {
  try {
    const sessionStr = await encryptedStorage.getItem(ACTIVE_SESSION_KEY);
    const timerStr = await encryptedStorage.getItem(TIMER_STATE_KEY);
    
    if (sessionStr && timerStr) {
      const session = JSON.parse(sessionStr) as ACLSSession;
      const timerState = JSON.parse(timerStr) as SavedTimerState;
      
      // Only return if session is still active (not ended)
      if (session.phase !== 'code_ended' && session.phase !== 'initial') {
        return { session, timerState };
      }
    }
  } catch (e) {
    console.error('Failed to get active session:', e);
  }
  return null;
}

export function clearActiveSession(): void {
  try {
    encryptedStorage.removeItem(ACTIVE_SESSION_KEY);
    encryptedStorage.removeItem(TIMER_STATE_KEY);
  } catch (e) {
    console.error('Failed to clear active session:', e);
  }
}

export async function hasActiveSession(): Promise<boolean> {
  return (await getActiveSession()) !== null;
}

// Pathway mode persistence (for CodeScreen toggle)
export function savePathwayMode(mode: PathwayMode): void {
  try {
    localStorage.setItem(PATHWAY_MODE_KEY, mode);
  } catch (e) {
    console.error('Failed to save pathway mode:', e);
  }
}

export function getPathwayMode(): PathwayMode {
  try {
    const mode = localStorage.getItem(PATHWAY_MODE_KEY);
    if (mode === 'pediatric') return 'pediatric';
  } catch (e) {
    console.error('Failed to get pathway mode:', e);
  }
  return 'adult'; // Default to adult
}

export function savePathwayWeight(weight: number | null): void {
  try {
    if (weight === null) {
      localStorage.removeItem(PATHWAY_WEIGHT_KEY);
    } else {
      localStorage.setItem(PATHWAY_WEIGHT_KEY, String(weight));
    }
  } catch (e) {
    console.error('Failed to save pathway weight:', e);
  }
}

export function getPathwayWeight(): number | null {
  try {
    const weight = localStorage.getItem(PATHWAY_WEIGHT_KEY);
    if (weight) {
      const parsed = parseFloat(weight);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to get pathway weight:', e);
  }
  return null;
}
