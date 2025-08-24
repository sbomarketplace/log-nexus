export const isNative =
  typeof window !== 'undefined' &&
  (window as any).Capacitor?.isNativePlatform === true;