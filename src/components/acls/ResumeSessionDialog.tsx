import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResumeSessionDialogProps {
  open: boolean;
  onResume: () => void;
  onDiscard: () => void;
  sessionDuration: string;
}

export function ResumeSessionDialog({
  open,
  onResume,
  onDiscard,
  sessionDuration,
}: ResumeSessionDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            {t('resume.title', 'Active Code Detected')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('resume.description', 'An interrupted code session was found.')}
            <br />
            <span className="font-semibold">
              {t('resume.duration', 'Duration')}: {sessionDuration}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            {t('resume.discard', 'Start New Code')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onResume} className="bg-destructive hover:bg-destructive/90">
            {t('resume.resume', 'Resume Code')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
