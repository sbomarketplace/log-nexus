import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isNative } from './platform';

export async function nativeShareFile(blob: Blob, filename: string, text?: string): Promise<void> {
  if (!isNative) {
    // Web fallback - download file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Write file to temporary directory
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache
    });

    // Share the file
    await Share.share({
      title: 'ClearCase Export',
      text: text || `Shared from ClearCase`,
      url: result.uri,
      dialogTitle: 'Share Incident Report'
    });
  } catch (error) {
    console.warn('Native share failed:', error);
    throw error;
  }
}

export async function nativeShareText(text: string, title?: string): Promise<void> {
  if (!isNative) {
    // Web fallback - copy to clipboard or show share modal
    if (navigator.share) {
      await navigator.share({ title, text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } else {
      // Fallback - create mailto
      window.location.href = `mailto:?subject=${encodeURIComponent(title || 'ClearCase Export')}&body=${encodeURIComponent(text)}`;
    }
    return;
  }

  try {
    await Share.share({
      title: title || 'ClearCase Export',
      text,
      dialogTitle: 'Share Content'
    });
  } catch (error) {
    console.warn('Native text share failed:', error);
    throw error;
  }
}