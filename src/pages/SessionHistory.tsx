import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllSessions, deleteSession, deleteSessions, StoredSession } from '@/lib/sessionStorage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, Heart, XCircle, Clock, Zap, Syringe, ChevronDown, ChevronUp, Activity, AlertTriangle, User, Baby, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useSettings } from '@/hooks/useSettings';
import { formatEtco2Value, getEtco2UnitLabel } from '@/lib/etco2Units';

type FilterMode = 'all' | 'adult' | 'pediatric' | 'rhythm';

export default function SessionHistory() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSessions();
  }, []);

  // Clear selections when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterMode]);

  const loadSessions = async () => {
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (error) {
      logger.error('Failed to load sessions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('history.confirmDelete'))) return;

    try {
      await deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success(t('history.sessionDeleted'));
    } catch (error) {
      toast.error(t('history.deleteFailed'));
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmMessage = count === 1
      ? t('history.confirmDelete')
      : t('history.confirmDeleteMultiple', { count });

    if (!confirm(confirmMessage)) return;

    try {
      await deleteSessions(Array.from(selectedIds));
      setSessions(sessions.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      toast.success(t('history.sessionsDeleted', { count }));
    } catch (error) {
      toast.error(t('history.deleteFailed'));
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSessions.length && filteredSessions.length > 0) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all filtered sessions
      setSelectedIds(new Set(filteredSessions.map(s => s.id)));
    }
  };

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Helper to determine reference time for elapsed time calculations
  const getReferenceTime = (session: StoredSession): number => {
    const { startTime, bradyTachyStartTime, interventions } = session;

    // If bradyTachyStartTime is explicitly set and earlier than startTime, use it
    if (bradyTachyStartTime && bradyTachyStartTime < startTime) {
      return bradyTachyStartTime;
    }

    // Otherwise, auto-detect by finding the earliest intervention timestamp
    // This handles old sessions that don't have bradyTachyStartTime set
    if (interventions.length > 0) {
      const earliestTimestamp = Math.min(...interventions.map(i => i.timestamp));

      // If the earliest intervention is before startTime, use it as reference
      // This indicates a BradyTachy-to-arrest transition in an old session
      if (earliestTimestamp < startTime) {
        return earliestTimestamp;
      }
    }

    // Default to startTime
    return startTime;
  };

  const formatTime = (timestamp: number, referenceTime: number) => {
    const elapsed = timestamp - referenceTime;
    // Ensure non-negative time - if negative, show 00:00
    const safeElapsed = Math.max(0, elapsed);
    const min = Math.floor(safeElapsed / 60000);
    const sec = Math.floor((safeElapsed % 60000) / 1000);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const etco2UnitLabel = getEtco2UnitLabel(settings.etco2Unit);

  const getHsTsChecked = (hsAndTs: StoredSession['hsAndTs']) => {
    if (!hsAndTs) return [];
    const checked: string[] = [];
    if (hsAndTs.hypovolemia) checked.push(t('hsTs.hypovolemia'));
    if (hsAndTs.hypoxia) checked.push(t('hsTs.hypoxia'));
    if (hsAndTs.hydrogenIon) checked.push(t('hsTs.hydrogenIon'));
    if (hsAndTs.hypoHyperkalemia) checked.push(t('hsTs.hypoHyperkalemia'));
    if (hsAndTs.hypothermia) checked.push(t('hsTs.hypothermia'));
    if (hsAndTs.tensionPneumothorax) checked.push(t('hsTs.tensionPneumo'));
    if (hsAndTs.tamponade) checked.push(t('hsTs.tamponade'));
    if (hsAndTs.toxins) checked.push(t('hsTs.toxins'));
    if (hsAndTs.thrombosisPulmonary) checked.push(t('hsTs.thrombosisPulm'));
    if (hsAndTs.thrombosisCoronary) checked.push(t('hsTs.thrombosisCoro'));
    return checked;
  };

  const getPostROSCActions = (checklist: StoredSession['postROSCChecklist']) => {
    if (!checklist) return { done: [], notDone: [] };
    const done: string[] = [];
    const notDone: string[] = [];
    
    const items = [
      { key: 'airwaySecured', label: t('postRosc.airwaySecured') },
      { key: 'ventilationOptimized', label: t('postRosc.ventilationOptimized') },
      { key: 'hemodynamicsOptimized', label: t('postRosc.hemodynamicsOptimized') },
      { key: 'twelveLeadECG', label: t('postRosc.twelveLeadECG') },
      { key: 'labsOrdered', label: t('postRosc.labsOrdered') },
      { key: 'temperatureManagement', label: t('postRosc.temperatureManagement') },
      { key: 'neurologicalAssessment', label: t('postRosc.neurologicalAssessment') },
    ];

    items.forEach(item => {
      if (checklist[item.key as keyof typeof checklist] === true) {
        done.push(item.label);
      } else {
        notDone.push(item.label);
      }
    });

    return { done, notDone };
  };

  const filteredSessions = sessions.filter(session => {
    if (filterMode === 'all') return true;

    // Rhythm filter: show bradytachy and bradytachy-arrest sessions
    if (filterMode === 'rhythm') {
      return session.sessionType === 'bradytachy' || session.sessionType === 'bradytachy-arrest';
    }

    // Adult/Pediatric filters: show cardiac-arrest sessions + bradytachy-arrest (hybrid)
    const mode = session.pathwayMode || 'adult';
    if (mode === filterMode) {
      return session.sessionType === 'cardiac-arrest' || session.sessionType === 'bradytachy-arrest';
    }

    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-3">{t('history.title')}</h1>

        {/* Bulk actions */}
        {filteredSessions.length > 0 && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedIds.size === filteredSessions.length && filteredSessions.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {t('history.selectAll')}
                {selectedIds.size > 0 && ` (${selectedIds.size})`}
              </label>
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('history.deleteSelected', { count: selectedIds.size })}
              </Button>
            )}
          </div>
        )}

        {/* Filter buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filterMode === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterMode('all')}
            className="gap-1"
          >
            <Filter className="h-3 w-3" />
            {t('history.all')}
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'adult' ? 'default' : 'outline'}
            onClick={() => setFilterMode('adult')}
            className={cn(
              "gap-1",
              filterMode === 'adult' && "bg-acls-adult text-white border-acls-adult hover:bg-acls-adult/90"
            )}
          >
            <User className="h-3 w-3" />
            {t('history.adult')}
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'pediatric' ? 'default' : 'outline'}
            onClick={() => setFilterMode('pediatric')}
            className={cn(
              "gap-1",
              filterMode === 'pediatric' && "bg-acls-pediatric text-white border-acls-pediatric hover:bg-acls-pediatric/90"
            )}
          >
            <Baby className="h-3 w-3" />
            {t('history.pediatric')}
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'rhythm' ? 'default' : 'outline'}
            onClick={() => setFilterMode('rhythm')}
            className={cn(
              "gap-1",
              filterMode === 'rhythm' && "bg-acls-warning text-white border-acls-warning hover:bg-acls-warning/90"
            )}
          >
            <Activity className="h-3 w-3" />
            {t('history.rhythm')}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t('history.noSessions')}
              </h2>
              <p className="text-muted-foreground">
                {t('history.startNew')}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isExpanded = expandedId === session.id;
              const hsTsChecked = getHsTsChecked(session.hsAndTs);
              const postROSCActions = getPostROSCActions(session.postROSCChecklist);
              const pathwayMode = session.pathwayMode || 'adult';
              // Default to 'cardiac-arrest' for old sessions without sessionType
              const sessionType = session.sessionType || 'cardiac-arrest';
              // Calculate reference time once for this session
              const referenceTime = getReferenceTime(session);

              return (
                <Collapsible
                  key={session.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedId(isExpanded ? null : session.id)}
                >
                  <div className={cn(
                    "bg-card rounded-lg border p-4 space-y-3",
                    pathwayMode === 'adult' ? 'border-acls-adult/30' : 'border-acls-pediatric/30',
                    selectedIds.has(session.id) && 'ring-2 ring-primary'
                  )}>
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.has(session.id)}
                        onCheckedChange={() => toggleSelection(session.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 flex items-start justify-between">
                        <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {/* Show Rhythm badge for bradytachy sessions */}
                          {(sessionType === 'bradytachy' || sessionType === 'bradytachy-arrest') && (
                            <Badge
                              variant="outline"
                              className="text-xs border-acls-warning text-acls-warning"
                            >
                              <Activity className="h-3 w-3 mr-1" />
                              {t('history.rhythm')}
                            </Badge>
                          )}
                          {/* Show Adult/Pediatric badge for cardiac arrest sessions (including hybrid) */}
                          {(sessionType === 'cardiac-arrest' || sessionType === 'bradytachy-arrest') && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                pathwayMode === 'adult'
                                  ? 'border-acls-adult text-acls-adult'
                                  : 'border-acls-pediatric text-acls-pediatric'
                              )}
                            >
                              {pathwayMode === 'adult' ? (
                                <><User className="h-3 w-3 mr-1" />{t('history.adult')}</>
                              ) : (
                                <><Baby className="h-3 w-3 mr-1" />{t('history.pediatric')}</>
                              )}
                            </Badge>
                          )}
                          {pathwayMode === 'pediatric' && session.patientWeight && (
                            <span className="text-xs text-muted-foreground">
                              {session.patientWeight}kg
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(session.startTime)}
                        </div>
                        <div className={cn(
                          'inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-full text-sm font-medium',
                          session.outcome === 'rosc'
                            ? 'bg-acls-success/20 text-acls-success'
                            : session.outcome === 'resolved'
                            ? 'bg-acls-success/20 text-acls-success'
                            : session.outcome === 'deceased'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {session.outcome === 'rosc' ? (
                            <Heart className="h-4 w-4" />
                          ) : session.outcome === 'resolved' ? (
                            <Activity className="h-4 w-4" />
                          ) : session.outcome === 'deceased' ? (
                            <XCircle className="h-4 w-4" />
                          ) : null}
                          {session.outcome === 'rosc'
                            ? t('history.rosc')
                            : session.outcome === 'resolved'
                            ? t('history.resolved')
                            : session.outcome === 'deceased'
                            ? t('history.deceased')
                            : t('history.unknown')}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    {sessionType === 'bradytachy' ? (
                      /* Bradytachy-only sessions: show only duration */
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">{t('codeEnded.duration')}</div>
                          <div className="font-semibold">{formatDuration(session.duration)}</div>
                        </div>
                      </div>
                    ) : (
                      /* Cardiac arrest and hybrid sessions: show full stats */
                      <>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-muted-foreground">{t('codeEnded.duration')}</div>
                              <div className="font-semibold">{formatDuration(session.duration)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-acls-shockable" />
                            <div>
                              <div className="text-muted-foreground">{t('codeEnded.shocks')}</div>
                              <div className="font-semibold">{session.shockCount}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Syringe className="h-4 w-4 text-acls-warning" />
                            <div>
                              <div className="text-muted-foreground">{t('codeEnded.epi')}</div>
                              <div className="font-semibold">{session.epinephrineCount}</div>
                            </div>
                          </div>
                        </div>

                        {/* CPR Fraction */}
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                          <span className="text-muted-foreground">{t('codeEnded.cprFraction')}</span>
                          <span className="font-semibold">{session.cprFraction.toFixed(1)}%</span>
                        </div>
                      </>
                    )}

                    {/* Expand button */}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full gap-2">
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            {t('history.showLess')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            {t('history.showMore')}
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    {/* Expanded Details */}
                    <CollapsibleContent className="space-y-4">
                      {/* EtCO2 Readings */}
                      {session.etco2Readings && session.etco2Readings.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-primary" />
                            {t('history.etco2')} {t('history.readings')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {session.etco2Readings.map((reading, idx) => (
                              <Badge key={idx} variant="secondary" className="font-mono">
                                {formatTime(reading.timestamp, referenceTime)}: {formatEtco2Value(reading.value, settings.etco2Unit)} {etco2UnitLabel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* H's & T's */}
                      {hsTsChecked.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-acls-warning" />
                            {t('hsTs.title')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {hsTsChecked.map((item, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Obstetric Cardiac Arrest */}
                      {session.pregnancyActive && (
                        <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/30">
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-pink-400">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <ellipse cx="12" cy="14" rx="6" ry="7" />
                              <circle cx="12" cy="6" r="3" />
                            </svg>
                            {t('pregnancy.title')}
                          </h4>
                          
                          {/* Interventions Done */}
                          {session.pregnancyInterventions && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground mb-1">{t('pregnancy.interventions')}:</p>
                              <div className="flex flex-wrap gap-1">
                                {session.pregnancyInterventions.fundusAtUmbilicus && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0">✓ {t('pregnancy.fundusAtUmbilicus')}</Badge>
                                )}
                                {session.pregnancyInterventions.leftUterineDisplacement && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0">✓ {t('pregnancy.leftUterineDisplacement')}</Badge>
                                )}
                                {session.pregnancyInterventions.earlyAirway && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0">✓ {t('pregnancy.earlyAirway')}</Badge>
                                )}
                                {session.pregnancyInterventions.ivAboveDiaphragm && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0">✓ {t('pregnancy.ivAboveDiaphragm')}</Badge>
                                )}
                                {session.pregnancyInterventions.stopMagnesiumGiveCalcium && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0">✓ {t('pregnancy.stopMagnesium')}</Badge>
                                )}
                                {session.pregnancyInterventions.detachFetalMonitors && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0">✓ {t('pregnancy.detachMonitors')}</Badge>
                                )}
                                {session.pregnancyInterventions.massiveTransfusion && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0">✓ {t('pregnancy.massiveTransfusion')}</Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Causes Considered */}
                          {session.pregnancyCauses && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('pregnancy.causesConsidered')}:</p>
                              <div className="flex flex-wrap gap-1">
                                {session.pregnancyCauses.anestheticComplications && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">A - {t('pregnancy.anesthetic')}</Badge>
                                )}
                                {session.pregnancyCauses.bleeding && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">B - {t('pregnancy.bleeding')}</Badge>
                                )}
                                {session.pregnancyCauses.cardiovascular && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">C - {t('pregnancy.cardiovascular')}</Badge>
                                )}
                                {session.pregnancyCauses.drugs && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">D - {t('pregnancy.drugs')}</Badge>
                                )}
                                {session.pregnancyCauses.embolic && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">E - {t('pregnancy.embolic')}</Badge>
                                )}
                                {session.pregnancyCauses.fever && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">F - {t('pregnancy.fever')}</Badge>
                                )}
                                {session.pregnancyCauses.generalCauses && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">G - {t('pregnancy.generalHsTs')}</Badge>
                                )}
                                {session.pregnancyCauses.hypertension && (
                                  <Badge variant="outline" className="text-xs text-pink-400 border-pink-400/30">H - {t('pregnancy.hypertension')}</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Full Timeline */}
                      {session.interventions && session.interventions.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold mb-2">
                            {t('timeline.title')} ({session.interventions.length} {t('timeline.events')})
                          </h4>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {session.interventions.map((intervention, idx) => {
                              let displayText: string;
                              if (intervention.type === 'etco2') {
                                const canonicalValue = typeof intervention.value === 'number'
                                  ? intervention.value
                                  : Number(intervention.value);

                                if (Number.isFinite(canonicalValue)) {
                                  displayText = t('interventions.etco2Recorded', {
                                    value: formatEtco2Value(canonicalValue, settings.etco2Unit),
                                    unit: etco2UnitLabel,
                                  });
                                } else if (intervention.translationKey) {
                                  displayText = t(intervention.translationKey, intervention.translationParams || {});
                                } else {
                                  displayText = intervention.details;
                                }
                              } else {
                                displayText = intervention.translationKey
                                  ? t(intervention.translationKey, intervention.translationParams || {})
                                  : intervention.details;
                              }

                              return (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                  <span className="font-mono text-muted-foreground whitespace-nowrap">
                                    {formatTime(intervention.timestamp, referenceTime)}
                                  </span>
                                  <span className="text-foreground">{displayText}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Post-ROSC Section */}
                      {session.outcome === 'rosc' && session.postROSCChecklist && (
                        <div className="bg-acls-success/10 rounded-lg p-3 border border-acls-success/30">
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-acls-success">
                            <Heart className="h-4 w-4" />
                            {t('history.postRoscCare')}
                          </h4>
                          
                          {/* Vitals */}
                          {session.postROSCVitals && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-1">{t('postRosc.vitalTargets')}:</p>
                              <div className="flex flex-wrap gap-2">
                                {session.postROSCVitals.spo2 && (
                                  <Badge variant="secondary" className="text-xs">{t('history.spo2')}: {session.postROSCVitals.spo2}%</Badge>
                                )}
                                {session.postROSCVitals.map && (
                                  <Badge variant="secondary" className="text-xs">{t('history.map')}: {session.postROSCVitals.map} mmHg</Badge>
                                )}
                                {session.postROSCVitals.temperature && (
                                  <Badge variant="secondary" className="text-xs">{t('history.temp')}: {session.postROSCVitals.temperature}°C</Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions done */}
                          {postROSCActions.done.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground mb-1">{t('history.actionsDone')}:</p>
                              <div className="flex flex-wrap gap-1">
                                {postROSCActions.done.map((action, idx) => (
                                  <Badge key={idx} className="text-xs bg-acls-success/20 text-acls-success border-0">
                                    ✓ {action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions not done */}
                          {postROSCActions.notDone.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('history.actionsNotDone')}:</p>
                              <div className="flex flex-wrap gap-1">
                                {postROSCActions.notDone.map((action, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                                    ✗ {action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function HistoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
