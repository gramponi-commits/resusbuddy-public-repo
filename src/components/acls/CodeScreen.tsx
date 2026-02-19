import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, StickyNote } from 'lucide-react';
import { ErrorBoundary, CodeErrorFallback } from '../ErrorBoundary';
import { CommandBanner } from './CommandBanner';
import { RhythmCheckModal } from './RhythmCheckModal';
import { ResumeSessionDialog } from './ResumeSessionDialog';
import { AddNoteDialog } from './AddNoteDialog';
import { FooterStatsBar } from './FooterStatsBar';
import { PathwaySelectionView } from './views/PathwaySelectionView';
import { CPRPendingRhythmView } from './views/CPRPendingRhythmView';
import { ActiveCodeView } from './views/ActiveCodeView';
import { CodeEndedView } from './views/CodeEndedView';
import { PostROSCScreen } from './PostROSCScreen';
import { CodeTimeline } from './CodeTimeline';
import { Button } from '@/components/ui/button';
import { useACLSLogic } from '@/hooks/useACLSLogic';
import { usePrevious } from '@/hooks/usePrevious';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useAudioAlerts } from '@/hooks/useAudioAlerts';
import { useMetronome } from '@/hooks/useMetronome';
import { useVoiceAnnouncements } from '@/hooks/useVoiceAnnouncements';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_ACLS_CONFIG } from '@/types/acls';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { calculateShockEnergy } from '@/lib/palsDosing';
import { getAdultShockEnergy } from '@/lib/aclsDosing';
import {
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
  getPathwayMode,
  getPathwayWeight,
} from '@/lib/activeSessionStorage';
import { getBradyTachySession, clearBradyTachySession } from '@/lib/bradyTachyStorage';
import { logger } from '@/utils/logger';

// Lazy load BradyTachy module for better initial load performance
const BradyTachyModule = lazy(() =>
  import('./bradytachy/BradyTachyModule').then((module) => ({
    default: module.BradyTachyModule,
  }))
);

/**
 * CodeScreen - Main orchestrator for ACLS/PALS decision support
 * Refactored for better maintainability with focused view components
 */
export function CodeScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  // Create custom config with user's epinephrine interval preference
  const aclsConfig = {
    ...DEFAULT_ACLS_CONFIG,
    epinephrineIntervalMs: settings.epinephrineIntervalMinutes * 60 * 1000,
  };

  const { session, timerState, isInRhythmCheck, commandBanner, actions, buttonStates } =
    useACLSLogic(aclsConfig, settings.adultDefibrillatorEnergy);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const { playAlert, setEnabled: setAudioEnabled, vibrate } = useAudioAlerts();
  const { announce, setEnabled: setVoiceEnabled } = useVoiceAnnouncements();
  const { start: startMetronome, stop: stopMetronome } = useMetronome({
    bpm: settings.metronomeBPM,
    enabled: settings.metronomeEnabled,
  });

  // Local state
  const [showBradyTachyModule, setShowBradyTachyModule] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [pendingResumeSession, setPendingResumeSession] = useState<Awaited<ReturnType<
    typeof getActiveSession
  >>>(null);

  // Calculate shock energy based on pathway mode and patient weight
  const shockEnergy =
    session.pathwayMode === 'pediatric'
      ? calculateShockEnergy(session.patientWeight, session.shockCount)
      : getAdultShockEnergy(session.shockCount, settings.adultDefibrillatorEnergy);

  // Track previous states for alert triggers using usePrevious hook
  const prevRhythmCheckDue = usePrevious(timerState.rhythmCheckDue);
  const prevPreShockAlert = usePrevious(timerState.preShockAlert);
  const prevEpiDue = usePrevious(buttonStates.epiDue);
  const prevAntiarrhythmicDue = usePrevious(
    session.shockCount >= 3 && (buttonStates.canGiveAmiodarone || buttonStates.canGiveLidocaine)
  );

  // Phase flags
  const isActive = session.phase === 'shockable_pathway' || session.phase === 'non_shockable_pathway';
  const isCPRPendingRhythm = session.phase === 'cpr_pending_rhythm';
  const isPostROSC = session.phase === 'post_rosc';
  const isCodeEnded = session.phase === 'code_ended';
  const isPathwaySelection = session.phase === 'pathway_selection';
  const isInitial = session.phase === 'initial' || session.phase === 'rhythm_selection';

  // Check for active session on mount
  useEffect(() => {
    const checkForActiveSession = async () => {
      const activeSession = await getActiveSession();
      if (activeSession) {
        logger.sessionEvent('Found active session, prompting user to resume');
        setPendingResumeSession(activeSession);
        setShowResumeDialog(true);
      }
    };

    checkForActiveSession();
  }, []);


  // Enable audio alerts based on settings
  useEffect(() => {
    setAudioEnabled(settings.soundEnabled);
  }, [settings.soundEnabled, setAudioEnabled]);

  // Enable voice announcements based on settings
  useEffect(() => {
    setVoiceEnabled(settings.voiceAnnouncementsEnabled);
  }, [settings.voiceAnnouncementsEnabled, setVoiceEnabled]);

  // Wake lock during active code
  useEffect(() => {
    if ((isActive || isCPRPendingRhythm) && !isInRhythmCheck) {
      requestWakeLock();
    } else if (isCodeEnded || isPostROSC) {
      releaseWakeLock();
    }
  }, [isActive, isCPRPendingRhythm, isInRhythmCheck, isCodeEnded, isPostROSC, requestWakeLock, releaseWakeLock]);

  // Metronome control during active CPR
  useEffect(() => {
    if ((isActive || isCPRPendingRhythm) && !isInRhythmCheck && settings.metronomeEnabled) {
      startMetronome();
    } else {
      stopMetronome();
    }
  }, [isActive, isCPRPendingRhythm, isInRhythmCheck, settings.metronomeEnabled, startMetronome, stopMetronome]);

  // Save active session periodically
  useEffect(() => {
    if (isActive || isCPRPendingRhythm) {
      const interval = setInterval(() => {
        saveActiveSession(session, {
          cprCycleRemaining: timerState.cprCycleRemaining,
          epiRemaining: timerState.epiRemaining,
          totalElapsed: timerState.totalElapsed,
          totalCPRTime: timerState.totalCPRTime,
          savedAt: Date.now(),
        });
        logger.sessionEvent('Auto-saved active session');
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isActive, isCPRPendingRhythm, session, timerState]);

  // Clear active session when code ends
  useEffect(() => {
    if (isCodeEnded || isPostROSC) {
      clearActiveSession();
      logger.sessionEvent('Cleared active session storage');
    }
  }, [isCodeEnded, isPostROSC]);

  // Audio alerts for state changes
  useEffect(() => {
    // Rhythm check due alert
    if (timerState.rhythmCheckDue && !prevRhythmCheckDue) {
      playAlert('rhythmCheck');
      announce('rhythmCheck');
      if (settings.vibrationEnabled) vibrate([200, 100, 200, 100, 200]);
      logger.medicalEvent('Rhythm check due alert triggered');
    }

    // Pre-shock alert
    if (timerState.preShockAlert && !prevPreShockAlert) {
      playAlert('preCharge');
      announce('preCharge');
      if (settings.vibrationEnabled) vibrate([150, 75, 150]);
      logger.medicalEvent('Pre-shock alert triggered');
    }

    // Epi due alert
    if (buttonStates.epiDue && !prevEpiDue) {
      playAlert('epiDue');
      announce('epiDue');
      if (settings.vibrationEnabled) vibrate([300, 150, 300]);
      logger.medicalEvent('Epinephrine due alert triggered');
    }

    // Antiarrhythmic due alert (after shock #3)
    const antiarrhythmicDue =
      session.shockCount >= 3 && (buttonStates.canGiveAmiodarone || buttonStates.canGiveLidocaine);
    if (antiarrhythmicDue && !prevAntiarrhythmicDue) {
      if (settings.preferLidocaine) {
        announce('lidocaineDue');
      } else {
        announce('amiodaroneDue');
      }
      logger.medicalEvent('Antiarrhythmic due alert triggered', {
        preferLidocaine: settings.preferLidocaine,
      });
    }
  }, [
    timerState.rhythmCheckDue,
    timerState.preShockAlert,
    buttonStates.epiDue,
    buttonStates.canGiveAmiodarone,
    buttonStates.canGiveLidocaine,
    session.shockCount,
    prevRhythmCheckDue,
    prevPreShockAlert,
    prevEpiDue,
    prevAntiarrhythmicDue,
    playAlert,
    announce,
    vibrate,
    settings.vibrationEnabled,
    settings.preferLidocaine,
  ]);

  // ROSC alert
  useEffect(() => {
    if (isPostROSC) {
      playAlert('rosc');
      announce('rosc');
      if (settings.vibrationEnabled) vibrate(500);
      logger.medicalEvent('ROSC achieved');
    }
  }, [isPostROSC, playAlert, announce, vibrate, settings.vibrationEnabled]);

  // Handlers
  const handleSetPathwayMode = (mode: 'adult' | 'pediatric') => {
    actions.setPathwayMode(mode);
  };

  const handleAddNote = (note: string) => {
    actions.addNote(note);
    toast.success(t('notes.addNote'));
    logger.sessionEvent('Note added', { note });
  };

  const handleNewCode = () => {
    clearActiveSession();
    actions.resetSession();
    logger.sessionEvent('Session reset');
  };

  const handleResumeSession = () => {
    if (pendingResumeSession) {
      actions.resumeSession(pendingResumeSession.session, pendingResumeSession.timerState);
      logger.sessionEvent('Session resumed');
    }
    setShowResumeDialog(false);
    setPendingResumeSession(null);
  };

  const handleDiscardSession = () => {
    clearActiveSession();
    setShowResumeDialog(false);
    setPendingResumeSession(null);
    logger.sessionEvent('Session discarded');
  };

  const handleOpenBradyTachy = () => {
    setShowBradyTachyModule(true);
    logger.sessionEvent('Brady/Tachy module opened');
  };

  const handleCloseBradyTachy = () => {
    setShowBradyTachyModule(false);
    logger.sessionEvent('Brady/Tachy module closed');
  };

  const handleSwitchToArrestFromBradyTachy = async (patientGroup: 'adult' | 'pediatric') => {
    const bradyTachySession = await getBradyTachySession();

    setShowBradyTachyModule(false);
    actions.setPathwayMode(patientGroup);

    // Set weight first if available
    if (bradyTachySession?.weightKg && patientGroup === 'pediatric') {
      actions.setPatientWeight(bradyTachySession.weightKg);
    }

    // Import brady/tachy interventions BEFORE starting CPR to preserve timeline
    if (bradyTachySession?.interventions && bradyTachySession.interventions.length > 0) {
      actions.importInterventions(bradyTachySession.interventions, bradyTachySession.startTime);
    }

    clearBradyTachySession();
    actions.startCPR();

    // Add note about the switch
    actions.addIntervention('note', t('bradyTachy.switchedToArrest'), undefined, 'bradyTachy.switchedToArrest');

    toast.success(t('bradyTachy.switchedToArrest'));
    logger.medicalEvent('Switched from Brady/Tachy to arrest mode', { patientGroup });
  };

  const handleDeliveryAlert = () => {
    playAlert('rhythmCheck');
    announce('emergencyDelivery');
    if (settings.vibrationEnabled) vibrate([500, 200, 500, 200, 500]);
    logger.medicalEvent('Emergency delivery alert');
  };

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // If Brady/Tachy module is active, show it instead of normal CODE screen
  // Pass initialMode and initialWeight from persisted toggle state
  if (showBradyTachyModule) {
    const bradyTachyInitialMode = getPathwayMode();
    const bradyTachyInitialWeight = bradyTachyInitialMode === 'pediatric' ? getPathwayWeight() : null;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Skeleton className="h-64 w-full max-w-lg" />
            </div>
          }
        >
          <BradyTachyModule
            onSwitchToArrest={handleSwitchToArrestFromBradyTachy}
            onExit={handleCloseBradyTachy}
            initialMode={bradyTachyInitialMode}
            initialWeight={bradyTachyInitialWeight}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<CodeErrorFallback onRecover={handleResumeSession} />}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Resume Session Dialog */}
        <ResumeSessionDialog
          open={showResumeDialog}
          onResume={handleResumeSession}
          onDiscard={handleDiscardSession}
          sessionDuration={
            pendingResumeSession ? formatDuration(pendingResumeSession.timerState.totalElapsed) : '0:00'
          }
        />

        {/* Add Note Dialog */}
        <AddNoteDialog open={showNoteDialog} onOpenChange={setShowNoteDialog} onAddNote={handleAddNote} />

        {/* Command Banner - Hidden on pathway selection and initial screen */}
        {!isInitial && !isPathwaySelection && (
          <CommandBanner
            message={commandBanner.message}
            priority={commandBanner.priority}
            subMessage={commandBanner.subMessage}
          />
        )}

        <ScrollArea className="flex-1">
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-lg mx-auto no-text-select">
            {/* Pathway Selection Screen */}
            {isPathwaySelection && (
              <PathwaySelectionView
                onSelectPathway={handleSetPathwayMode}
                onStartCPR={actions.startCPR}
                onSetWeight={actions.setPatientWeight}
                currentWeight={session.patientWeight}
                onSelectBradyTachy={handleOpenBradyTachy}
              />
            )}

            {/* CPR Pending Rhythm View */}
            {isCPRPendingRhythm && (
              <CPRPendingRhythmView
                pathwayMode={session.pathwayMode}
                patientWeight={session.patientWeight}
                currentRhythm={session.currentRhythm}
                totalElapsed={timerState.totalElapsed}
                totalCPRTime={timerState.totalCPRTime}
                airwayStatus={session.airwayStatus}
                cprRatio={session.cprRatio}
                hsAndTs={session.hsAndTs}
                interventions={session.interventions}
                startTime={session.startTime}
                bradyTachyStartTime={session.bradyTachyStartTime}
                pregnancyActive={session.pregnancyActive}
                pregnancyCauses={session.pregnancyCauses}
                pregnancyInterventions={session.pregnancyInterventions}
                pregnancyStartTime={session.pregnancyStartTime}
                specialCircumstances={session.specialCircumstances}
                vibrationEnabled={settings.vibrationEnabled}
                onSetWeight={actions.setPatientWeight}
                onSelectRhythm={actions.selectRhythm}
                onSetRhythmAnalysisActive={actions.setRhythmAnalysisActive}
                onAirwayChange={actions.setAirway}
                onETCO2Record={actions.recordETCO2}
                onCPRRatioChange={actions.setCPRRatio}
                onUpdateHsAndTs={actions.updateHsAndTs}
                onTogglePregnancy={actions.togglePregnancy}
                onUpdatePregnancyCauses={actions.updatePregnancyCauses}
                onUpdatePregnancyInterventions={actions.updatePregnancyInterventions}
                onDeliveryAlert={handleDeliveryAlert}
                onToggleSpecialCircumstance={actions.toggleSpecialCircumstance}
              />
            )}

            {/* Active Code View */}
            {isActive && !isInRhythmCheck && (
              <ActiveCodeView
                pathwayMode={session.pathwayMode}
                patientWeight={session.patientWeight}
                epinephrineCount={session.epinephrineCount}
                amiodaroneCount={session.amiodaroneCount}
                lidocaineCount={session.lidocaineCount}
                airwayStatus={session.airwayStatus}
                cprRatio={session.cprRatio}
                hsAndTs={session.hsAndTs}
                interventions={session.interventions}
                startTime={session.startTime}
                bradyTachyStartTime={session.bradyTachyStartTime}
                pregnancyActive={session.pregnancyActive}
                pregnancyCauses={session.pregnancyCauses}
                pregnancyInterventions={session.pregnancyInterventions}
                pregnancyStartTime={session.pregnancyStartTime}
                specialCircumstances={session.specialCircumstances}
                cprCycleRemaining={timerState.cprCycleRemaining}
                epiRemaining={timerState.epiRemaining}
                preShockAlert={timerState.preShockAlert}
                rhythmCheckDue={timerState.rhythmCheckDue}
                totalElapsed={timerState.totalElapsed}
                totalCPRTime={timerState.totalCPRTime}
                canGiveEpinephrine={buttonStates.canGiveEpinephrine}
                canGiveAmiodarone={buttonStates.canGiveAmiodarone}
                canGiveLidocaine={buttonStates.canGiveLidocaine}
                epiDue={buttonStates.epiDue}
                preferLidocaine={settings.preferLidocaine}
                vibrationEnabled={settings.vibrationEnabled}
                onSetWeight={actions.setPatientWeight}
                onEpinephrine={actions.giveEpinephrine}
                onAmiodarone={actions.giveAmiodarone}
                onLidocaine={actions.giveLidocaine}
                onRhythmCheck={actions.startRhythmCheck}
                onAirwayChange={actions.setAirway}
                onETCO2Record={actions.recordETCO2}
                onCPRRatioChange={actions.setCPRRatio}
                onUpdateHsAndTs={actions.updateHsAndTs}
                onTogglePregnancy={actions.togglePregnancy}
                onUpdatePregnancyCauses={actions.updatePregnancyCauses}
                onUpdatePregnancyInterventions={actions.updatePregnancyInterventions}
                onDeliveryAlert={handleDeliveryAlert}
                onToggleSpecialCircumstance={actions.toggleSpecialCircumstance}
              />
            )}

            {/* Rhythm Check Modal */}
            {isInRhythmCheck && (
              <RhythmCheckModal
                isShockable={session.currentRhythm === 'vf_pvt'}
                currentEnergy={shockEnergy.display}
                shockNumber={session.shockCount + 1}
                onShock={() => {
                  announce('shock');
                  actions.completeRhythmCheckWithShock(shockEnergy.value);
                }}
                onNoShockAsystole={() => {
                  announce('noShock');
                  actions.completeRhythmCheckNoShock('asystole');
                }}
                onNoShockPEA={() => {
                  announce('noShock');
                  actions.completeRhythmCheckNoShock('pea');
                }}
                onROSC={actions.achieveROSC}
                onTerminate={actions.terminateCode}
              />
            )}

            {/* Post-ROSC Screen */}
            {isPostROSC && (
              <>
                <CodeTimeline interventions={session.interventions} startTime={session.startTime} bradyTachyStartTime={session.bradyTachyStartTime} />
                <PostROSCScreen
                  checklist={session.postROSCChecklist}
                  vitals={session.postROSCVitals}
                  onChecklistUpdate={actions.updatePostROSCChecklist}
                  onVitalsUpdate={actions.updatePostROSCVitals}
                  onExport={actions.exportSession}
                  onNewCode={handleNewCode}
                />
              </>
            )}

            {/* Code Ended View */}
            {isCodeEnded && (
              <CodeEndedView
                interventions={session.interventions}
                startTime={session.startTime}
                bradyTachyStartTime={session.bradyTachyStartTime}
                endTime={session.endTime}
                totalElapsed={timerState.totalElapsed}
                totalCPRTime={timerState.totalCPRTime}
                shockCount={session.shockCount}
                epinephrineCount={session.epinephrineCount}
                amiodaroneCount={session.amiodaroneCount}
                onExport={actions.exportSession}
                onNewCode={handleNewCode}
              />
            )}
          </div>
        </ScrollArea>

        {/* Bottom Action Buttons - Always visible during active code */}
        {(isActive || isCPRPendingRhythm) && !isInRhythmCheck && (
          <div className="border-t border-moderate p-2 sm:p-3 bg-background">
            <div className="max-w-lg mx-auto space-y-2">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  onClick={actions.achieveROSC}
                  className="h-12 sm:h-14 gap-1 sm:gap-2 touch-target bg-acls-success hover:bg-acls-success/90 text-white font-bold btn-3d btn-3d-success"
                  aria-label={t('actions.rosc')}
                >
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t('actions.rosc')}
                </Button>
                <Button
                  onClick={actions.terminateCode}
                  variant="outline"
                  className="h-12 sm:h-14 gap-1 sm:gap-2 touch-target border-destructive text-destructive hover:bg-destructive/10 btn-3d-sm btn-3d-critical"
                  aria-label={t('actions.terminate')}
                >
                  <span className="hidden sm:inline">{t('actions.terminate')}</span>
                  <span className="sm:hidden">{t('history.deceased')}</span>
                </Button>
              </div>
              <Button
                onClick={() => setShowNoteDialog(true)}
                variant="outline"
                className="w-full h-10 sm:h-12 gap-1 sm:gap-2 touch-target text-clinical-sm btn-3d-sm btn-3d-muted"
                aria-label={t('actions.addNote')}
              >
                <StickyNote className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('actions.addNote')}
              </Button>
            </div>
          </div>
        )}

        {/* Footer Stats Bar - Visible during active code */}
        {(isActive || isCPRPendingRhythm || isPostROSC) && (
          <FooterStatsBar
            epinephrineCount={session.epinephrineCount}
            amiodaroneCount={session.amiodaroneCount}
            lidocaineCount={session.lidocaineCount}
            shockCount={session.shockCount}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
