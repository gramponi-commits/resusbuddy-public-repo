import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect if the app is running as a native Capacitor app
 * (Android or iOS) vs running as a PWA/web app.
 *
 * @returns {boolean} - true if running in native Capacitor wrapper, false if PWA/web
 */
export function useIsNativeApp(): boolean {
  // Capacitor.isNativePlatform() returns true for iOS and Android
  // Returns false for web/PWA
  return Capacitor.isNativePlatform();
}

/**
 * Non-hook version for use outside of React components
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
