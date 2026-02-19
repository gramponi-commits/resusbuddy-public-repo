import { useTranslation } from 'react-i18next';
import { Shield, Database, Lock, Trash2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">{t('privacy.title')}</h1>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        {t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}
      </p>

      {/* Introduction */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('privacy.introTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t('privacy.introP1')}</p>
          <p>{t('privacy.introP2')}</p>
        </CardContent>
      </Card>

      {/* Data We Collect */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            {t('privacy.dataCollectedTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>{t('privacy.dataCollectedIntro')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t('privacy.dataCollectedItem1')}</li>
            <li>{t('privacy.dataCollectedItem2')}</li>
            <li>{t('privacy.dataCollectedItem3')}</li>
            <li>{t('privacy.dataCollectedItem4')}</li>
          </ul>
          <p className="font-medium">{t('privacy.dataCollectedNote')}</p>
        </CardContent>
      </Card>

      {/* Data Storage */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            {t('privacy.dataStorageTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t('privacy.dataStorageP1')}</p>
          <p>{t('privacy.dataStorageP2')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t('privacy.dataStorageItem1')}</li>
            <li>{t('privacy.dataStorageItem2')}</li>
            <li>{t('privacy.dataStorageItem3')}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('privacy.dataSharingTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">{t('privacy.dataSharingP1')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t('privacy.dataSharingItem1')}</li>
            <li>{t('privacy.dataSharingItem2')}</li>
            <li>{t('privacy.dataSharingItem3')}</li>
            <li>{t('privacy.dataSharingItem4')}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trash2 className="h-5 w-5 text-primary" />
            {t('privacy.yourRightsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t('privacy.yourRightsIntro')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t('privacy.yourRightsItem1')}</li>
            <li>{t('privacy.yourRightsItem2')}</li>
            <li>{t('privacy.yourRightsItem3')}</li>
          </ul>
          <p>{t('privacy.yourRightsNote')}</p>
        </CardContent>
      </Card>

      {/* Children's Privacy */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('privacy.childrenTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{t('privacy.childrenP1')}</p>
        </CardContent>
      </Card>

      {/* Changes to Policy */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('privacy.changesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{t('privacy.changesP1')}</p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            {t('privacy.contactTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            {t('privacy.contactP1')}{' '}
            <a
              href={`mailto:${t('privacy.contactEmail')}`}
              className="text-primary hover:underline"
            >
              {t('privacy.contactEmail')}
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        ResusBuddy v1.0
      </p>
    </div>
  );
};

export default Privacy;
