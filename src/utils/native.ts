/* Detect native container */
export const isNative = Boolean((window as any).Capacitor?.isNativePlatform?.());

/* INCIDENT EXPORT ACTIONS (native first, web fallback) */
export async function nativeShareFile(file: File, text?: string, title?: string) {
  if (!isNative) throw new Error("not-native");
  // Bridge method: Share file + text via native share sheet (adds "Save to Files" on iOS)
  return (window as any).__NATIVE__.share({ files: [file], text, title });
}

export async function nativeSaveFile(blob: Blob, filename: string) {
  if (!isNative) throw new Error("not-native");
  // Bridge method: write blob to app documents + trigger system save/chooser if needed
  const buf = await blob.arrayBuffer();
  return (window as any).__NATIVE__.saveFile({ data: buf, filename });
}

export async function nativeToast(message: string) {
  if (!isNative) return;
  return (window as any).__NATIVE__.toast({ message });
}

export async function nativeEmail({ subject, body, files }:{
  subject: string; body: string; files?: File[];
}) {
  if (!isNative) throw new Error("not-native");
  return (window as any).__NATIVE__.email({ subject, body, files });
}

export async function nativePrint({ html, file }:{
  html?: string; file?: File;
}) {
  if (!isNative) throw new Error("not-native");
  return (window as any).__NATIVE__.print({ html, fileName: file?.name, file });
}

export async function nativeSMS({ body }:{ body: string }) {
  if (!isNative) throw new Error("not-native");
  return (window as any).__NATIVE__.sms({ body });
}

// Additional native utilities for Settings
export async function openSystemSettings(type?: 'notifications' | 'privacy' | 'general') {
  if (!isNative) throw new Error("not-native");
  return (window as any).__NATIVE__.system.openSettings({ type });
}

export async function rateApp() {
  if (!isNative) throw new Error("not-native");
  return (window as any).__NATIVE__.system.rateApp();
}

export async function shareDiagnostics(data: any) {
  if (!isNative) throw new Error("not-native");
  return (window as any).__NATIVE__.system.shareDiagnostics(data);
}

export async function requestPermission(type: 'contacts' | 'calendar' | 'notifications') {
  if (!isNative) throw new Error("not-native");
  return (window as any).__NATIVE__.permissions.request({ type });
}

export async function checkPermission(type: 'contacts' | 'calendar' | 'notifications') {
  if (!isNative) return false;
  try {
    const result = await (window as any).__NATIVE__.permissions.check({ type });
    return result.granted || false;
  } catch {
    return false;
  }
}