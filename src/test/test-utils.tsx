import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { vi } from 'vitest';

// Create a custom render function that includes common providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </I18nextProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper to wait for a condition with timeout
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// Helper to advance time and flush promises
export async function advanceTimersByTime(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await new Promise((resolve) => setImmediate(resolve));
}

// Helper to create a mock ACLSSession
export function createMockACLSSession(overrides = {}) {
  return {
    id: 'test-session-id',
    startTime: Date.now(),
    endTime: null,
    currentRhythm: null,
    phase: 'pathway_selection' as const,
    outcome: null,
    shockCount: 0,
    currentEnergy: 0,
    epinephrineCount: 0,
    amiodaroneCount: 0,
    lidocaineCount: 0,
    lastEpinephrineTime: null,
    lastAmiodaroneTime: null,
    airwayStatus: 'ambu' as const,
    interventions: [],
    vitalReadings: [],
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
    postROSCChecklist: {
      airwaySecured: false,
      ventilationOptimized: false,
      twelveLeadECG: false,
      labsOrdered: false,
      ctHeadOrdered: false,
      echoOrdered: false,
      temperatureManagement: false,
      hemodynamicsOptimized: false,
      neurologicalAssessment: false,
      followingCommands: null,
      eegOrdered: false,
      stElevation: null,
      cardiogenicShock: null,
    },
    postROSCVitals: {
      spo2: null,
      paco2: null,
      map: null,
      temperature: null,
      glucose: null,
    },
    cprCycleStartTime: null,
    roscTime: null,
    patientWeight: null,
    cprRatio: '15:2' as const,
    pathwayMode: 'adult' as const,
    pregnancyActive: false,
    pregnancyCauses: {
      anestheticComplications: false,
      bleeding: false,
      cardiovascular: false,
      drugs: false,
      embolic: false,
      fever: false,
      generalCauses: false,
      hypertension: false,
    },
    pregnancyInterventions: {
      leftUterineDisplacement: false,
      earlyAirway: false,
      ivAboveDiaphragm: false,
      stopMagnesiumGiveCalcium: false,
      detachFetalMonitors: false,
      massiveTransfusion: false,
    },
    pregnancyStartTime: null,
    ...overrides,
  };
}

// Helper to create mock settings
export function createMockSettings(overrides = {}) {
  return {
    soundEnabled: true,
    vibrationEnabled: true,
    metronomeEnabled: false,
    metronomeBPM: 110,
    voiceAnnouncementsEnabled: false,
    preferLidocaine: false,
    theme: 'dark' as const,
    adultDefibrillatorEnergy: 200 as const,
    ...overrides,
  };
}
