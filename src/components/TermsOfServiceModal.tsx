import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Smartphone, Scale, Mail, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TermsOfServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requireAcceptance?: boolean;
  onAccept?: () => void;
}

export function TermsOfServiceModal({
  open,
  onOpenChange,
  requireAcceptance = false,
  onAccept,
}: TermsOfServiceModalProps) {
  const { t } = useTranslation();
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll state when modal opens
  useEffect(() => {
    if (open) {
      setHasScrolledToEnd(false);
    }
  }, [open]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    if (isAtBottom) {
      setHasScrolledToEnd(true);
    }
  };

  const handleAccept = () => {
    onAccept?.();
    onOpenChange(false);
  };

  const canClose = !requireAcceptance || hasScrolledToEnd;

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent
        className={`max-w-2xl max-h-[90vh] flex flex-col ${requireAcceptance ? '[&>button]:hidden' : ''}`}
        onPointerDownOutside={(e) => {
          if (requireAcceptance && !hasScrolledToEnd) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (requireAcceptance && !hasScrolledToEnd) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{t('tos.title')}</DialogTitle>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 pr-4 min-h-0 max-h-[60vh] overflow-y-auto"
        >
          <div className="space-y-4 pb-4">
            {/* Critical Warning */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.criticalWarningTitle')}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>{t('tos.criticalWarning1')}</li>
                <li>{t('tos.criticalWarning2')}</li>
                <li>{t('tos.criticalWarning3')}</li>
              </ul>
            </section>

            <p className="text-muted-foreground text-xs">
              {t('tos.lastUpdated')}: {t('tos.lastUpdatedDate')}
            </p>

            {/* Background */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.backgroundTitle')}</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('tos.backgroundP1')}</p>
                <p className="font-semibold">{t('tos.backgroundP2')}</p>
                <p>{t('tos.backgroundP3')}</p>
              </div>
            </section>

            <Separator />

            {/* Acceptance of Terms */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.acceptanceTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('tos.acceptanceP1')}</p>
            </section>

            <Separator />

            {/* Intended Use */}
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {t('tos.intendedUseTitle')}
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('tos.intendedUseP1')}</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>{t('tos.intendedUseList1')}</li>
                  <li>{t('tos.intendedUseList2')}</li>
                  <li>{t('tos.intendedUseList3')}</li>
                  <li>{t('tos.intendedUseList4')}</li>
                </ul>
                <p className="font-semibold">{t('tos.intendedUseWarning')}</p>
              </div>
            </section>

            <Separator />

            {/* No Medical Advice */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.noMedicalAdviceTitle')}</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('tos.noMedicalAdviceP1')}</p>
                <p>{t('tos.noMedicalAdviceP2')}</p>
              </div>
            </section>

            <Separator />

            {/* Data Privacy */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.dataPrivacyTitle')}</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('tos.dataPrivacyP1')}</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>{t('tos.dataPrivacyList1')}</li>
                  <li>{t('tos.dataPrivacyList2')}</li>
                  <li>{t('tos.dataPrivacyList3')}</li>
                </ul>
                <p className="font-semibold">{t('tos.dataPrivacyWarning')}</p>
              </div>
            </section>

            <Separator />

            {/* App Store Terms */}
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                {t('tos.appStoreTitle')}
              </h3>
              <div className="text-sm text-muted-foreground space-y-3">
                <div>
                  <h4 className="font-medium mb-1">{t('tos.androidTitle')}</h4>
                  <p>{t('tos.androidP1')}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">{t('tos.appleTitle')}</h4>
                  <p>{t('tos.appleP1')}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* License */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.licenseTitle')}</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('tos.licenseP1')}</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>{t('tos.licenseList1')}</li>
                  <li>{t('tos.licenseList2')}</li>
                  <li>{t('tos.licenseList3')}</li>
                  <li>{t('tos.licenseList4')}</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Intellectual Property */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.intellectualPropertyTitle')}</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('tos.intellectualPropertyP1')}</p>
                <p>{t('tos.intellectualPropertyP2')}</p>
              </div>
            </section>

            <Separator />

            {/* Disclaimers */}
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                {t('tos.disclaimersTitle')}
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold">{t('tos.disclaimersP1')}</p>
                <p>{t('tos.disclaimersP2')}</p>
                <p>{t('tos.disclaimersP3')}</p>
                <p>{t('tos.disclaimersP4')}</p>
              </div>
            </section>

            <Separator />

            {/* Limitation of Liability */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.limitationTitle')}</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('tos.limitationP1')}</p>
                <p>{t('tos.limitationP2')}</p>
              </div>
            </section>

            <Separator />

            {/* Indemnification */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.indemnificationTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('tos.indemnificationP1')}</p>
            </section>

            <Separator />

            {/* Changes to Terms */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.changesTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('tos.changesP1')}</p>
            </section>

            <Separator />

            {/* Termination */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.terminationTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('tos.terminationP1')}</p>
            </section>

            <Separator />

            {/* Governing Law */}
            <section>
              <h3 className="font-semibold mb-2">{t('tos.governingLawTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('tos.governingLawP1')}</p>
            </section>

            <Separator />

            {/* Contact */}
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                {t('tos.contactTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('tos.contactP1')}{' '}
                <a
                  href={`mailto:${t('tos.contactEmail')}`}
                  className="text-primary hover:underline"
                >
                  {t('tos.contactByEmail')}
                </a>
              </p>
            </section>

            <Separator />

            {/* Final Notice */}
            <section>
              <p className="text-sm text-muted-foreground">
                {t('tos.finalNotice')}
              </p>
            </section>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {requireAcceptance && !hasScrolledToEnd && (
            <p className="text-sm text-muted-foreground mr-auto">
              {t('tos.scrollToAccept')}
            </p>
          )}
          {requireAcceptance ? (
            <Button
              onClick={handleAccept}
              disabled={!hasScrolledToEnd}
              className="w-full sm:w-auto"
            >
              {hasScrolledToEnd && <Check className="h-4 w-4 mr-2" />}
              {t('tos.acceptButton')}
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              {t('common.confirm')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
