import { useCallback, useRef, useEffect } from 'react';

type AlertType = 'rhythmCheck' | 'preCharge' | 'epiDue' | 'rosc' | 'metronome';

// Generate audio beeps using Web Audio API
const createBeep = (
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  volume: number = 0.5
): OscillatorNode => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  return oscillator;
};

const ALERT_SOUNDS: Record<AlertType, { frequency: number; duration: number; repeat?: number; interval?: number }> = {
  rhythmCheck: { frequency: 880, duration: 0.3, repeat: 3, interval: 200 },
  preCharge: { frequency: 660, duration: 0.2, repeat: 2, interval: 150 },
  epiDue: { frequency: 440, duration: 0.4, repeat: 2, interval: 300 },
  rosc: { frequency: 523, duration: 0.5, repeat: 1 },
  metronome: { frequency: 1000, duration: 0.05, repeat: 1 },
};

export function useAudioAlerts() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef<boolean>(false);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playAlert = useCallback(async (type: AlertType) => {
    if (!enabledRef.current) return;
    
    const audioContext = initAudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const config = ALERT_SOUNDS[type];
    const playBeep = (delay: number) => {
      setTimeout(() => {
        const oscillator = createBeep(audioContext, config.frequency, config.duration);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + config.duration);
      }, delay);
    };

    for (let i = 0; i < (config.repeat || 1); i++) {
      playBeep(i * (config.interval || 0));
    }
  }, [initAudioContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (enabled) {
      // Initialize audio context on enable to handle autoplay restrictions
      initAudioContext();
    }
  }, [initAudioContext]);

  const isEnabled = useCallback(() => enabledRef.current, []);

  // Vibration support
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return {
    playAlert,
    setEnabled,
    isEnabled,
    vibrate,
    initAudioContext,
  };
}
