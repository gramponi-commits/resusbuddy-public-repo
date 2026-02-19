import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Smartphone,
  Share,
  Plus,
  Check,
  Wifi,
  Zap,
  RefreshCw,
  Battery,
  ExternalLink
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type DeviceType = 'ios' | 'android' | 'desktop';

function getDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

export default function InstallHelp() {
  const { t } = useTranslation();
  const { isInstalled } = usePWAInstall();
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [iosOpen, setIosOpen] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);

  useEffect(() => {
    const detected = getDeviceType();
    setDeviceType(detected);
    // Auto-expand the relevant section
    if (detected === 'ios') setIosOpen(true);
    else if (detected === 'android') setAndroidOpen(true);
    else {
      setIosOpen(true);
      setAndroidOpen(true);
    }
  }, []);

  const StepItem = ({ number, icon: Icon, title, description }: { 
    number: number; 
    icon: React.ComponentType<{ className?: string }>; 
    title: string; 
    description: string;
  }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-medium">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  const BenefitItem = ({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) => (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('install.title')}</h1>
        <p className="text-muted-foreground">{t('install.subtitle')}</p>
      </div>

      {/* Already Installed Badge */}
      {isInstalled && (
        <Card className="border-green-500 bg-green-500/10">
          <CardContent className="flex items-center justify-center gap-3 py-4">
            <Check className="h-6 w-6 text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-400">
              {t('install.alreadyInstalled')}
            </span>
          </CardContent>
        </Card>
      )}

      {/* iOS Instructions */}
      <Collapsible open={iosOpen} onOpenChange={setIosOpen}>
        <Card className={cn(deviceType === 'ios' && 'ring-2 ring-primary')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-lg">{t('install.iosTitle')}</span>
                  {deviceType === 'ios' && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {t('install.yourDevice')}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ {t('install.iosNote')}
                </p>
              </div>
              <StepItem 
                number={1} 
                icon={Share} 
                title={t('install.iosStep1Title')} 
                description={t('install.iosStep1Desc')} 
              />
              <StepItem 
                number={2} 
                icon={Plus} 
                title={t('install.iosStep2Title')} 
                description={t('install.iosStep2Desc')} 
              />
              <StepItem 
                number={3} 
                icon={Check} 
                title={t('install.iosStep3Title')} 
                description={t('install.iosStep3Desc')} 
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Android Instructions */}
      <Collapsible open={androidOpen} onOpenChange={setAndroidOpen}>
        <Card className={cn(deviceType === 'android' && 'ring-2 ring-primary')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600 dark:text-green-400" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.463 11.463 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-lg">{t('install.androidTitle')}</span>
                  {deviceType === 'android' && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {t('install.yourDevice')}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('install.androidPlayStoreDesc')}
              </p>
              <a
                href="https://play.google.com/store/apps/details?id=com.resusbuddy.training"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
                {t('install.androidPlayStoreButton')}
              </a>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('install.benefitsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <BenefitItem icon={Wifi} text={t('install.benefit1')} />
          <BenefitItem icon={Zap} text={t('install.benefit2')} />
          <BenefitItem icon={Battery} text={t('install.benefit3')} />
          <BenefitItem icon={RefreshCw} text={t('install.benefit4')} />
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-center text-sm text-muted-foreground py-4">
        {t('install.footer')}
      </p>
    </div>
  );
}
