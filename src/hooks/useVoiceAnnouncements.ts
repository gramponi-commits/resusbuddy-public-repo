import { useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

type AnnouncementType = 'rhythmCheck' | 'preCharge' | 'epiDue' | 'resumeCPR' | 'rosc' | 'amiodaroneDue' | 'lidocaineDue' | 'shock' | 'noShock' | 'emergencyDelivery' | 'ecmoAvailable';

// Priority order: lower number = higher priority
const ANNOUNCEMENT_PRIORITY: Record<AnnouncementType, number> = {
  emergencyDelivery: 0,
  rhythmCheck: 1,
  preCharge: 2,
  shock: 3,
  noShock: 3,
  resumeCPR: 4,
  rosc: 5,
  epiDue: 6,
  amiodaroneDue: 7,
  lidocaineDue: 7,
  ecmoAvailable: 1,
};

// Check if running on native platform (Android/iOS)
const isNativePlatform = Capacitor.isNativePlatform();

export function useVoiceAnnouncements() {
  const { t, i18n } = useTranslation();
  const enabledRef = useRef<boolean>(false);
  const queueRef = useRef<AnnouncementType[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const lastAnnouncedRef = useRef<Set<AnnouncementType>>(new Set());

  // Get language code for TTS
  const getLanguageCode = useCallback(() => {
    return i18n.language === 'it' ? 'it-IT' : 'en-US';
  }, [i18n.language]);

  // Native TTS speak function
  const speakNative = useCallback(async (text: string, type: AnnouncementType) => {
    try {
      await TextToSpeech.speak({
        text,
        lang: getLanguageCode(),
        rate: 1.1,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });

      isSpeakingRef.current = false;
      // Clear from recent announcements after delay
      setTimeout(() => {
        lastAnnouncedRef.current.delete(type);
      }, 3000);
      // Process next in queue
      setTimeout(() => processQueue(), 300);
    } catch (error) {
      console.error('Native TTS error:', error);
      isSpeakingRef.current = false;
      setTimeout(() => processQueue(), 100);
    }
  }, [getLanguageCode]);

  // Web Speech API speak function
  const speakWeb = useCallback((text: string, type: AnnouncementType) => {
    // Cancel any ongoing speech
    window.speechSynthesis?.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode();
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      // Clear from recent announcements after delay
      setTimeout(() => {
        lastAnnouncedRef.current.delete(type);
      }, 3000);
      // Process next in queue
      setTimeout(() => processQueue(), 300);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setTimeout(() => processQueue(), 100);
    };

    window.speechSynthesis?.speak(utterance);
  }, [getLanguageCode]);

  const processQueue = useCallback(() => {
    if (!enabledRef.current || isSpeakingRef.current || queueRef.current.length === 0) {
      return;
    }

    // Sort queue by priority
    queueRef.current.sort((a, b) => ANNOUNCEMENT_PRIORITY[a] - ANNOUNCEMENT_PRIORITY[b]);

    const type = queueRef.current.shift();
    if (!type) return;

    // Skip if already announced recently
    if (lastAnnouncedRef.current.has(type)) {
      processQueue();
      return;
    }

    isSpeakingRef.current = true;
    lastAnnouncedRef.current.add(type);

    const announcements: Record<AnnouncementType, string> = {
      emergencyDelivery: t('voice.emergencyDelivery'),
      rhythmCheck: t('voice.rhythmCheck'),
      preCharge: t('voice.preCharge'),
      epiDue: t('voice.epiDue'),
      resumeCPR: t('voice.resumeCPR'),
      rosc: t('voice.rosc'),
      amiodaroneDue: t('voice.amiodaroneDue'),
      lidocaineDue: t('voice.lidocaineDue'),
      shock: t('voice.shock'),
      noShock: t('voice.noShock'),
      ecmoAvailable: t('voice.ecmoAvailable'),
    };

    const text = announcements[type];

    // Use native TTS on Android/iOS, fallback to Web Speech API on web
    if (isNativePlatform) {
      speakNative(text, type);
    } else if ('speechSynthesis' in window) {
      speakWeb(text, type);
    } else {
      isSpeakingRef.current = false;
      setTimeout(() => processQueue(), 100);
    }
  }, [t, speakNative, speakWeb]);

  const announce = useCallback((type: AnnouncementType) => {
    if (!enabledRef.current) return;

    // Check availability: native platform or web speech synthesis
    if (!isNativePlatform && !('speechSynthesis' in window)) return;

    // Don't add duplicates to queue
    if (!queueRef.current.includes(type) && !lastAnnouncedRef.current.has(type)) {
      queueRef.current.push(type);
      processQueue();
    }
  }, [processQueue]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (!enabled) {
      if (isNativePlatform) {
        TextToSpeech.stop().catch(() => {});
      } else {
        window.speechSynthesis?.cancel();
      }
      queueRef.current = [];
      isSpeakingRef.current = false;
      lastAnnouncedRef.current.clear();
    }
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isNativePlatform) {
        TextToSpeech.stop().catch(() => {});
      } else {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  return {
    announce,
    setEnabled,
    isEnabled,
  };
}
