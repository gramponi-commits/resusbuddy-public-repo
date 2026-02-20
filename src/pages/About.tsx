import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Gift, BookOpen, Shield, Info, ExternalLink, Share2, Copy, Mail, MessageCircle, ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { TermsOfServiceModal } from '@/components/TermsOfServiceModal';

const About = () => {
  const { t } = useTranslation();
  const [tosModalOpen, setTosModalOpen] = useState(false);
  const appUrl = window.location.origin;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      toast({ title: t('about.linkCopied') });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ResusBuddy',
          text: t('about.shareText'),
          url: appUrl,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${t('about.shareText')} ${appUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('ResusBuddy');
    const body = encodeURIComponent(`${t('about.shareText')}\n\n${appUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">{t('about.title')}</h1>
      </div>

      {/* Share */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-primary" />
            {t('about.shareTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-3">{t('about.shareDesc')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              {t('about.copyLink')}
            </Button>
            {navigator.share && (
              <Button variant="outline" size="sm" onClick={handleNativeShare}>
                <Share2 className="h-4 w-4 mr-2" />
                {t('about.share')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleWhatsAppShare}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmailShare}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Developer Credits */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            {t('about.developerTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <a 
            href="https://www.linkedin.com/in/g-r-078715203/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
          >
            {t('about.developerName')}
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            {t('about.usageTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('about.usageFree')}
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              {t('about.usageLocalData')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('about.usageOffline')}
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* References */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            {t('about.referencesTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <a
              href="https://www.ahajournals.org/doi/10.1161/CIR.0000000000001376"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
            >
              {t('about.referencesAdult')}
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://www.ahajournals.org/doi/10.1161/CIR.0000000000001368"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
            >
              {t('about.referencesPediatric')}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Terms of Service */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="h-5 w-5 text-primary" />
            {t('tos.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setTosModalOpen(true)}
            className="w-full"
          >
            {t('tos.viewTerms')}
          </Button>
        </CardContent>
      </Card>

      {/* TOS Modal */}
      <TermsOfServiceModal
        open={tosModalOpen}
        onOpenChange={setTosModalOpen}
      />

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        {t('about.version')} 2.0
      </p>
    </div>
  );
};

export default About;
