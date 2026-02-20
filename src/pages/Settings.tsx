import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Globe, Volume2, Vibrate, Music, Mic, Pill, Zap, Sun, Moon, Clock, ChevronDown } from 'lucide-react';
import { useSettings, AdultDefibrillatorEnergy, EpinephrineIntervalMinutes, ETCO2Unit } from '@/hooks/useSettings';
import { CriteriaListEditor } from '@/components/CriteriaListEditor';
import { CowboyHatIcon, CapnographyWaveIcon, EcmoIcon } from '@/components/icons/ClinicalIcons';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
];

const adultEnergyOptions: AdultDefibrillatorEnergy[] = [120, 150, 200, 360];
const epinephrineIntervalOptions: EpinephrineIntervalMinutes[] = [3, 4, 5];
const etco2UnitOptions: ETCO2Unit[] = ['mmhg', 'kpa'];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const [showCowboyConfirm, setShowCowboyConfirm] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    general: false,
    feedbackAlerts: false,
    preferences: false,
    ecmo: false,
  });

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('acls-language', langCode);
    localStorage.setItem('acls-language-source', 'user');
  };

  const handleThemeToggle = (isDark: boolean) => {
    updateSetting('theme', isDark ? 'dark' : 'light');
  };

  const toggleGroup = (group: keyof typeof openGroups) => (open: boolean) => {
    setOpenGroups(prev => ({ ...prev, [group]: open }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="p-4 space-y-4 max-w-2xl mx-auto">

          {/* ===== General Group ===== */}
          <div className="rounded-lg border border-border bg-muted/30">
          <Collapsible open={openGroups.general} onOpenChange={toggleGroup('general')}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <h2 className="text-lg font-semibold text-foreground">{t('settings.groupGeneral')}</h2>
                <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', openGroups.general && 'rotate-180')} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-6 border-t border-border">
                {/* Theme */}
                <div className="p-4 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {settings.theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-primary" />
                      ) : (
                        <Sun className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.theme')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.themeDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.theme === 'dark'}
                      onCheckedChange={handleThemeToggle}
                    />
                  </div>
                  <div className="mt-2 pl-[52px]">
                    <span className="text-sm text-muted-foreground">
                      {settings.theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
                    </span>
                  </div>
                </div>

                {/* Language */}
                <div className="p-4 py-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.language')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.languageDesc')}</p>
                    </div>
                    <Select value={i18n.language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>
                          {languages.find(l => l.code === i18n.language)?.flag}{' '}
                          {languages.find(l => l.code === i18n.language)?.nativeName}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.nativeName}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cowboy Mode */}
                <div className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <CowboyHatIcon className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.cowboyMode')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.cowboyModeDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.cowboyMode}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setShowCowboyConfirm(true);
                        } else {
                          updateSetting('cowboyMode', false);
                        }
                      }}
                    />
                  </div>
                  <div className="mt-2 pl-[52px]">
                    <span className={`text-sm ${settings.cowboyMode ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {settings.cowboyMode ? t('settings.cowboyModeActive') : t('settings.cowboyModeInactive')}
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          </div>

          {/* ===== Feedback and Alerts Group ===== */}
          <div className="rounded-lg border border-border bg-muted/30">
          <Collapsible open={openGroups.feedbackAlerts} onOpenChange={toggleGroup('feedbackAlerts')}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <h2 className="text-lg font-semibold text-foreground">{t('settings.groupFeedback')}</h2>
                <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', openGroups.feedbackAlerts && 'rotate-180')} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-6 border-t border-border">
                {/* Audio */}
                <div className="p-4 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Volume2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.audio')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.audioDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                    />
                  </div>
                </div>

                {/* Voice Announcements */}
                <div className="p-4 py-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.voice')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.voiceDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.voiceAnnouncementsEnabled}
                      onCheckedChange={(checked) => updateSetting('voiceAnnouncementsEnabled', checked)}
                    />
                  </div>
                </div>

                {/* Vibration */}
                <div className="p-4 py-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Vibrate className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.vibration')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.vibrationDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.vibrationEnabled}
                      onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
                    />
                  </div>
                </div>

                {/* Metronome */}
                <div className="p-4 pt-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.metronome')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.metronomeDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.metronomeEnabled}
                      onCheckedChange={(checked) => updateSetting('metronomeEnabled', checked)}
                    />
                  </div>
                  {settings.metronomeEnabled && (
                    <div className="mt-4 pl-[52px] space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('settings.metronomeBPM')}:</span>
                        <span className="font-mono font-bold text-foreground text-lg">{settings.metronomeBPM}</span>
                      </div>
                      <Slider
                        value={[settings.metronomeBPM]}
                        onValueChange={([value]) => updateSetting('metronomeBPM', value)}
                        min={100}
                        max={120}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>100</span>
                        <span>110</span>
                        <span>120</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          </div>

          {/* ===== Preferences Group ===== */}
          <div className="rounded-lg border border-border bg-muted/30">
          <Collapsible open={openGroups.preferences} onOpenChange={toggleGroup('preferences')}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <h2 className="text-lg font-semibold text-foreground">{t('settings.groupPreferences')}</h2>
                <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', openGroups.preferences && 'rotate-180')} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-6 border-t border-border">
                {/* Adult Defibrillator Energy */}
                <div className="p-4 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.adultDefibrillator')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.adultDefibrillatorDesc')}</p>
                    </div>
                    <Select
                      value={String(settings.adultDefibrillatorEnergy)}
                      onValueChange={(val) => updateSetting('adultDefibrillatorEnergy', Number(val) as AdultDefibrillatorEnergy)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue>{settings.adultDefibrillatorEnergy}J</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {adultEnergyOptions.map((energy) => (
                          <SelectItem key={energy} value={String(energy)}>
                            {energy}J
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Epinephrine Interval */}
                <div className="p-4 py-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.epinephrineInterval')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.epinephrineIntervalDesc')}</p>
                    </div>
                    <Select
                      value={String(settings.epinephrineIntervalMinutes)}
                      onValueChange={(val) => updateSetting('epinephrineIntervalMinutes', Number(val) as EpinephrineIntervalMinutes)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>{settings.epinephrineIntervalMinutes} {t('settings.minutes')}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {epinephrineIntervalOptions.map((interval) => (
                          <SelectItem key={interval} value={String(interval)}>
                            {interval} {t('settings.minutes')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ETCO2 Unit */}
                <div className="p-4 py-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CapnographyWaveIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.etco2Unit')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.etco2UnitDesc')}</p>
                    </div>
                    <Select
                      value={settings.etco2Unit}
                      onValueChange={(value) => updateSetting('etco2Unit', value as ETCO2Unit)}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue>
                          {settings.etco2Unit === 'mmhg' ? t('settings.etco2UnitMmhg') : t('settings.etco2UnitKpa')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {etco2UnitOptions.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit === 'mmhg' ? t('settings.etco2UnitMmhg') : t('settings.etco2UnitKpa')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Antiarrhythmic Preference */}
                <div className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.antiarrhythmic')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.antiarrhythmicDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.preferLidocaine}
                      onCheckedChange={(checked) => updateSetting('preferLidocaine', checked)}
                    />
                  </div>
                  <div className="mt-2 pl-[52px]">
                    <span className="text-sm text-muted-foreground">
                      {settings.preferLidocaine ? t('settings.usingLidocaine') : t('settings.usingAmiodarone')}
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          </div>

          {/* ===== ECMO Group ===== */}
          <div className="rounded-lg border border-border bg-muted/30">
          <Collapsible open={openGroups.ecmo} onOpenChange={toggleGroup('ecmo')}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <h2 className="text-lg font-semibold text-foreground">{t('settings.groupECMO')}</h2>
                <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', openGroups.ecmo && 'rotate-180')} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <EcmoIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-foreground">{t('settings.ecmo')}</h2>
                      <p className="text-sm text-muted-foreground">{t('settings.ecmoDesc')}</p>
                    </div>
                    <Switch
                      checked={settings.ecmoEnabled}
                      onCheckedChange={(checked) => updateSetting('ecmoEnabled', checked)}
                    />
                  </div>
                  {settings.ecmoEnabled && (
                    <div className="mt-4 pl-[52px] space-y-4">
                      {/* Activation Time Slider */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('settings.ecmoActivationTime')}</span>
                          <span className="font-mono font-bold text-foreground text-lg">{settings.ecmoActivationTimeMinutes} min</span>
                        </div>
                        <Slider
                          value={[settings.ecmoActivationTimeMinutes]}
                          onValueChange={([value]) => updateSetting('ecmoActivationTimeMinutes', value)}
                          min={5}
                          max={60}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>5</span>
                          <span>30</span>
                          <span>60</span>
                        </div>
                      </div>

                      {/* Inclusion Criteria */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-foreground">{t('settings.ecmoInclusionCriteria')}</span>
                        <CriteriaListEditor
                          items={settings.ecmoInclusionCriteria}
                          onAdd={(item) => updateSetting('ecmoInclusionCriteria', [...settings.ecmoInclusionCriteria, item])}
                          onRemove={(idx) => updateSetting('ecmoInclusionCriteria', settings.ecmoInclusionCriteria.filter((_, i) => i !== idx))}
                          placeholder={t('settings.ecmoCriteriaPlaceholder')}
                        />
                      </div>

                      {/* Exclusion Criteria */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-foreground">{t('settings.ecmoExclusionCriteria')}</span>
                        <CriteriaListEditor
                          items={settings.ecmoExclusionCriteria}
                          onAdd={(item) => updateSetting('ecmoExclusionCriteria', [...settings.ecmoExclusionCriteria, item])}
                          onRemove={(idx) => updateSetting('ecmoExclusionCriteria', settings.ecmoExclusionCriteria.filter((_, i) => i !== idx))}
                          placeholder={t('settings.ecmoCriteriaPlaceholder')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          </div>

          {/* Cowboy Mode Confirmation Dialog */}
          <AlertDialog open={showCowboyConfirm} onOpenChange={setShowCowboyConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings.cowboyModeConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('settings.cowboyModeConfirmDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('settings.cowboyModeCancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => updateSetting('cowboyMode', true)}
                >
                  {t('settings.cowboyModeConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ScrollArea>
    </div>
  );
}
