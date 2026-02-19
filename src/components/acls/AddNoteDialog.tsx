import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNote: (note: string) => void;
}

export function AddNoteDialog({ open, onOpenChange, onAddNote }: AddNoteDialogProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (note.trim()) {
      onAddNote(note.trim());
      setNote('');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('notes.addNote')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder={t('notes.placeholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px]"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {t('notes.hint')}
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!note.trim()}>
            {t('notes.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
