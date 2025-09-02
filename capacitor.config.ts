import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clearcase.app',
  appName: 'ClearCase',
  webDir: 'dist',
  plugins: {
    PrivacyScreen: {
      enable: false,  // Let runtime toggle control it
      showInAppSwitcher: false,
      imageName: 'splash.png'
    }
  },
  ios: {
    contentInset: 'always'
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
