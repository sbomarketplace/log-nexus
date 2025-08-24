export const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

export const getPlatform = () => {
  if (!isNative) return 'web';
  return (window as any).Capacitor.getPlatform();
};

export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';